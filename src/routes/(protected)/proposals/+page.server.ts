import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	const { url } = event;
	await requireAuth(event);
	const user = event.locals.user!;
	const userId = user.id as unknown as bigint;
	const role = user?.role ?? null;
	const q = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const searchQuery = q ? q.toLowerCase().trim() : '';

	let proposalWhere: any = {};
	let proposalInclude = {
		estimate: true,
		assignment: true
	};

	if (role === 'OWNER') {
		proposalWhere = {
			assignment: { ownerId: userId }
		};
	} else if (role === 'REP') {
		proposalWhere = {
			assignment: { assignedToId: userId }
		};
	} else if (role === 'ESTIMATOR') {
		proposalWhere = {
			assignment: { estimatorId: userId }
		};
	} else {
		proposalWhere = {}; // fallback, show all or none
	}

	if (status && status !== 'All') {
		proposalWhere = {
			...proposalWhere,
			status: status.toLowerCase()
		};
	}

	const proposalsRaw = await prisma.proposal.findMany({
		where: proposalWhere,
		include: {
			estimate: {
				include: {
					customer: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true,
							phone: true
						}
					}
				}
			},
			assignment: {
				include: {
					lead: {
						select: {
							id: true,
							title: true,
							description: true,
							status: true,
							source: true
						}
					},
					assignedTo: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true
						}
					},
					estimator: {
						select: {
							id: true,
							firstName: true,
							lastName: true,
							email: true
						}
					}
				}
			}
		},
		orderBy: { createdAt: 'desc' }
	});

	const proposals = proposalsRaw
		.filter((p) => {
			if (!searchQuery) return true;
			const customerName = `${p.estimate?.customer?.firstName ?? ''} ${p.estimate?.customer?.lastName ?? ''}`.toLowerCase();
			const leadTitle = p.assignment?.lead?.title?.toLowerCase() ?? '';
			return customerName.includes(searchQuery) || leadTitle.includes(searchQuery);
		})
		.map((p) => ({
			id: Number(p.id),
			assignmentId: Number(p.assignmentId),
			estimateId: Number(p.estimateId),
			status: p.status,
			createdAt: p.createdAt.toISOString(),
			sentAt: p.sentAt?.toISOString() ?? null,
			viewedAt: p.viewedAt?.toISOString() ?? null,
			signedAt: p.signedAt?.toISOString() ?? null,
			subject: p.subject,
			content: p.content,
			totalAmount: p.estimate ? Number(p.estimate.totalAmount ?? 0) : 0,
			customer: p.estimate?.customer
				? {
						id: Number(p.estimate.customer.id),
						firstName: p.estimate.customer.firstName,
						lastName: p.estimate.customer.lastName,
						email: p.estimate.customer.email,
						phone: p.estimate.customer.phone
				  }
				: null,
			assignment: p.assignment
				? {
						id: Number(p.assignment.id),
						leadId: Number(p.assignment.leadId),
						status: p.assignment.status,
						assignedTo: p.assignment.assignedTo
							? {
									id: Number(p.assignment.assignedTo.id),
									firstName: p.assignment.assignedTo.firstName,
									lastName: p.assignment.assignedTo.lastName,
									email: p.assignment.assignedTo.email
							  }
							: null,
						estimator: p.assignment.estimator
							? {
									id: Number(p.assignment.estimator.id),
									firstName: p.assignment.estimator.firstName,
									lastName: p.assignment.estimator.lastName,
									email: p.assignment.estimator.email
							  }
							: null,
						lead: p.assignment.lead
							? {
									id: Number(p.assignment.lead.id),
									title: p.assignment.lead.title,
									description: p.assignment.lead.description,
									status: p.assignment.lead.status,
									source: p.assignment.lead.source
							  }
							: null
				  }
				: null
		}));

	return { proposals, q, status, role };
};
