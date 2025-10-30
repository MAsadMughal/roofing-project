import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const userId = event.locals.user!.id as unknown as bigint;
    const now = new Date();
    const ONLINE_THRESHOLD_MS = 2 * 60 * 1000; // 2 minutes

    const chats = await prisma.chat.findMany({
        where: { participants: { some: { userId } } },
        include: {
            participants: { include: { user: { select: { id: true, firstName: true, lastName: true, lastSeenAt: true } } } },
            messages: { orderBy: { createdAt: 'desc' }, take: 1, include: { sender: { select: { id: true, firstName: true, lastName: true } } } }
        },
        orderBy: { updatedAt: 'desc' },
        take: 100
    });

    // Get lastReadAt for me per chat
    const myParticipantRows = await prisma.chatParticipant.findMany({
        where: { userId, chatId: { in: chats.map((c) => c.id) } },
        select: { chatId: true, lastReadAt: true }
    });
    const chatIdToLastRead = new Map(myParticipantRows.map((r) => [Number(r.chatId), r.lastReadAt]));

    const result = await Promise.all(
        chats.map(async (c) => {
            const lastReadAt = chatIdToLastRead.get(Number(c.id));
            const unread = await prisma.message.count({
                where: {
                    chatId: c.id,
                    createdAt: lastReadAt ? { gt: lastReadAt } : undefined,
                    NOT: { senderId: userId }
                }
            });

            return {
                id: Number(c.id),
                participants: c.participants.map((p) => ({
                    id: Number(p.userId),
                    name: `${p.user.firstName ?? ''} ${p.user.lastName ?? ''}`.trim(),
                    online: !!(p.user.lastSeenAt && now.getTime() - new Date(p.user.lastSeenAt).getTime() < ONLINE_THRESHOLD_MS)
                })),
                last_message: c.messages[0]
                    ? {
                          id: Number(c.messages[0].id),
                          text: c.messages[0].content,
                          at: c.messages[0].createdAt,
                          from: {
                              id: Number(c.messages[0].senderId),
                              name: `${c.messages[0].sender.firstName ?? ''} ${c.messages[0].sender.lastName ?? ''}`.trim()
                          }
                      }
                    : null,
                unread
            };
        })
    );

    return json(result);
};

export const POST: RequestHandler = async (event) => {
    requireAuth(event);
    const me = event.locals.user!;
    const body = await event.request.json().catch(() => ({} as any));
    const { participant_ids } = body ?? {};
    const ids = Array.from(new Set([...(participant_ids ?? []), Number(me.id)])).map((n: number) => BigInt(n));
    if (ids.length < 2) return json({ error: 'At least one participant required' }, { status: 400 });

    // Find if a chat with exactly these participants already exists
    // 1. Find chats for this user, with exact number of participants
    const candidateChats = await prisma.chat.findMany({
        where: {
            participants: {
                every: {
                    userId: { in: ids }
                }
            },
            // Only chats that have the same number of participants
            // Note: we will filter exactly below, Prisma cannot do this perfectly inline
        },
        include: {
            participants: true
        }
    });

    // Filter to only chats where participants **match exactly** the list (order irrelevant)
    const matchingChat = candidateChats.find((chat) => {
        const chatUserIds = chat.participants.map((p) => p.userId.toString()).sort();
        const idsStr = ids.map((id) => id.toString()).sort();
        if (chatUserIds.length !== idsStr.length) return false;
        for (let i = 0; i < chatUserIds.length; ++i) {
            if (chatUserIds[i] !== idsStr[i]) return false;
        }
        return true;
    });

    if (matchingChat) {
        return json({ error: 'A chat with these members already exists.' }, { status: 409 });
    }

    const chat = await prisma.chat.create({
        data: {
            participants: { create: ids.map((uid: bigint) => ({ userId: uid })) }
        },
        include: { participants: true }
    });

    return json({ id: Number(chat.id) }, { status: 201 });
};


