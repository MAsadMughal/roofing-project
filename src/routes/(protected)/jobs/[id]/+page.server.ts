import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	await requireAuth(event);
	const { params, locals } = event;
	const user = locals.user!;
	const userId = user.id as unknown as bigint;
	const jobId = BigInt(params.id);

	try {
		// Fetch job with all related data
		const job = await prisma.job.findUnique({
			where: { id: jobId },
			include: {
				customer: {
					select: {
						id: true,
						firstName: true,
						lastName: true,
						email: true,
						phone: true,
						addressLine1: true,
						addressLine2: true,
						city: true,
						state: true,
						postalCode: true
					}
				},
				assignment: {
					include: {
						assignedTo: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
								role: true
							}
						},
						owner: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
								role: true
							}
						},
						estimator: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
								role: true
							}
						}
					}
				},
				statusHistory: {
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
				},
				notes: {
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
				},
				feedItems: {
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
				},
				todos: {
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
				},
				invoices: {
					include: {
						items: true,
						payments: true,
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
				},
				participants: {
					include: {
						user: {
							select: {
								id: true,
								firstName: true,
								lastName: true,
								email: true,
								role: true
							}
						}
					}
				}
			}
		});

		if (!job) {
			return {
				job: null,
				participants: [],
				canEditProgress: false,
				canManageInvoices: false
			};
		}

		// Get fixed participants (sales rep, owner, estimator) from assignment
		const fixedParticipants: any[] = [];
		if (job.assignment) {
			if (job.assignment.assignedTo) {
				fixedParticipants.push({
					id: String(job.assignment.assignedTo.id),
					firstName: job.assignment.assignedTo.firstName,
					lastName: job.assignment.assignedTo.lastName,
					email: job.assignment.assignedTo.email,
					role: job.assignment.assignedTo.role,
					type: 'fixed'
				});
			}
			if (job.assignment.owner) {
				fixedParticipants.push({
					id: String(job.assignment.owner.id),
					firstName: job.assignment.owner.firstName,
					lastName: job.assignment.owner.lastName,
					email: job.assignment.owner.email,
					role: job.assignment.owner.role,
					type: 'fixed'
				});
			}
			if (job.assignment.estimator) {
				fixedParticipants.push({
					id: String(job.assignment.estimator.id),
					firstName: job.assignment.estimator.firstName,
					lastName: job.assignment.estimator.lastName,
					email: job.assignment.estimator.email,
					role: job.assignment.estimator.role,
					type: 'fixed'
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

		// Combine fixed participants and crew members, removing duplicates
		const allParticipants = [...fixedParticipants];
		const fixedIds = fixedParticipants.map((p) => p.id);
		crewMembers.forEach((crew) => {
			if (!fixedIds.includes(crew.id)) {
				allParticipants.push(crew);
			}
		});

		// Remove duplicates
		const uniqueParticipants = allParticipants.filter(
			(p, index, self) => index === self.findIndex((t) => t.id === p.id)
		);

		// Check permissions
		const canEditProgress = user.role === 'OWNER' || user.role === 'REP';
		const canManageInvoices = user.role === 'OWNER' || user.role === 'REP';

		// Transform job data
		const jobData = {
			id: String(job.id),
			title: job.title,
			description: job.description,
			status: job.status,
			priority: job.priority || 'medium',
			progress: job.progress || 0,
			scheduledDate: job.scheduledDate?.toISOString() || null,
			startDate: job.startDate?.toISOString() || null,
			endDate: job.endDate?.toISOString() || null,
			crewDetails: job.crewDetails,
			createdAt: job.createdAt.toISOString(),
			updatedAt: job.updatedAt.toISOString(),
			customer: {
				id: String(job.customer.id),
				firstName: job.customer.firstName,
				lastName: job.customer.lastName,
				email: job.customer.email || '',
				phone: job.customer.phone || '',
				address: [
					job.customer.addressLine1,
					job.customer.addressLine2,
					job.customer.city,
					job.customer.state,
					job.customer.postalCode
				]
					.filter(Boolean)
					.join(', ')
			},
			statusHistory: job.statusHistory.map((sh) => ({
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
			})),
			notes: job.notes.map((note) => ({
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
			})),
			feedItems: job.feedItems.map((item) => ({
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
			})),
			todos: job.todos.map((todo) => ({
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
			})),
			invoices: job.invoices.map((inv) => ({
				id: String(inv.id),
				invoiceNumber: inv.invoiceNumber,
				status: inv.status,
				subtotal: Number(inv.subtotal),
				taxRate: inv.taxRate ? Number(inv.taxRate) : 0,
				taxAmount: Number(inv.taxAmount),
				totalAmount: Number(inv.totalAmount),
				dueDate: inv.dueDate?.toISOString() || null,
				notes: inv.notes,
				items: inv.items.map((item) => ({
					id: String(item.id),
					name: item.name,
					description: item.description,
					quantity: Number(item.quantity),
					unitPrice: Number(item.unitPrice),
					total: Number(item.total)
				})),
				payments: inv.payments.map((p) => ({
					id: String(p.id),
					amount: Number(p.amount),
					method: p.method,
					paidAt: p.paidAt.toISOString()
				})),
				createdBy: inv.createdBy
					? {
							id: String(inv.createdBy.id),
							firstName: inv.createdBy.firstName,
							lastName: inv.createdBy.lastName,
							email: inv.createdBy.email
					  }
					: null,
				createdAt: inv.createdAt.toISOString()
			}))
		};

		return {
			job: jobData,
			participants: uniqueParticipants,
			canEditProgress,
			canManageInvoices,
			currentUser: {
				id: String(userId),
				firstName: user.firstName,
				lastName: user.lastName,
				email: user.email,
				role: user.role
			}
		};
	} catch (error) {
		console.error('Error loading job:', error);
		return {
			job: null,
			participants: [],
			canEditProgress: false,
			canManageInvoices: false
		};
	}
};

