import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const PUT: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	if (!params.id) {
		return new Response('Job ID is required', { status: 400 });
	}
	const jobId = BigInt(params.id);
	const { priority } = await request.json();

	if (!priority) {
		return new Response('Priority is required', { status: 400 });
	}

	const validPriorities = ['low', 'medium', 'high'];
	if (!validPriorities.includes(priority)) {
		return new Response('Invalid priority', { status: 400 });
	}

	try {
		const job = await prisma.job.findUnique({
			where: { id: jobId }
		});

		if (!job) {
			return new Response('Job not found', { status: 404 });
		}

		const oldPriority = job.priority || 'medium';
		const updated = await prisma.job.update({
			where: { id: jobId },
			data: { priority }
		});

		// Create feed item for priority change
		if (oldPriority !== priority) {
			await prisma.jobFeedItem.create({
				data: {
					jobId,
					type: 'status_update',
					content: `Job priority changed from "${oldPriority}" to "${priority}"`,
					createdById: user.id as unknown as bigint,
					taggedUserIds: [],
					metadata: { oldPriority, newPriority: priority, changeType: 'priority' } as any
				}
			});
		}

		return json({
			priority: updated.priority
		});
	} catch (error) {
		console.error('Error updating job priority:', error);
		return new Response('Failed to update job priority', { status: 500 });
	}
};

