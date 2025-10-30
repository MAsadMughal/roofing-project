import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth, requireRole } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	requireRole(event, 'ESTIMATOR');

	const estimatorId = event.locals.user!.id as unknown as bigint;

	const assignmentsRaw = await prisma.assignment.findMany({
		where: { estimatorId },
		orderBy: { createdAt: 'desc' },
		select: {
			id: true,
			leadId: true,
			status: true,
			lead: {
				select: {
					id: true,
					title: true,
					status: true,
					customer: { select: { id: true, firstName: true, lastName: true } }
				}
			}
		}
	});

	const assignments = assignmentsRaw.map((a) => ({
		id: a.id.toString(),
		leadId: a.leadId.toString(),
		status: a.status,
		lead: a.lead
	}));

	const assignmentIds = assignments.map((a) => a.id);
	let docsByAssignmentId: Record<string, any | null> = {};
	if (assignmentIds.length > 0) {
		const docsRows = await prisma.docs.findMany({
			where: { assignmentId: { in: assignmentIds } },
			orderBy: { createdAt: 'desc' },
			select: { id: true, assignmentId: true, docs: true, createdAt: true }
		});
		for (const row of docsRows) {
			const key = row.assignmentId.toString();
			if (!(key in docsByAssignmentId)) {
				docsByAssignmentId[key] = {
					id: row.id.toString(),
					assignmentId: row.assignmentId.toString(),
					docs: row.docs,
					createdAt: row.createdAt.toISOString()
				};
			}
		}
	}

	return {
		assignments,
		docsByAssignmentId
	};
};


