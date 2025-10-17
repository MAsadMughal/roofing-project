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

    const invite = await prisma.invite.findUnique({ where: { token } });
    if (!invite || invite.acceptedAt || invite.expiresAt < new Date()) {
        return json({ error: 'invalid or expired token' }, { status: 400 });
    }

    const existing = await prisma.user.findUnique({ where: { email: invite.email } });
    if (existing) return json({ error: 'user already exists' }, { status: 409 });

    await prisma.$transaction(async (tx) => {
        const user = await tx.user.create({
            data: {
                email: invite.email,
                passwordHash: hashPassword(password),
                firstName: invite.name ?? null,
                lastName: null,
                role: invite.role,
                // contractorId required for non-owners; owners self-own
                contractorId: invite.contractorId
            }
        });
        await tx.invite.update({ where: { token }, data: { acceptedAt: new Date() } });
        // no auto login here; user can sign in after setting password
    });

    return json({ ok: true });
};


