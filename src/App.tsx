import { BrowserRouter, Routes, Route } from 'react-router-dom'
import Home from './pages/Home'
import CreateGame from './pages/CreateGame'
import JoinGame from './pages/JoinGame'
import Lobby from './pages/Lobby'
import RoleInfo from './pages/RoleInfo'
import Validacion from './pages/Validacion'
import AporteEquipo from './pages/AporteEquipo'

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/crear" element={<CreateGame />} />
        <Route path="/unirse" element={<JoinGame />} />
        <Route path="/lobby/:partidaId" element={<Lobby />} />
        <Route path="/rol" element={<RoleInfo />} />
        <Route path="/validacion" element={<Validacion />} />
        <Route path="/aporte" element={<AporteEquipo />} />
      </Routes>
    </BrowserRouter>
  )
}
