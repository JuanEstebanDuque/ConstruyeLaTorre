import { describe, expect, it } from 'vitest'
import {
  estadoEvento,
  listarNumeros,
  puestos,
  resumenPartida,
  rondasPerdidasAntes,
} from './reglas'
import type { Evento } from '../types/game'

const ronda = (numero: number, superada: boolean | null, validada = true) => ({
  numero,
  superada,
  validada_en: validada ? '2026-09-25T00:00:00Z' : null,
})

describe('resumenPartida', () => {
  it('gana con 2 de 3 rondas superadas', () => {
    const r = resumenPartida([ronda(1, true), ronda(2, false), ronda(3, true)])
    expect(r).toEqual({ superadas: 2, perdidas: [2], victoria: true })
  })

  it('gana con 3 de 3', () => {
    expect(resumenPartida([ronda(1, true), ronda(2, true), ronda(3, true)]).victoria).toBe(true)
  })

  it('pierde con 1 de 3', () => {
    const r = resumenPartida([ronda(1, false), ronda(2, true), ronda(3, false)])
    expect(r).toEqual({ superadas: 1, perdidas: [1, 3], victoria: false })
  })

  it('una ronda sin validar no cuenta como perdida', () => {
    const r = resumenPartida([ronda(1, true), ronda(2, null, false)])
    expect(r.perdidas).toEqual([])
    expect(r.superadas).toBe(1)
  })
})

describe('rondasPerdidasAntes', () => {
  const rondas = [ronda(1, false), ronda(2, true), ronda(3, false)]

  it('solo cuenta rondas anteriores a la actual', () => {
    expect(rondasPerdidasAntes(rondas, 3)).toEqual([1])
    expect(rondasPerdidasAntes(rondas, 1)).toEqual([])
  })
})

describe('listarNumeros', () => {
  it.each([
    [[], ''],
    [[2], '2'],
    [[1, 3], '1 y 3'],
    [[1, 2, 3], '1, 2 y 3'],
  ])('%j → "%s"', (numeros, esperado) => {
    expect(listarNumeros(numeros)).toBe(esperado)
  })
})

describe('puestos', () => {
  it('asigna puestos consecutivos sin empates', () => {
    expect(puestos([9, 5, 3, 0])).toEqual([1, 2, 3, 4])
  })

  it('los empates comparten puesto y el siguiente salta', () => {
    expect(puestos([9, 3, 3, 0])).toEqual([1, 2, 2, 4])
  })

  it('empate en el primer lugar: ambos son primeros', () => {
    expect(puestos([4, 4, 2, 2])).toEqual([1, 1, 3, 3])
  })
})

describe('estadoEvento', () => {
  const TOTAL = 210 // 3:30 → el evento aparece con 126 s restantes (tras el 40 %)
  const silencio: Evento = { tipo: 'silencio', titulo: 'Silencio', descripcion: '', duracion: 30 }
  const planoPerdido: Evento = { ...silencio, tipo: 'plano_perdido', titulo: 'Plano perdido' }
  const bloqueada: Evento = { tipo: 'pieza_bloqueada', titulo: 'Pieza bloqueada', descripcion: '' }

  it('sin evento no muestra nada', () => {
    expect(estadoEvento(null, 50, TOTAL)).toEqual({ evento: null, efectoRestante: 0, planoOculto: false })
  })

  it('aún no aparece antes del 40 % del tiempo', () => {
    expect(estadoEvento(silencio, 127, TOTAL).evento).toBeNull()
  })

  it('aparece justo al 40 % del tiempo con su efecto completo', () => {
    const e = estadoEvento(silencio, 126, TOTAL)
    expect(e.evento).toBe(silencio)
    expect(e.efectoRestante).toBe(30)
  })

  it('el efecto descuenta y termina a los 30 s', () => {
    expect(estadoEvento(silencio, 116, TOTAL).efectoRestante).toBe(20)
    expect(estadoEvento(silencio, 96, TOTAL).efectoRestante).toBe(0)
    expect(estadoEvento(silencio, 10, TOTAL).efectoRestante).toBe(0)
  })

  it('plano perdido oculta el plano solo mientras dura el efecto', () => {
    expect(estadoEvento(planoPerdido, 120, TOTAL).planoOculto).toBe(true)
    expect(estadoEvento(planoPerdido, 90, TOTAL).planoOculto).toBe(false)
  })

  it('los eventos sin duración no ocultan nada', () => {
    const e = estadoEvento(bloqueada, 100, TOTAL)
    expect(e.evento).toBe(bloqueada)
    expect(e.efectoRestante).toBe(0)
    expect(e.planoOculto).toBe(false)
  })
})
