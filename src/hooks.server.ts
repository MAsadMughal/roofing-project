import type { Handle } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

const SESSION_COOKIE = 'session';

export const handle: Handle = async ({ event, resolve }) => {
    const sessionId = event.cookies.get(SESSION_COOKIE) ?? null;
    event.locals.sessionId = sessionId;
    event.locals.user = null;

    if (sessionId) {
        const session = await prisma.session.findUnique({
            where: { id: sessionId },
            include: { user: true }
        });
        if (session && session.expiresAt > new Date()) {
            event.locals.user = {
                id: session.user.id,
                email: session.user.email,
                firstName: session.user.firstName,
                lastName: session.user.lastName,
                role: (session.user.role as any) as App.Locals['user'] extends infer T ? T extends { role: infer R } ? R : never : never,
                customerId: session.user.customerId ?? null
            } as App.Locals['user'];
        } else if (session) {
            // cleanup expired session
            await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
        }
    }

    const response = await resolve(event);
    return response;
};


