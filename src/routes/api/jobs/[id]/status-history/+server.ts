import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const history = await prisma.jobStatusHistory.findMany({
			where: { jobId },
			include: {
				addedBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			},
			orderBy: { createdAt: 'desc' }
		});

		return json(
			history.map((h) => ({
				id: String(h.id),
				status: h.status,
				description: h.description,
				addedBy: {
					id: String(h.addedBy.id),
					firstName: h.addedBy.firstName,
					lastName: h.addedBy.lastName,
					email: h.addedBy.email
				},
				createdAt: h.createdAt.toISOString()
			}))
		);
	} catch (error) {
		console.error('Error fetching status history:', error);
		return new Response('Failed to fetch status history', { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	const { status, description } = await request.json();

	if (!status || typeof status !== 'string') {
		return new Response('Status is required', { status: 400 });
	}

	try {
		const statusHistory = await prisma.jobStatusHistory.create({
			data: {
				jobId,
				status,
				description: description || null,
				addedById: userId
			},
			include: {
				addedBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		// Create feed item
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'status_update',
				content: `Status updated: ${status}`,
				createdById: userId,
				taggedUserIds: [],
				metadata: { statusHistoryId: String(statusHistory.id), status, description }
			}
		});

		return json({
			id: String(statusHistory.id),
			status: statusHistory.status,
			description: statusHistory.description,
			addedBy: {
				id: String(statusHistory.addedBy.id),
				firstName: statusHistory.addedBy.firstName,
				lastName: statusHistory.addedBy.lastName,
				email: statusHistory.addedBy.email
			},
			createdAt: statusHistory.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error creating status history:', error);
		return new Response('Failed to create status history', { status: 500 });
	}
};

