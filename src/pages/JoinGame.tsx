import { useState, type FormEvent } from 'react'
import { useNavigate } from 'react-router-dom'
import { unirsePartida } from '../lib/game'

export default function JoinGame() {
  const navigate = useNavigate()
  const [codigo, setCodigo] = useState('')
  const [nombre, setNombre] = useState('')
  const [cargando, setCargando] = useState(false)
  const [error, setError] = useState('')

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    if (!codigo.trim() || !nombre.trim()) return

    setCargando(true)
    setError('')

    try {
      const sesion = await unirsePartida(codigo.trim(), nombre.trim())
      navigate(`/lobby/${sesion.partidaId}`)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error al unirse')
      setCargando(false)
    }
  }

  return (
    <div className="page" style={{ gap: 32 }}>
      <div>
        <button className="back-btn" onClick={() => navigate('/')}>
          ← Volver
        </button>
      </div>

      <div>
        <h1 style={{ marginBottom: 8 }}>Unirse a partida</h1>
        <p style={{ fontSize: 15 }}>
          Ingresa el código de 6 letras que te compartió quien creó la sala.
        </p>
      </div>

      <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
        <div className="field">
          <label className="label" htmlFor="codigo">
            Código de sala
          </label>
          <input
            id="codigo"
            className="input input-code"
            type="text"
            placeholder="XXXXXX"
            value={codigo}
            onChange={(e) => setCodigo(e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, ''))}
            maxLength={6}
            autoComplete="off"
            autoFocus
            disabled={cargando}
          />
        </div>

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
            disabled={cargando}
          />
        </div>

        {error && <p className="error-msg">{error}</p>}

        <button
          className="btn btn-primary"
          type="submit"
          disabled={cargando || codigo.length < 6 || !nombre.trim()}
        >
          {cargando ? 'Uniéndose...' : 'Unirse'}
        </button>
      </form>
    </div>
  )
}
