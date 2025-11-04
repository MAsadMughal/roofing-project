import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params } = event;
	const jobId = BigInt(params.id);

	try {
		const todos = await prisma.jobTodo.findMany({
			where: { jobId },
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				},
				completedBy: {
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
			todos.map((todo) => ({
				id: String(todo.id),
				title: todo.title,
				description: todo.description,
				assignedToIds: todo.assignedToIds.map(String),
				completed: todo.completed,
				completedBy: todo.completedBy
					? {
							id: String(todo.completedBy.id),
							firstName: todo.completedBy.firstName,
							lastName: todo.completedBy.lastName,
							email: todo.completedBy.email
					  }
					: null,
				completedAt: todo.completedAt?.toISOString() || null,
				dueDate: todo.dueDate?.toISOString() || null,
				createdBy: {
					id: String(todo.createdBy.id),
					firstName: todo.createdBy.firstName,
					lastName: todo.createdBy.lastName,
					email: todo.createdBy.email
				},
				createdAt: todo.createdAt.toISOString()
			}))
		);
	} catch (error) {
		console.error('Error fetching todos:', error);
		return new Response('Failed to fetch todos', { status: 500 });
	}
};

export const POST: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	const { title, description, assignedToIds = [], dueDate } = await request.json();

	if (!title || typeof title !== 'string') {
		return new Response('Title is required', { status: 400 });
	}

	try {
		const todo = await prisma.jobTodo.create({
			data: {
				jobId,
				title,
				description: description || null,
				assignedToIds: assignedToIds.map((id: string) => BigInt(id)),
				dueDate: dueDate ? new Date(dueDate) : null,
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

		// Create feed item
		await prisma.jobFeedItem.create({
			data: {
				jobId,
				type: 'todo_created',
				content: `Todo created: ${title}`,
				createdById: userId,
				taggedUserIds: assignedToIds.map((id: string) => BigInt(id)),
				metadata: { todoId: String(todo.id), title }
			}
		});

		return json({
			id: String(todo.id),
			title: todo.title,
			description: todo.description,
			assignedToIds: todo.assignedToIds.map(String),
			completed: todo.completed,
			completedBy: null,
			completedAt: null,
			dueDate: todo.dueDate?.toISOString() || null,
			createdBy: {
				id: String(todo.createdBy.id),
				firstName: todo.createdBy.firstName,
				lastName: todo.createdBy.lastName,
				email: todo.createdBy.email
			},
			createdAt: todo.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error creating todo:', error);
		return new Response('Failed to create todo', { status: 500 });
	}
};

export const PUT: RequestHandler = async (event) => {
	await requireAuth(event);
	const { params, request, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	const { todoId, completed } = await request.json();

	if (!todoId || typeof completed !== 'boolean') {
		return new Response('Todo ID and completed status are required', { status: 400 });
	}

	try {
		const todo = await prisma.jobTodo.update({
			where: { id: BigInt(todoId), jobId },
			data: {
				completed,
				completedById: completed ? userId : null,
				completedAt: completed ? new Date() : null
			},
			include: {
				createdBy: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true
					}
				},
				completedBy: {
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
				type: completed ? 'todo_completed' : 'todo_reopened',
				content: completed ? `Todo completed: ${todo.title}` : `Todo reopened: ${todo.title}`,
				createdById: userId,
				taggedUserIds: todo.assignedToIds.map(String).map((id) => BigInt(id)),
				metadata: { todoId: String(todo.id), title: todo.title }
			}
		});

		return json({
			id: String(todo.id),
			title: todo.title,
			description: todo.description,
			assignedToIds: todo.assignedToIds.map(String),
			completed: todo.completed,
			completedBy: todo.completedBy
				? {
						id: String(todo.completedBy.id),
						firstName: todo.completedBy.firstName,
						lastName: todo.completedBy.lastName,
						email: todo.completedBy.email
				  }
				: null,
			completedAt: todo.completedAt?.toISOString() || null,
			dueDate: todo.dueDate?.toISOString() || null,
			createdBy: {
				id: String(todo.createdBy.id),
				firstName: todo.createdBy.firstName,
				lastName: todo.createdBy.lastName,
				email: todo.createdBy.email
			},
			createdAt: todo.createdAt.toISOString()
		});
	} catch (error) {
		console.error('Error updating todo:', error);
		return new Response('Failed to update todo', { status: 500 });
	}
};

