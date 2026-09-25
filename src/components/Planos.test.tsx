import { act } from 'react'
import { createRoot, type Root } from 'react-dom/client'
import { afterEach, describe, expect, it } from 'vitest'
import { VistaFrontalSvg, VistaLateralSvg, VistaSuperiorGrid } from './Planos'

// React exige esta bandera para usar act() fuera de una librería de pruebas
;(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true

let root: Root | null = null
let contenedor: HTMLDivElement

function render(ui: React.ReactNode) {
  contenedor = document.createElement('div')
  document.body.appendChild(contenedor)
  root = createRoot(contenedor)
  act(() => root!.render(ui))
  return contenedor
}

afterEach(() => {
  act(() => root?.unmount())
  contenedor.remove()
  root = null
})

describe('VistaFrontalSvg', () => {
  it('dibuja una pieza por cada pieza de cada nivel', () => {
    const c = render(
      <VistaFrontalSvg
        niveles={[
          { nivel: 1, piezas: 3 },
          { nivel: 2, piezas: 2 },
          { nivel: 3, piezas: 1 },
        ]}
      />,
    )
    expect(c.querySelectorAll('rect')).toHaveLength(6)
  })

  it('los niveles superiores quedan más arriba (menor y)', () => {
    const c = render(
      <VistaFrontalSvg
        niveles={[
          { nivel: 1, piezas: 1 },
          { nivel: 2, piezas: 1 },
        ]}
      />,
    )
    const [base, arriba] = [...c.querySelectorAll('rect')].map((r) => Number(r.getAttribute('y')))
    expect(arriba).toBeLessThan(base)
  })
})

describe('VistaSuperiorGrid', () => {
  it('muestra las 9 celdas y marca solo las ocupadas', () => {
    const celdas = [true, false, false, false, true, false, false, false, true]
    const c = render(<VistaSuperiorGrid celdas={celdas} />)
    expect(c.querySelectorAll('.top-grid__cell')).toHaveLength(9)
    const ocupadas = [...c.querySelectorAll('.top-grid__cell')].map((el) =>
      el.classList.contains('is-filled'),
    )
    expect(ocupadas).toEqual(celdas)
  })
})

describe('VistaLateralSvg', () => {
  it('apila tantos bloques como la altura de cada fila', () => {
    const c = render(<VistaLateralSvg alturas={[0, 2, 3]} />)
    expect(c.querySelectorAll('rect')).toHaveLength(5)
  })

  it('una torre sin altura no dibuja bloques', () => {
    const c = render(<VistaLateralSvg alturas={[0, 0, 0]} />)
    expect(c.querySelectorAll('rect')).toHaveLength(0)
  })
})
