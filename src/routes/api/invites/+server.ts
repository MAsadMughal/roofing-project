import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { randomUUID } from 'node:crypto';
import { requireRole } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const body = await event.request.json().catch(() => ({} as any));
    const { name, email, phone, role } = body ?? {};
    if (!email) return json({ error: 'email required' }, { status: 400 });

    const token = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 3); // 3 days

    const ownerId = event.locals.user!.id;
    const contractorId = event.locals.user!.contractorId ?? event.locals.user!.id; // owner represents contractor org

    // prevent inviting existing users by email
    const existing = await prisma.user.findUnique({ where: { email } });
    if (existing) return json({ error: 'user with this email already exists' }, { status: 409 });

    await prisma.invite.create({
        data: {
            token,
            ownerId,
            contractorId: contractorId as unknown as bigint,
            email,
            name: name ?? null,
            phone: phone ?? null,
            role: (role && typeof role === 'string') ? role : 'REP',
            expiresAt
        }
    });

    const origin = event.url.origin;
    const inviteUrl = `${origin}/invite/${token}`;

    if (process.env.NODE_ENV !== 'production') {
        return json({ ok: true, inviteUrl });
    }

    return json({ ok: true });
};


