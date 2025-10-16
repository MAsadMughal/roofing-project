import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { randomUUID } from 'node:crypto';

export const POST: RequestHandler = async ({ request, url }) => {
    const body = await request.json().catch(() => ({} as any));
    const { email } = body ?? {};
    if (!email) return json({ error: 'email required' }, { status: 400 });

    const user = await prisma.user.findUnique({ where: { email } });
    if (user) {
        const token = randomUUID();
        const expiresAt = new Date(Date.now() + 1000 * 60 * 60); // 1 hour
        await prisma.passwordReset.create({ data: { token, userId: user.id, expiresAt } });

        const origin = url.origin;
        const resetUrl = `${origin}/reset/${token}`;
        console.log(resetUrl)
        // In production you would send an email here. For development, return the URL for convenience.
        if (process.env.NODE_ENV !== 'production') {
            return json({ ok: true, message: 'If that email exists, a reset link has been sent.', resetUrl });
        }
    }

    // Always respond with success to avoid account enumeration
    return json({ ok: true, message: 'If that email exists, a reset link has been sent.' });
};


