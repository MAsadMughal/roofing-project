import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, hasRole } from '$lib/server/auth';

// GET: Get all participants for a job (fixed + crew)
export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const job = await prisma.job.findUnique({
			where: { id: jobId },
			include: {
				assignment: {
					include: {
						assignedTo: true,
						owner: true,
						estimator: true
					}
				},
				participants: {
					include: {
						user: true
					}
				}
			}
		});

		if (!job) {
			return new Response('Job not found', { status: 404 });
		}

		// Get fixed participants from assignment
		const fixedParticipants: any[] = [];
		if (job.assignment) {
			if (job.assignment.assignedTo) {
				fixedParticipants.push({
					id: String(job.assignment.assignedTo.id),
					firstName: job.assignment.assignedTo.firstName,
					lastName: job.assignment.assignedTo.lastName,
					email: job.assignment.assignedTo.email,
					role: job.assignment.assignedTo.role,
					type: 'fixed' // Sales rep
				});
			}
			if (job.assignment.owner) {
				fixedParticipants.push({
					id: String(job.assignment.owner.id),
					firstName: job.assignment.owner.firstName,
					lastName: job.assignment.owner.lastName,
					email: job.assignment.owner.email,
					role: job.assignment.owner.role,
					type: 'fixed' // Owner
				});
			}
			if (job.assignment.estimator) {
				fixedParticipants.push({
					id: String(job.assignment.estimator.id),
					firstName: job.assignment.estimator.firstName,
					lastName: job.assignment.estimator.lastName,
					email: job.assignment.estimator.email,
					role: job.assignment.estimator.role,
					type: 'fixed' // Estimator
				});
			}
		}

		// Get crew members (participants)
		const crewMembers = job.participants.map((p) => ({
			id: String(p.user.id),
			firstName: p.user.firstName,
			lastName: p.user.lastName,
			email: p.user.email,
			role: p.user.role,
			type: 'crew',
			participantId: String(p.id) // For deletion
		}));

		// Remove duplicates (crew members might already be in fixed participants)
		const allParticipants = [...fixedParticipants];
		const fixedIds = fixedParticipants.map((p) => p.id);
		crewMembers.forEach((crew) => {
			if (!fixedIds.includes(crew.id)) {
				allParticipants.push(crew);
			}
		});

		return json(allParticipants);
	} catch (error) {
		console.error('Error fetching participants:', error);
		return new Response('Failed to fetch participants', { status: 500 });
	}
};

// POST: Add crew member to job
export const POST: RequestHandler = async (event) => {
	await requireAuth(event);

	// Only OWNER can add participants
	if (!hasRole(event, ['OWNER'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const { params, request } = event;
	const jobId = BigInt(params.id);
	const { userId } = await request.json();

	if (!userId) {
		return new Response('User ID is required', { status: 400 });
	}

	try {
		// Check if job exists
		const job = await prisma.job.findUnique({
			where: { id: jobId }
		});

		if (!job) {
			return new Response('Job not found', { status: 404 });
		}

		// Check if user exists and is in same organization
		const user = await prisma.user.findUnique({
			where: { id: BigInt(userId) }
		});

		if (!user) {
			return new Response('User not found', { status: 404 });
		}

		// Check if already a participant
		const existing = await prisma.jobParticipant.findUnique({
			where: {
				jobId_userId: {
					jobId,
					userId: BigInt(userId)
				}
			}
		});

		if (existing) {
			return new Response('User is already a participant', { status: 400 });
		}

		// Add participant
		const participant = await prisma.jobParticipant.create({
			data: {
				jobId,
				userId: BigInt(userId)
			},
			include: {
				user: true
			}
		});

		// Create feed item
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'participant_added',
				content: `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim() || participant.user.email + ' added as crew member',
				createdById: event.locals.user!.id as unknown as bigint,
				taggedUserIds: [],
				metadata: { userId: String(participant.user.id), participantId: String(participant.id) }
			}
		});

		return json({
			id: String(participant.user.id),
			firstName: participant.user.firstName,
			lastName: participant.user.lastName,
			email: participant.user.email,
			role: participant.user.role,
			type: 'crew',
			participantId: String(participant.id)
		});
	} catch (error: any) {
		console.error('Error adding participant:', error);
		if (error.code === 'P2002') {
			return new Response('User is already a participant', { status: 400 });
		}
		return new Response('Failed to add participant', { status: 500 });
	}
};

// DELETE: Remove crew member from job
export const DELETE: RequestHandler = async (event) => {
	await requireAuth(event);

	// Only OWNER can remove participants
	if (!hasRole(event, ['OWNER'])) {
		return new Response('Forbidden', { status: 403 });
	}

	const { params, request } = event;
	const jobId = BigInt(params.id);
	const { participantId } = await request.json();

	if (!participantId) {
		return new Response('Participant ID is required', { status: 400 });
	}

	try {
		// Check if participant exists
		const participant = await prisma.jobParticipant.findUnique({
			where: { id: BigInt(participantId) },
			include: {
				user: true,
				job: true
			}
		});

		if (!participant || participant.jobId !== jobId) {
			return new Response('Participant not found', { status: 404 });
		}

		// Store user info for feed item
		const userName = `${participant.user.firstName || ''} ${participant.user.lastName || ''}`.trim() || participant.user.email;

		// Delete participant
		await prisma.jobParticipant.delete({
			where: { id: BigInt(participantId) }
		});

		// Create feed item
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'participant_removed',
				content: `${userName} removed from crew`,
				createdById: event.locals.user!.id as unknown as bigint,
				taggedUserIds: [],
				metadata: { userId: String(participant.user.id), participantId: String(participant.id) }
			}
		});

		return new Response(null, { status: 204 });
	} catch (error) {
		console.error('Error removing participant:', error);
		return new Response('Failed to remove participant', { status: 500 });
	}
};

