import { beforeEach, describe, expect, it } from 'vitest'
import { guardarSesion, limpiarSesion, obtenerSesion } from './game'
import type { SesionLocal } from '../types/game'

const sesion: SesionLocal = {
  jugadorId: 'j1',
  partidaId: 'p1',
  codigoSala: 'ABC234',
  nombre: 'Juan',
  esHost: true,
}

describe('sesión local', () => {
  beforeEach(() => sessionStorage.clear())

  it('sin sesión guardada devuelve null', () => {
    expect(obtenerSesion()).toBeNull()
  })

  it('guarda y recupera la sesión', () => {
    guardarSesion(sesion)
    expect(obtenerSesion()).toEqual(sesion)
  })

  it('cada lectura devuelve un objeto nuevo (por eso las pantallas la leen una sola vez)', () => {
    guardarSesion(sesion)
    expect(obtenerSesion()).not.toBe(obtenerSesion())
  })

  it('limpiarSesion la elimina', () => {
    guardarSesion(sesion)
    limpiarSesion()
    expect(obtenerSesion()).toBeNull()
  })

  it('un valor corrupto no rompe la app', () => {
    sessionStorage.setItem('cdt_sesion', '{no es json')
    expect(obtenerSesion()).toBeNull()
  })
})
