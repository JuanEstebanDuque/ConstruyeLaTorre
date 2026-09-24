import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import Home from './pages/Home'
import CreateGame from './pages/CreateGame'
import JoinGame from './pages/JoinGame'
import Lobby from './pages/Lobby'
import RoleInfo from './pages/RoleInfo'
import Revelacion from './pages/Revelacion'
import Planeacion from './pages/Planeacion'
import Juego from './pages/juego/Juego'
import Validacion from './pages/Validacion'
import Espera from './pages/Espera'
import Resultado from './pages/Resultado'
import AporteEquipo from './pages/AporteEquipo'
import Final from './pages/Final'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CreateGame />} />
        <Route path="/unirse" element={<JoinGame />} />
        <Route path="/lobby/:partidaId" element={<Lobby />} />

        {/* Ciclo de cada ronda: rol → revelación → planeación → juego →
            validación (Constructor) / espera (resto) → resultado → aporte */}
        <Route path="/r/:numero/rol" element={<RoleInfo />} />
        <Route path="/r/:numero/revelacion" element={<Revelacion />} />
        <Route path="/r/:numero/planeacion" element={<Planeacion />} />
        <Route path="/r/:numero/juego" element={<Juego />} />
        <Route path="/r/:numero/validacion" element={<Validacion />} />
        <Route path="/r/:numero/espera" element={<Espera />} />
        <Route path="/r/:numero/resultado" element={<Resultado />} />
        <Route path="/r/:numero/aporte" element={<AporteEquipo />} />
        <Route path="/final" element={<Final />} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}
