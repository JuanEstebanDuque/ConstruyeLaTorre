// @vitest-environment node
//
// Pruebas de integración de las reglas del juego que viven en Postgres
// (funciones RPC + RLS). Necesitan un backend: `docker compose up`.
// Si no hay backend disponible, se saltan.
import { describe, expect, it } from 'vitest'
import {
  ROLES,
  backendDisponible,
  constructorDe,
  fallo,
  nuevoCliente,
  ok,
  partidaCon,
  partidaIniciada,
  ronda,
  rolesDe,
  validar,
} from './helpers'

const disponible = await backendDisponible()
const TODO_OK = [true, true, true, true]

describe.skipIf(!disponible)('integración con Supabase', { timeout: 30000 }, () => {
  describe('unirse a una partida', () => {
    it('rechaza un código que no existe', async () => {
      const { cliente } = await nuevoCliente()
      const r = await cliente.rpc('unirse_partida', { p_codigo: 'ZZZZZZ', p_nombre: 'X' }).single()
      expect(fallo(r)).toMatch(/no encontrado/)
    })

    it('acepta el código en minúsculas y con espacios', async () => {
      const p = await partidaCon(1)
      const { cliente } = await nuevoCliente()
      const r = await cliente
        .rpc('unirse_partida', { p_codigo: ` ${p.codigo.toLowerCase()} `, p_nombre: 'X' })
        .single()
      expect(ok(r)).toMatchObject({ partida_id: p.partidaId })
    })

    it('nadie tiene rol al unirse (se asigna al iniciar)', async () => {
      const p = await partidaCon(2)
      const fila = ok(
        await p.jugadores[1].cliente
          .from('asignaciones_rol')
          .select('id')
          .eq('jugador_id', p.jugadores[1].jugadorId),
      )
      expect(fila).toHaveLength(0)
    })

    it('volver a unirse con el mismo usuario recupera el mismo jugador', async () => {
      const p = await partidaCon(2)
      const j = p.jugadores[1]
      const r = ok(
        await j.cliente.rpc('unirse_partida', { p_codigo: p.codigo, p_nombre: 'Otro' }).single(),
      ) as { jugador_id: string }
      expect(r.jugador_id).toBe(j.jugadorId)
    })

    it('máximo 4 jugadores', async () => {
      const p = await partidaCon(4)
      const { cliente } = await nuevoCliente()
      const r = await cliente.rpc('unirse_partida', { p_codigo: p.codigo, p_nombre: 'Quinto' }).single()
      expect(fallo(r)).toMatch(/completa/)
    })

    it('no se puede unir a una partida que ya empezó', async () => {
      const p = await partidaCon(4)
      ok(await p.jugadores[0].cliente.rpc('iniciar_partida', { p_partida_id: p.partidaId }))
      const { cliente } = await nuevoCliente()
      const r = await cliente.rpc('unirse_partida', { p_codigo: p.codigo, p_nombre: 'Tarde' }).single()
      expect(fallo(r)).toMatch(/completa|ya comenzó/)
    })
  })

  describe('iniciar la partida', () => {
    it('solo el creador puede iniciarla', async () => {
      const p = await partidaCon(4)
      const r = await p.jugadores[1].cliente.rpc('iniciar_partida', { p_partida_id: p.partidaId })
      expect(fallo(r)).toMatch(/Solo quien creó/)
    })

    it('necesita exactamente 4 jugadores', async () => {
      const p = await partidaCon(3)
      const r = await p.jugadores[0].cliente.rpc('iniciar_partida', { p_partida_id: p.partidaId })
      expect(fallo(r)).toMatch(/4 jugadores/)
    })

    it('crea la ronda 1 y es idempotente', async () => {
      const p = await partidaIniciada()
      ok(await p.jugadores[0].cliente.rpc('iniciar_partida', { p_partida_id: p.partidaId }))
      const rondas = ok(
        await p.jugadores[0].cliente.from('rondas').select('numero').eq('partida_id', p.partidaId),
      )
      expect(rondas).toEqual([{ numero: 1 }])
    })
  })

  describe('roles', () => {
    it('en cada ronda los 4 roles se reparten sin repetirse', async () => {
      const p = await partidaIniciada()
      const r1 = await ronda(p, 1)
      expect([...(await rolesDe(p, r1.id))].sort()).toEqual([...ROLES].sort())
    })

    it('ningún jugador repite rol en las 3 rondas', async () => {
      const p = await partidaIniciada()
      const historial: string[][] = p.jugadores.map(() => [])
      for (let n = 1; n <= 3; n++) {
        const r = await ronda(p, n)
        const roles = await rolesDe(p, r.id)
        roles.forEach((rol, i) => historial[i].push(rol))
        ok(await validar(constructorDe(p, roles), r.id, TODO_OK))
        if (n < 3) {
          ok(await p.jugadores[0].cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: n }))
        }
      }
      for (const roles of historial) expect(new Set(roles).size).toBe(3)
    })
  })

  describe('información privada (RLS)', () => {
    it('cada jugador solo ve su propio fragmento del plano', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const roles = await rolesDe(p, r.id)
      for (const [i, j] of p.jugadores.entries()) {
        const filas = ok(
          await j.cliente.from('entregas_privadas').select('jugador_id, tipo, contenido').eq('ronda_id', r.id),
        ) as { jugador_id: string; tipo: string; contenido: Record<string, unknown> }[]
        expect(filas.every((f) => f.jugador_id === j.jugadorId)).toBe(true)
        const fragmento = filas.find((f) => f.tipo === 'fragmento_plano')!.contenido
        const claves = Object.keys(fragmento).sort()
        const esperado = {
          arquitecto: ['niveles'],
          explorador_estructura: ['conexiones', 'orientaciones', 'vista_lateral', 'vista_superior'],
          explorador_materiales: ['piezas'],
          constructor: [],
        }[roles[i]]
        expect(claves).toEqual(esperado)
      }
    })

    it('el plano es coherente: la base del arquitecto coincide con la vista superior', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const roles = await rolesDe(p, r.id)
      const fragmento = async (rol: string) =>
        (
          ok(
            await p.jugadores[roles.indexOf(rol)].cliente
              .from('entregas_privadas')
              .select('contenido')
              .eq('ronda_id', r.id)
              .eq('tipo', 'fragmento_plano')
              .single(),
          ) as { contenido: Record<string, never> }
        ).contenido
      const arq = (await fragmento('arquitecto')) as { niveles: { piezas: number }[] }
      const est = (await fragmento('explorador_estructura')) as { vista_superior: boolean[] }
      const mat = (await fragmento('explorador_materiales')) as { piezas: { cantidad: number }[] }

      expect(arq.niveles).toHaveLength(2) // ronda 1 → 2 niveles
      expect(est.vista_superior.filter(Boolean)).toHaveLength(arq.niveles[0].piezas)
      const totalPiezas = arq.niveles.reduce((s, n) => s + n.piezas, 0)
      expect(mat.piezas.reduce((s, x) => s + x.cantidad, 0)).toBe(totalPiezas)
    })

    it('la ronda 1 no tiene evento; las rondas 2 y 3 le llegan a un solo jugador', async () => {
      const p = await partidaIniciada()
      for (let n = 1; n <= 3; n++) {
        const r = await ronda(p, n)
        let conEvento = 0
        for (const j of p.jugadores) {
          const e = ok(
            await j.cliente.from('entregas_privadas').select('id').eq('ronda_id', r.id).eq('tipo', 'evento'),
          )
          conEvento += e.length
        }
        expect(conEvento).toBe(n === 1 ? 0 : 1)
        expect(r.evento_tipo === null).toBe(n === 1)
        ok(await validar(constructorDe(p, await rolesDe(p, r.id)), r.id, TODO_OK))
        if (n < 3) {
          ok(await p.jugadores[0].cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: n }))
        }
      }
    })

    it('nadie puede escribir directamente el resultado de una ronda', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const upd = await p.jugadores[0].cliente
        .from('rondas')
        .update({ superada: true })
        .eq('id', r.id)
        .select()
      expect(upd.data ?? []).toHaveLength(0)
      expect((await ronda(p, 1)).superada).toBeNull()
    })

    it('las funciones internas no están expuestas por la API', async () => {
      const p = await partidaIniciada()
      const r = await p.jugadores[0].cliente.rpc('_generar_ronda', {
        p_partida_id: p.partidaId,
        p_numero: 9,
      })
      expect(r.error).not.toBeNull()
    })

    it('un jugador de otra partida no ve las rondas ajenas', async () => {
      const p = await partidaIniciada()
      const extraño = await nuevoCliente()
      const filas = ok(await extraño.cliente.from('rondas').select('id').eq('partida_id', p.partidaId))
      expect(filas).toHaveLength(0)
    })
  })

  describe('fases sincronizadas', () => {
    it('solo el creador pasa a todos de revelación a planeación', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const invitado = await p.jugadores[1].cliente.rpc('accion_ronda', {
        p_ronda_id: r.id,
        p_accion: 'iniciar_planeacion',
      })
      expect(fallo(invitado)).toMatch(/Solo quien creó/)
      ok(await p.jugadores[0].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: 'iniciar_planeacion' }))
      expect((await ronda(p, 1)).planeacion_inicio).not.toBeNull()
    })

    it('no se puede marcar listo antes de que empiece la planeación', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const res = await p.jugadores[1].cliente.rpc('accion_ronda', {
        p_ronda_id: r.id,
        p_accion: 'listo_planeacion',
      })
      expect(fallo(res)).toMatch(/no ha empezado/)
    })

    it('con 2 listos sigue la planeación; con 3 empiezan todos a jugar', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const accion = (i: number, a: string) =>
        p.jugadores[i].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: a })
      ok(await accion(0, 'iniciar_planeacion'))
      ok(await accion(1, 'listo_planeacion'))
      ok(await accion(2, 'listo_planeacion'))
      ok(await accion(2, 'listo_planeacion')) // repetir no cuenta doble
      expect((await ronda(p, 1)).juego_inicio).toBeNull()
      ok(await accion(3, 'listo_planeacion'))
      expect((await ronda(p, 1)).juego_inicio).not.toBeNull()
    })

    it('el creador puede saltar la planeación; un invitado no', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const accion = (i: number, a: string) =>
        p.jugadores[i].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: a })
      ok(await accion(0, 'iniciar_planeacion'))
      expect(fallo(await accion(1, 'saltar_planeacion'))).toMatch(/Solo quien creó/)
      ok(await accion(0, 'saltar_planeacion'))
      expect((await ronda(p, 1)).juego_inicio).not.toBeNull()
    })

    it('fin_planeacion no arranca el juego antes de los 30 s', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      ok(await p.jugadores[0].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: 'iniciar_planeacion' }))
      ok(await p.jugadores[1].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: 'fin_planeacion' }))
      expect((await ronda(p, 1)).juego_inicio).toBeNull()
    })

    it('rechaza acciones desconocidas y de jugadores ajenos', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const mala = await p.jugadores[0].cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: 'hackear' })
      expect(fallo(mala)).toMatch(/no válida/)
      const extraño = await nuevoCliente()
      const ajena = await extraño.cliente.rpc('accion_ronda', { p_ronda_id: r.id, p_accion: 'vi_revelacion' })
      expect(fallo(ajena)).toMatch(/No perteneces/)
    })

    it('hora_servidor responde para sincronizar relojes', async () => {
      const { cliente } = await nuevoCliente()
      const hora = new Date(ok(await cliente.rpc('hora_servidor')) as string).getTime()
      expect(Math.abs(hora - Date.now())).toBeLessThan(60_000)
    })
  })

  describe('validación de la torre', () => {
    it('solo el Constructor de la ronda puede validar', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const roles = await rolesDe(p, r.id)
      const otro = p.jugadores[roles.findIndex((x) => x !== 'constructor')]
      expect(fallo(await validar(otro, r.id, TODO_OK))).toMatch(/Solo el Constructor/)
    })

    it.each([
      [[true, true, true, true], true],
      [[true, true, false, false], true], // la mitad basta
      [[false, false, true, true], true],
      [[true, false, false, false], false],
      [[false, false, false, false], false],
    ])('condiciones %j → superada = %s', async (condiciones, esperado) => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      ok(await validar(constructorDe(p, await rolesDe(p, r.id)), r.id, condiciones))
      expect((await ronda(p, 1)).superada).toBe(esperado)
    })

    it('validar dos veces no cambia el resultado', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const c = constructorDe(p, await rolesDe(p, r.id))
      ok(await validar(c, r.id, TODO_OK))
      ok(await validar(c, r.id, [false, false, false, false]))
      expect((await ronda(p, 1)).superada).toBe(true)
    })
  })

  describe('votos, avance y final', () => {
    it('no se puede avanzar ni votar antes de validar', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      const avanzar = await p.jugadores[1].cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: 1 })
      expect(fallo(avanzar)).toMatch(/no ha sido validada/)
      const voto = await p.jugadores[0].cliente.rpc('votar_aporte', {
        p_ronda_id: r.id,
        p_votado_id: p.jugadores[1].jugadorId,
      })
      expect(fallo(voto)).toMatch(/no ha sido validada/)
    })

    it('no se puede votar por uno mismo y el voto es privado', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      ok(await validar(constructorDe(p, await rolesDe(p, r.id)), r.id, TODO_OK))
      const [a, b, c] = p.jugadores
      expect(fallo(await a.cliente.rpc('votar_aporte', { p_ronda_id: r.id, p_votado_id: a.jugadorId }))).toMatch(
        /ti mismo/,
      )
      ok(await a.cliente.rpc('votar_aporte', { p_ronda_id: r.id, p_votado_id: b.jugadorId }))
      ok(await c.cliente.rpc('votar_aporte', { p_ronda_id: r.id, p_votado_id: b.jugadorId }))
      const visibles = ok(await a.cliente.from('votos_aporte').select('jugador_id'))
      expect(visibles).toEqual([{ jugador_id: a.jugadorId }])
      expect(ok(await b.cliente.rpc('votos_emitidos', { p_ronda_id: r.id }))).toBe(2)
    })

    it('avanzar es idempotente: varios jugadores a la vez crean una sola ronda', async () => {
      const p = await partidaIniciada()
      const r = await ronda(p, 1)
      ok(await validar(constructorDe(p, await rolesDe(p, r.id)), r.id, TODO_OK))
      await Promise.all(
        p.jugadores.map((j) => j.cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: 1 })),
      )
      const rondas = ok(
        await p.jugadores[0].cliente.from('rondas').select('numero').eq('partida_id', p.partidaId).order('numero'),
      )
      expect(rondas).toEqual([{ numero: 1 }, { numero: 2 }])
    })

    it('partida completa: ranking por votos recibidos y partida terminada', async () => {
      const p = await partidaIniciada()
      for (let n = 1; n <= 3; n++) {
        const r = await ronda(p, n)
        ok(await validar(constructorDe(p, await rolesDe(p, r.id)), r.id, TODO_OK))
        // Todos votan por el jugador 1, y el jugador 1 vota por el 2
        for (const [i, j] of p.jugadores.entries()) {
          const votado = i === 1 ? p.jugadores[2] : p.jugadores[1]
          ok(await j.cliente.rpc('votar_aporte', { p_ronda_id: r.id, p_votado_id: votado.jugadorId }))
        }
        if (n < 3) {
          ok(await p.jugadores[0].cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: n }))
        }
      }
      const ranking = ok(await p.jugadores[3].cliente.rpc('ranking_partida', { p_partida_id: p.partidaId })) as {
        jugador_id: string
        puntos: number
      }[]
      expect(ranking[0]).toMatchObject({ jugador_id: p.jugadores[1].jugadorId, puntos: 9 })
      expect(ranking[1]).toMatchObject({ jugador_id: p.jugadores[2].jugadorId, puntos: 3 })
      expect(ranking.reduce((s, x) => s + x.puntos, 0)).toBe(12)

      const fin = await p.jugadores[0].cliente.rpc('avanzar_ronda', { p_partida_id: p.partidaId, p_desde: 3 })
      expect(fallo(fin)).toMatch(/ya terminó/)
      const partida = ok(
        await p.jugadores[0].cliente.from('partidas').select('terminada_en').eq('id', p.partidaId).single(),
      ) as { terminada_en: string | null }
      expect(partida.terminada_en).not.toBeNull()
    })

    it('el ranking solo lo puede pedir alguien de la partida', async () => {
      const p = await partidaIniciada()
      const extraño = await nuevoCliente()
      const r = await extraño.cliente.rpc('ranking_partida', { p_partida_id: p.partidaId })
      expect(fallo(r)).toMatch(/No perteneces/)
    })
  })
})
