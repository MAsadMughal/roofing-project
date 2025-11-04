import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const feedItems = await prisma.jobFeedItem.findMany({
			where: { jobId },
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						role: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json(
			feedItems.map((item) => ({
				id: String(item.id),
				type: item.type,
				content: item.content,
				taggedUserIds: item.taggedUserIds.map(String),
				metadata: item.metadata,
				createdBy: {
					id: String(item.createdBy.id),
					firstName: item.createdBy.firstName,
					lastName: item.createdBy.lastName,
					email: item.createdBy.email,
					role: item.createdBy.role
				},
				createdAt: item.createdAt.toISOString()
			}))
		);
	} catch (error) {
		console.error('Error fetching feed:', error);
		return new Response('Failed to fetch feed', { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	const { content, taggedUserIds = [] } = await request.json();

	if (!content || typeof content !== 'string') {
		return new Response('Content is required', { status: 400 });
	}

	try {
		const feedItem = await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'message',
				content,
				createdById: userId,
				taggedUserIds: taggedUserIds.map((id: string) => BigInt(id)),
				metadata: null
			},
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						role: true
					}
				}
			}
		});

		return json({
			id: String(feedItem.id),
			type: feedItem.type,
			content: feedItem.content,
			taggedUserIds: feedItem.taggedUserIds.map(String),
			metadata: feedItem.metadata,
			createdBy: {
				id: String(feedItem.createdBy.id),
				firstName: feedItem.createdBy.firstName,
				lastName: feedItem.createdBy.lastName,
				email: feedItem.createdBy.email,
				role: feedItem.createdBy.role
			},
			createdAt: feedItem.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error creating feed item:', error);
		return new Response('Failed to create feed item', { status: 500 });
	}
};

