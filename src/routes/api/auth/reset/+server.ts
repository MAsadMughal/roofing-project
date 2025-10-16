import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { pbkdf2Sync } from 'node:crypto';

function hashPassword(password: string): string {
    return pbkdf2Sync(password, process.env.PBKDF2_SALT || 'changeme', 310000, 32, 'sha256').toString('hex');
}

export const POST: RequestHandler = async ({ request }) => {
    const body = await request.json().catch(() => ({} as any));
    const { token, password } = body ?? {};
    if (!token || !password) return json({ error: 'token and password required' }, { status: 400 });

    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    if (!reset || reset.usedAt || reset.expiresAt < new Date()) {
        return json({ error: 'invalid or expired token' }, { status: 400 });
    }

    const user = await prisma.user.findUnique({ where: { id: reset.userId } });
    if (!user) return json({ error: 'invalid token' }, { status: 400 });

    await prisma.$transaction([
        prisma.user.update({ where: { id: user.id }, data: { passwordHash: hashPassword(password) } }),
        prisma.passwordReset.update({ where: { token }, data: { usedAt: new Date() } }),
        prisma.session.deleteMany({ where: { userId: user.id } })
    ]);

    return json({ ok: true });
};


