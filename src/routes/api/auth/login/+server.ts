import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { pbkdf2Sync, randomUUID } from 'node:crypto';

function hashPassword(password: string): string {
    return pbkdf2Sync(password, process.env.PBKDF2_SALT || 'changeme', 310000, 32, 'sha256').toString('hex');
}

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await request.json();
    const { email, password } = body ?? {};
    if (!email || !password) return json({ error: 'email and password required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return json({ error: 'invalid credentials' }, { status: 401 });

    const hash = hashPassword(password);
    if (hash !== user.passwordHash) return json({ error: 'invalid credentials' }, { status: 401 });

    // rotate session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);
    await prisma.session.create({ data: { id: sessionId, userId: user.id, expiresAt } });

    cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7
    });

    return json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, customerId: user.customerId ?? null });
};


