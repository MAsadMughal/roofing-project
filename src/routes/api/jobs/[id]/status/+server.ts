import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const PUT: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const jobId = BigInt(params.id);
	const { status } = await request.json();

	if (!status) {
		return new Response('Status is required', { status: 400 });
	}

	const validStatuses = ['scheduled', 'in_progress', 'pending_payment', 'completed', 'cancelled'];
	if (!validStatuses.includes(status)) {
		return new Response('Invalid status', { status: 400 });
	}

	try {
		const job = await prisma.job.findUnique({
			where: { id: jobId },
			include: {
				statusHistory: {
					orderBy: { createdAt: 'desc' },
					take: 1
				}
			}
		});

		if (!job) {
			return new Response('Job not found', { status: 404 });
		}

		const oldStatus = job.status;
		const updated = await prisma.job.update({
			where: { id: jobId },
			data: { status }
		});

		// Add status history entry
		await prisma.jobStatusHistory.create({
			data: {
				jobId,
				status: status,
				addedById: user.id as unknown as bigint
			}
		});

		// Create feed item for status change
		if (oldStatus !== status) {
			await prisma.jobFeedItem.create({
				data: {
					jobId,
					type: 'status_update',
					content: `Job status changed from "${oldStatus}" to "${status}"`,
					createdById: user.id as unknown as bigint,
					taggedUserIds: [],
					metadata: { oldStatus, newStatus: status }
				}
			});
		}

		// Get updated status history
		const statusHistory = await prisma.jobStatusHistory.findMany({
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

		return json({
			status: updated.status,
			statusHistory: statusHistory.map((sh) => ({
				id: String(sh.id),
				status: sh.status,
				description: sh.description,
				addedBy: {
					id: String(sh.addedBy.id),
					firstName: sh.addedBy.firstName,
					lastName: sh.addedBy.lastName,
					email: sh.addedBy.email
				},
				createdAt: sh.createdAt.toISOString()
			}))
		});
	} catch (error) {
		console.error('Error updating job status:', error);
		return new Response('Failed to update job status', { status: 500 });
	}
};

