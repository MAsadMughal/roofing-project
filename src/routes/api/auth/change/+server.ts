import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { pbkdf2Sync, randomUUID } from 'node:crypto';

function hashPassword(password: string): string {
    return pbkdf2Sync(password, process.env.PBKDF2_SALT || 'changeme', 310000, 32, 'sha256').toString('hex');
}

export const POST: RequestHandler = async ({ request, locals, cookies }) => {
    if (!locals.user) return json({ error: 'unauthorized' }, { status: 401 });

    const body = await request.json().catch(() => ({} as any));
    const { currentPassword, newPassword } = body ?? {};
    if (!currentPassword || !newPassword) return json({ error: 'currentPassword and newPassword required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { id: locals.user.id } });
    if (!user) return json({ error: 'user not found' }, { status: 404 });

    if (hashPassword(currentPassword) !== user.passwordHash) {
        return json({ error: 'incorrect password' }, { status: 400 });
    }

    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7);

    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(newPassword) } }),
        prisma.session.deleteMany({ where: { userId: user.id } }),
        prisma.session.create({ data: { id: sessionId, userId: user.id, expiresAt } })
    ]);

    cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7
    });

    return json({ ok: true });
};


