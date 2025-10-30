import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;
    const chatId = BigInt(event.params.id ?? '');

    const can = await prisma.chat.findFirst({ where: { id: chatId, participants: { some: { userId } } }, select: { id: true } });
    if (!can) return json({ error: 'Forbidden' }, { status: 403 });

    await prisma.chatParticipant.updateMany({
        where: { chatId, userId },
        data: { lastReadAt: new Date() }
    });

    return json({ ok: true });
};


