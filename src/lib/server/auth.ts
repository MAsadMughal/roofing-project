import type { RequestEvent } from '@sveltejs/kit';

export type Role = App.Locals['user'] extends infer T
  ? T extends { role: infer R }
    ? R
    : never
  : never;

export function isAuthenticated(event: RequestEvent): boolean {
  return Boolean(event.locals.user);
}

export function getUserRole(event: RequestEvent): Role | null {
  return event.locals.user?.role ?? null;
}

export function hasRole(event: RequestEvent, roles: Role | Role[]): boolean {
  const role = getUserRole(event);
  if (!role) return false;
  const allowed = Array.isArray(roles) ? roles : [roles];
  return allowed.includes(role);
}

export function requireAuth(event: RequestEvent): asserts event is RequestEvent & { locals: { user: NonNullable<App.Locals['user']> } } {
  if (!event.locals.user) {
    throw new Response('Unauthorized', { status: 401 });
  }
}

export function requireRole(event: RequestEvent, roles: Role | Role[]): asserts event is RequestEvent & { locals: { user: NonNullable<App.Locals['user']> } } {
  requireAuth(event);
  if (!hasRole(event, roles)) {
    throw new Response('Forbidden', { status: 403 });
  }
}


