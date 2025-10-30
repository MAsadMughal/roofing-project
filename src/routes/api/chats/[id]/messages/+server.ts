import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;
    const chatId = BigInt(event.params.id ?? '');

    const can = await prisma.chat.findFirst({ where: { id: chatId, participants: { some: { userId } } }, select: { id: true } });
    if (!can) return json({ error: 'Forbidden' }, { status: 403 });

    const messages = await prisma.message.findMany({
        where: { chatId },
        include: { sender: { select: { id: true, firstName: true, lastName: true } } },
        orderBy: { createdAt: 'asc' },
        take: 200
    });
    return json(messages.map((m) => ({ id: Number(m.id), text: m.content, at: m.createdAt, from: { id: Number(m.senderId), name: `${m.sender.firstName ?? ''} ${m.sender.lastName ?? ''}`.trim(), me: m.senderId === userId } })));
};

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;
    const chatId = BigInt(event.params.id ?? '');
    const body = await event.request.json().catch(() => ({} as any));
    const { text } = body ?? {};
    if (!text || !String(text).trim()) return json({ error: 'Text required' }, { status: 400 });

    const can = await prisma.chat.findFirst({ where: { id: chatId, participants: { some: { userId } } }, select: { id: true } });
    if (!can) return json({ error: 'Forbidden' }, { status: 403 });

    const msg = await prisma.message.create({ data: { chatId, senderId: userId, receiverId: userId, content: text } });
    await prisma.chat.update({ where: { id: chatId }, data: { updatedAt: new Date() } });
    return json({ id: Number(msg.id) }, { status: 201 });
};


