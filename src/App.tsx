import { useEffect, useState } from 'react';
import { C } from './theme';
import type { Screen } from './types/game';
import { GameProvider } from './context/GameContext';
import { ensureAnonymousSession } from './lib/auth';
import { Wrap } from './components/ui/Wrap';
import { Label } from './components/ui/Label';
import { HomeScreen } from './screens/HomeScreen';
import { CreateScreen } from './screens/CreateScreen';
import { JoinCodeScreen } from './screens/JoinCodeScreen';
import { LobbyScreen } from './screens/LobbyScreen';
import { RoleScreen } from './screens/RoleScreen';
import { RevelacionScreen } from './screens/RevelacionScreen';
import { PlaneacionScreen } from './screens/PlaneacionScreen';
import { ConstruccionScreen } from './screens/ConstruccionScreen';
import { ValidacionScreen } from './screens/ValidacionScreen';
import { ResultadoRondaScreen } from './screens/ResultadoRondaScreen';
import { VotacionScreen } from './screens/VotacionScreen';
import { RotacionScreen } from './screens/RotacionScreen';
import { FinalScreen } from './screens/FinalScreen';

function AppRouter() {
  const [screen, setScreen] = useState<Screen>('home');
  const go = (s: Screen) => setScreen(s);

  const screens: Partial<Record<Screen, React.ReactNode>> = {
    home: <HomeScreen go={go} />,
    create: <CreateScreen go={go} />,
    'join-code': <JoinCodeScreen go={go} />,
    lobby: <LobbyScreen go={go} />,
    role: <RoleScreen go={go} />,
    revelacion: <RevelacionScreen go={go} />,
    planeacion: <PlaneacionScreen go={go} />,
    construccion: <ConstruccionScreen go={go} />,
    validacion: <ValidacionScreen go={go} />,
    'resultado-ronda': <ResultadoRondaScreen go={go} />,
    votacion: <VotacionScreen go={go} />,
    rotacion: <RotacionScreen go={go} />,
    final: <FinalScreen go={go} />,
  };

  return <>{screens[screen] ?? null}</>;
}

export default function App() {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    ensureAnonymousSession()
      .then(() => setReady(true))
      .catch((err) => setError(err instanceof Error ? err.message : 'No se pudo conectar'));
  }, []);

  if (error) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 20 }}>
          <p style={{ color: C.danger, fontSize: 13, textAlign: 'center' }}>{error}</p>
        </div>
      </Wrap>
    );
  }

  if (!ready) {
    return (
      <Wrap>
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Label>Conectando...</Label>
        </div>
      </Wrap>
    );
  }

  return (
    <GameProvider>
      <AppRouter />
    </GameProvider>
  );
}
