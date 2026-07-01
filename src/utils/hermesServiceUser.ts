/**
 * Resolves the fixed tenant used by service-to-service automation calls
 * (Hermes Agent). This is a personal, single-user system for now, so
 * automation calls act as one specific users.id rather than deriving a
 * user from a per-request token the way firebaseAuth does.
 */
export class ServiceConfigurationError extends Error {}

export function getHermesServiceUserId(): number {
  const raw = process.env.HERMES_SERVICE_USER_ID;

  if (!raw) {
    throw new ServiceConfigurationError(
      "HERMES_SERVICE_USER_ID is not configured."
    );
  }

  const id = Number(raw);

  if (!Number.isInteger(id) || id < 1) {
    throw new ServiceConfigurationError(
      "HERMES_SERVICE_USER_ID is not a valid positive integer."
    );
  }

  return id;
}
