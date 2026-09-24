import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { crearPartida } from '../lib/game'
import Hexagons from '../components/Hexagons'

export default function CreateGame() {
  const navigate = useNavigate()
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!nombre.trim()) return

    setCargando(true)
    setError('')

    try {
      const sesion = await crearPartida(nombre.trim())
      navigate(`/lobby/${sesion.partidaId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al crear la partida')
      setCargando(false)
    }
  }

  return (
    <div className="page" style={{ gap: 32 }}>
      <Hexagons corner="tr" />

      <div>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Volver
        </button>
      </div>

      <div>
        <h1 style={{ marginBottom: 8 }}>Nueva partida</h1>
        <p style={{ fontSize: 15 }}>
          Vas a ser el <strong style={{ color: 'var(--text-h)' }}>Arquitecto</strong>. Comparte el
          código con tus compañeros para que se unan.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="field">
          <label className="label" htmlFor="nombre">
            Tu nombre
          </label>
          <input
            id="nombre"
            className="input"
            type="text"
            placeholder="¿Cómo te llaman?"
            value={nombre}
            onChange={(e) => setNombre(e.target.value)}
            maxLength={30}
            autoComplete="off"
            autoFocus
            disabled={cargando}
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <div className="pill-row">
          <button className="btn btn-primary" type="submit" disabled={cargando || !nombre.trim()}>
            {cargando ? 'Creando...' : 'Crear partida'}
          </button>
          <button className="btn-arrow" type="submit" disabled={cargando || !nombre.trim()} aria-hidden tabIndex={-1}>
            →
          </button>
        </div>
      </form>
    </div>
  )
}
