import { useNavigate } from 'react-router-dom'

/** Estado de carga / error mientras llegan los datos de la ronda. */
export default function PantallaCargando({ error }: { error?: string }) {
  const navigate = useNavigate()

  return (
    <div className="page" style={{ justifyContent: 'center', alignItems: 'center', gap: 20 }}>
      {error ? (
        <>
          <p className="error-msg">{error}</p>
          <button className="btn btn-ghost btn-sm" onClick={() => navigate('/', { replace: true })}>
            Volver al inicio
          </button>
        </>
      ) : (
        <span className="spinner" />
      )}
    </div>
  )
}
