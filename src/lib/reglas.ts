// Reglas puras del juego que se calculan en el cliente (sin red ni React).
// Las reglas que deciden el resultado (roles, validación, votos) viven en
// Postgres; aquí solo lo que se deriva para mostrarlo.

import { RONDAS_PARA_GANAR, type Evento, type Ronda } from '../types/game'

/** Rondas superadas, rondas perdidas y si el equipo ganó la partida. */
export function resumenPartida(rondas: Pick<Ronda, 'numero' | 'superada' | 'validada_en'>[]) {
  const superadas = rondas.filter((r) => r.superada).length
  const perdidas = rondas.filter((r) => r.validada_en && !r.superada).map((r) => r.numero)
  return { superadas, perdidas, victoria: superadas >= RONDAS_PARA_GANAR }
}

/** Rondas ya validadas y no superadas antes de la ronda `numero`. */
export function rondasPerdidasAntes(
  rondas: Pick<Ronda, 'numero' | 'superada' | 'validada_en'>[],
  numero: number,
): number[] {
  return rondas
    .filter((r) => r.numero < numero && r.validada_en && !r.superada)
    .map((r) => r.numero)
}

/** [1] → "1", [1, 2] → "1 y 2", [1, 2, 3] → "1, 2 y 3" */
export function listarNumeros(numeros: number[]): string {
  if (numeros.length <= 1) return numeros.join('')
  return `${numeros.slice(0, -1).join(', ')} y ${numeros[numeros.length - 1]}`
}

/**
 * Puesto de cada jugador en un ranking ya ordenado de mayor a menor.
 * Los empates comparten puesto y el siguiente salta: 9, 3, 3, 0 → 1, 2, 2, 4.
 */
export function puestos(puntos: number[]): number[] {
  return puntos.map((p) => puntos.findIndex((q) => q === p) + 1)
}

/** El evento aparece cuando ha pasado este porcentaje del tiempo de construcción. */
export const EVENTO_TRAS = 0.4

/**
 * Qué mostrar del evento privado según el tiempo que queda de construcción:
 * si ya es visible, cuántos segundos le quedan a su efecto (silencio, plano
 * perdido) y si el plano debe ocultarse.
 */
export function estadoEvento(evento: Evento | null, restantes: number, totalConstruccion: number) {
  const apareceEn = Math.round(totalConstruccion * (1 - EVENTO_TRAS))
  const visible = evento && restantes <= apareceEn ? evento : null
  const efectoRestante = visible?.duracion
    ? Math.max(0, visible.duracion - (apareceEn - restantes))
    : 0
  return {
    evento: visible,
    efectoRestante,
    planoOculto: visible?.tipo === 'plano_perdido' && efectoRestante > 0,
  }
}
