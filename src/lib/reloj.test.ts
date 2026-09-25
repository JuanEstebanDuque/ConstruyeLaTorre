import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { segundosRestantes } from './hooks'

describe('segundosRestantes', () => {
  const inicio = '2026-09-25T12:00:00.000Z'

  beforeEach(() => vi.useFakeTimers())
  afterEach(() => vi.useRealTimers())

  const en = (segundosDespues: number) =>
    vi.setSystemTime(new Date(new Date(inicio).getTime() + segundosDespues * 1000))

  it('sin inicio (fase no empezada) devuelve el total', () => {
    expect(segundosRestantes(null, 30)).toBe(30)
    expect(segundosRestantes(undefined, 210)).toBe(210)
  })

  it('cuenta hacia atrás desde el inicio', () => {
    en(0)
    expect(segundosRestantes(inicio, 30)).toBe(30)
    en(10)
    expect(segundosRestantes(inicio, 30)).toBe(20)
  })

  it('redondea hacia abajo los segundos transcurridos', () => {
    en(10.9)
    expect(segundosRestantes(inicio, 30)).toBe(20)
  })

  it('nunca es negativo', () => {
    en(500)
    expect(segundosRestantes(inicio, 30)).toBe(0)
  })

  it('nunca supera el total aunque el reloj local vaya atrasado', () => {
    en(-5)
    expect(segundosRestantes(inicio, 30)).toBe(30)
  })

  it('dos dispositivos con el mismo inicio ven el mismo tiempo', () => {
    en(42)
    const a = segundosRestantes(inicio, 210)
    const b = segundosRestantes(inicio, 210)
    expect(a).toBe(b)
    expect(a).toBe(168)
  })
})
