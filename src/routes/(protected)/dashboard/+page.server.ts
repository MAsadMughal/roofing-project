import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

export const load: PageServerLoad = async (event) => {
	requireAuth(event);
	const user = event.locals.user!;
	const userId = user.id as unknown as bigint;

	const now = new Date();
	const todayStart = new Date(now.getFullYear(), now.getMonth(), now.getDate());
	const currentMonthStart = new Date(now.getFullYear(), now.getMonth(), 1);

	let stats: any[] = [];
	let recentActivity: any[] = [];
	let upcomingInspections: any[] = [];
	let quickActions: any[] = [];

	if (user.role === 'OWNER') {
		// Owner sees: total projects, total revenue, team members, active jobs
		const [
			totalJobs,
			revenueMTD,
			activeLeads,
			teamMembers
		] = await Promise.all([
			prisma.job.count({
				where: { status: { in: ['scheduled', 'in_progress'] } }
			}),
			prisma.invoice.aggregate({
				where: { createdAt: { gte: currentMonthStart } },
				_sum: { totalAmount: true }
			}),
			prisma.lead.count({
				where: { status: { not: 'closed' } }
			}),
			prisma.user.count({
				where: { 
					contractorId: { in: [userId, user.contractorId as unknown as bigint].filter(Boolean) as any },
					NOT: { id: userId }
				}
			})
		]);

		const revenue = revenueMTD._sum.totalAmount || 0;
		stats = [
			{ label: 'Active Jobs', value: totalJobs, icon: 'Hammer', color: 'text-primary' },
			{ label: 'Revenue MTD', value: `$${revenue.toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`, icon: 'DollarSign', color: 'text-success' },
			{ label: 'Open Leads', value: activeLeads, icon: 'Users', color: 'text-info' },
			{ label: 'Team Members', value: teamMembers, icon: 'Users', color: 'text-warning' }
		];

		// Recent leads
		const leads = await prisma.lead.findMany({
			take: 5,
			orderBy: { updatedAt: 'desc' },
			include: {
				customer: { select: { firstName: true, lastName: true } },
				assignments: { take: 1, include: { assignedTo: { select: { firstName: true, lastName: true } } } }
			}
		});

		recentActivity = leads.map(lead => ({
			type: 'lead',
			title: lead.title,
			customer: `${lead.customer?.firstName || ''} ${lead.customer?.lastName || ''}`.trim(),
			status: lead.status,
			priority: lead.priority,
			assignedTo: lead.assignments[0]?.assignedTo ? `${lead.assignments[0].assignedTo.firstName} ${lead.assignments[0].assignedTo.lastName}`.trim() : 'Unassigned',
			updatedAt: lead.updatedAt
		}));

		quickActions = [
			{ label: 'New Lead', href: '/leads?new=true', icon: 'Plus' },
			{ label: 'Invite Member', href: '/members', icon: 'UserPlus' },
			{ label: 'View Reports', href: '/dashboard/reports', icon: 'FileText' }
		];
	} else if (user.role === 'REP') {
		// Rep sees: their leads, appointments today, conversion rate, follow-ups needed
		const [
			myLeads,
			appointmentsToday,
			convertedLeads,
			pendingFollowUps
		] = await Promise.all([
			prisma.assignment.count({
				where: { 
					assignedToId: userId,
					status: { not: 'closed' }
				}
			}),
			prisma.assignment.count({
				where: {
					assignedToId: userId,
					inspectionDate: { gte: todayStart, lt: new Date(todayStart.getTime() + 86400000) }
				}
			}),
			prisma.assignment.count({
				where: {
					assignedToId: userId,
					status: 'closed',
					lastStatusChangedAt: { gte: currentMonthStart }
				}
			}),
			prisma.assignment.count({
				where: {
					assignedToId: userId,
					status: { in: ['assigned', 'in_contact'] },
					updatedAt: { lt: new Date(now.getTime() - 2 * 86400000) }
				}
			})
		]);

		stats = [
			{ label: 'My Leads', value: myLeads, icon: 'Users', color: 'text-primary' },
			{ label: 'Appointments Today', value: appointmentsToday, icon: 'Calendar', color: 'text-info' },
			{ label: 'This Month Converted', value: convertedLeads, icon: 'ArrowUp', color: 'text-success' },
			{ label: 'Needs Follow-up', value: pendingFollowUps, icon: 'Clock', color: 'text-warning' }
		];

		const assignments = await prisma.assignment.findMany({
			take: 5,
			where: { assignedToId: userId },
			orderBy: { updatedAt: 'desc' },
			include: {
				lead: {
					include: { customer: { select: { firstName: true, lastName: true } } }
				}
			}
		});

		recentActivity = assignments.map(a => ({
			type: 'assignment',
			title: a.lead.title,
			customer: `${a.lead.customer?.firstName || ''} ${a.lead.customer?.lastName || ''}`.trim(),
			status: a.status,
			priority: a.lead.priority,
			updatedAt: a.updatedAt
		}));

		upcomingInspections = await prisma.assignment.findMany({
			take: 3,
			where: {
				assignedToId: userId,
				inspectionDate: { gte: todayStart }
			},
			orderBy: { inspectionDate: 'asc' },
			include: {
				lead: {
					include: { customer: { select: { firstName: true, lastName: true } } }
				}
			}
		}).then(items => items.map(item => ({
			customer: `${item.lead.customer?.firstName || ''} ${item.lead.customer?.lastName || ''}`.trim(),
			address: `${item.lead.title}`,
			time: item.inspectionDate ? new Date(item.inspectionDate).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit' }) : 'TBD',
			status: item.status === 'inspection_scheduled' ? 'Confirmed' : 'Pending'
		})));

		quickActions = [
			{ label: 'View Leads', href: '/rep', icon: 'Users' },
			{ label: 'Schedule Inspection', href: '/rep', icon: 'Calendar' },
			{ label: 'My Watchlist', href: '/watchlist', icon: 'User2' }
		];
	} else if (user.role === 'ESTIMATOR') {
		// Estimator sees: assigned inspections, docs uploaded, estimates created, pending approvals
		const [
			activeAssignments,
			docsUploaded,
			estimatesThisMonth,
			pendingProposals
		] = await Promise.all([
			prisma.assignment.count({
				where: { 
					estimatorId: userId,
					status: { in: ['inspection_scheduled', 'docs_uploaded', 'estimate_sent'] }
				}
			}),
			prisma.docs.count({
				where: { assignment: { estimatorId: userId } }
			}),
			prisma.estimate.count({
				where: {
					assignment: { estimatorId: userId },
					createdAt: { gte: currentMonthStart }
				}
			}),
			prisma.proposal.count({
				where: {
					assignment: { estimatorId: userId },
					status: 'sent'
				}
			})
		]);

		stats = [
			{ label: 'Active Assignments', value: activeAssignments, icon: 'FileText', color: 'text-primary' },
			{ label: 'Docs Uploaded', value: docsUploaded, icon: 'FileText', color: 'text-info' },
			{ label: 'Estimates This Month', value: estimatesThisMonth, icon: 'DollarSign', color: 'text-success' },
			{ label: 'Pending Proposals', value: pendingProposals, icon: 'Clock', color: 'text-warning' }
		];

		const assignments = await prisma.assignment.findMany({
			take: 5,
			where: { estimatorId: userId },
			orderBy: { updatedAt: 'desc' },
			include: {
				lead: {
					include: { customer: { select: { firstName: true, lastName: true } } }
				}
			}
		});

		recentActivity = assignments.map(a => ({
			type: 'assignment',
			title: a.lead.title,
			customer: `${a.lead.customer?.firstName || ''} ${a.lead.customer?.lastName || ''}`.trim(),
			status: a.status,
			updatedAt: a.updatedAt
		}));

		quickActions = [
			{ label: 'My Assignments', href: '/assignment-docs', icon: 'FileText' },
			{ label: 'Create Estimate', href: '/estimator', icon: 'Plus' },
			{ label: 'View Proposals', href: '/proposals', icon: 'FileText' }
		];
	}

	return {
		stats,
		recentActivity,
		upcomingInspections,
		quickActions,
		userRole: user.role
	};
};
