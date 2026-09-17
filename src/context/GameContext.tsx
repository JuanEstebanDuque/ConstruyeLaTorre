import { createContext, useContext, useMemo, useState, type ReactNode } from 'react';
import type { Role } from '../types/game';

interface SesionPartida {
  jugadorId: string;
  partidaId: string;
  codigoSala: string;
  nombre: string;
}

interface RondaActual {
  rondaId: string;
  rondaNumero: number;
  miRol: Role;
}

interface GameState {
  jugadorId: string | null;
  partidaId: string | null;
  codigoSala: string | null;
  nombre: string | null;
  rondaId: string | null;
  rondaNumero: number;
  miRol: Role | null;
  setSesionPartida: (datos: SesionPartida) => void;
  setRonda: (datos: RondaActual) => void;
  reset: () => void;
}

const GameContext = createContext<GameState | null>(null);

export function GameProvider({ children }: { children: ReactNode }) {
  const [jugadorId, setJugadorId] = useState<string | null>(null);
  const [partidaId, setPartidaId] = useState<string | null>(null);
  const [codigoSala, setCodigoSala] = useState<string | null>(null);
  const [nombre, setNombre] = useState<string | null>(null);
  const [rondaId, setRondaId] = useState<string | null>(null);
  const [rondaNumero, setRondaNumero] = useState(1);
  const [miRol, setMiRol] = useState<Role | null>(null);

  const value = useMemo<GameState>(
    () => ({
      jugadorId,
      partidaId,
      codigoSala,
      nombre,
      rondaId,
      rondaNumero,
      miRol,
      setSesionPartida: (d: SesionPartida) => {
        setJugadorId(d.jugadorId);
        setPartidaId(d.partidaId);
        setCodigoSala(d.codigoSala);
        setNombre(d.nombre);
      },
      setRonda: (d: RondaActual) => {
        setRondaId(d.rondaId);
        setRondaNumero(d.rondaNumero);
        setMiRol(d.miRol);
      },
      reset: () => {
        setJugadorId(null);
        setPartidaId(null);
        setCodigoSala(null);
        setNombre(null);
        setRondaId(null);
        setRondaNumero(1);
        setMiRol(null);
      },
    }),
    [jugadorId, partidaId, codigoSala, nombre, rondaId, rondaNumero, miRol]
  );

  return <GameContext.Provider value={value}>{children}</GameContext.Provider>;
}

export function useGame(): GameState {
  const ctx = useContext(GameContext);
  if (!ctx) {
    throw new Error('useGame debe usarse dentro de GameProvider');
  }
  return ctx;
}
