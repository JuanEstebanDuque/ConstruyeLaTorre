import type { Role } from '../types/game';

// La clave "constructor" en un objeto literal choca con Object.prototype.constructor
// y rompe la inferencia de tipos de TS, por eso se usa notación de corchetes aquí.
const DB_TO_APP: Record<string, Role> = {
  arquitecto: 'arquitecto',
  explorador_estructura: 'estructura',
  explorador_materiales: 'materiales',
  ['constructor']: 'constructor' as Role,
};

export function dbRoleToApp(dbRole: string): Role {
  const role = DB_TO_APP[dbRole];
  if (!role) {
    throw new Error(`Rol desconocido recibido de la base de datos: ${dbRole}`);
  }
  return role;
}
