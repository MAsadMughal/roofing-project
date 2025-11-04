import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, hasRole } from '$lib/server/auth';

export const PUT: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;

	// Only OWNER and REP can update progress
	if (!hasRole(event, ['OWNER', 'REP'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const jobId = BigInt(params.id);
	const { progress } = await request.json();

	if (typeof progress !== 'number' || progress < 0 || progress > 100) {
		return new Response('Invalid progress value', { status: 400 });
	}

	try {
		const updated = await prisma.job.update({
			where: { id: jobId },
			data: { progress }
		});

		// Create feed item for progress update
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'status_update',
				content: `Progress updated to ${progress}%`,
				createdById: userId,
				taggedUserIds: [],
				metadata: { progress, type: 'progress_update' }
			}
		});

		return json({ progress: updated.progress });
	} catch (error) {
		console.error('Error updating progress:', error);
		return new Response('Failed to update progress', { status: 500 });
	}
};

