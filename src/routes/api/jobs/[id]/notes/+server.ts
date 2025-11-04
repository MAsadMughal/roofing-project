import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const notes = await prisma.jobNote.findMany({
			where: { jobId },
			include: {
				createdBy: {
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
			notes.map((note) => ({
				id: String(note.id),
				content: note.content,
				createdBy: {
					id: String(note.createdBy.id),
					firstName: note.createdBy.firstName,
					lastName: note.createdBy.lastName,
					email: note.createdBy.email
				},
				createdAt: note.createdAt.toISOString(),
				updatedAt: note.updatedAt.toISOString()
			}))
		);
	} catch (error) {
		console.error('Error fetching notes:', error);
		return new Response('Failed to fetch notes', { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	const { content } = await request.json();

	if (!content || typeof content !== 'string') {
		return new Response('Content is required', { status: 400 });
	}

	try {
		const note = await prisma.jobNote.create({
			data: {
				jobId,
				content,
				createdById: userId
			},
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				}
			}
		});

		return json({
			id: String(note.id),
			content: note.content,
			createdBy: {
				id: String(note.createdBy.id),
				firstName: note.createdBy.firstName,
				lastName: note.createdBy.lastName,
				email: note.createdBy.email
			},
			createdAt: note.createdAt.toISOString(),
			updatedAt: note.updatedAt.toISOString()
		});
	} catch (error) {
		console.error('Error creating note:', error);
		return new Response('Failed to create note', { status: 500 });
	}
};

export const DELETE: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, url } = event;
	const jobId = BigInt(params.id);
	const noteId = url.searchParams.get('noteId');

	if (!noteId) {
		return new Response('Note ID is required', { status: 400 });
	}

	try {
		await prisma.jobNote.delete({
			where: { id: BigInt(noteId), jobId }
		});

		return json({ success: true });
	} catch (error) {
		console.error('Error deleting note:', error);
		return new Response('Failed to delete note', { status: 500 });
	}
};

