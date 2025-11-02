import type { LayoutServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: LayoutServerLoad = async ({ locals }) => {
	if (!locals.user) {
		return {
			user: null,
			unreadChatCount: 0
		};
	}

	const userId = locals.user.id as unknown as bigint;
	const myParticipantRows = await prisma.chatParticipant.findMany({
		where: { userId },
		select: { chatId: true, lastReadAt: true }
	});

	const chatIds = myParticipantRows.map((r) => r.chatId);
	const chatIdToLastRead = new Map(myParticipantRows.map((r) => [Number(r.chatId), r.lastReadAt]));
	let totalUnread = 0;

	if (chatIds.length > 0) {
		const unreadCounts = await Promise.all(
			chatIds.map(async (chatId) => {
				const lastReadAt = chatIdToLastRead.get(Number(chatId));
				return prisma.message.count({
					where: {
						chatId,
						...(lastReadAt ? { createdAt: { gt: lastReadAt } } : {}),
						NOT: { senderId: userId }
					}
				});
			})
		);
		totalUnread = unreadCounts.reduce((acc, n) => acc + n, 0);
	}

	return {
		user: locals.user,
		unreadChatCount: totalUnread
	};
};