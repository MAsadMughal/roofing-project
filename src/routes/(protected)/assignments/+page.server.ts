import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth, requireRole } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	requireRole(event, 'OWNER');

	const ownerId = event.locals.user!.id as unknown as bigint;

	const assignments = await prisma.assignment.findMany({
		where: { ownerId },
		orderBy: { createdAt: 'desc' },
		include: {
			lead: {
				include: {
					customer: { select: { id: true, firstName: true, lastName: true, email: true, phone: true } }
				}
			},
			assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } },
			estimator: { select: { id: true, firstName: true, lastName: true, email: true } }
		}
	});

	return {
		assignments: assignments.map(a => ({
			id: a.id.toString(),
			leadId: a.leadId.toString(),
			leadTitle: a.lead.title,
			customer: a.lead.customer ? {
				id: a.lead.customer.id.toString(),
				name: `${a.lead.customer.firstName || ''} ${a.lead.customer.lastName || ''}`.trim(),
				email: a.lead.customer.email,
				phone: a.lead.customer.phone
			} : null,
			assignedTo: {
				id: a.assignedTo.id.toString(),
				name: `${a.assignedTo.firstName || ''} ${a.assignedTo.lastName || ''}`.trim(),
				email: a.assignedTo.email
			},
			estimator: a.estimator ? {
				id: a.estimator.id.toString(),
				name: `${a.estimator.firstName || ''} ${a.estimator.lastName || ''}`.trim(),
				email: a.estimator.email
			} : null,
			status: a.status,
			role: a.role,
			inspectionDate: a.inspectionDate,
			assignedAt: a.assignedAt,
			createdAt: a.createdAt,
			updatedAt: a.updatedAt,
			history: a.history
		}))
	};
};

