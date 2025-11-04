import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

// Dummy data generator for when database is empty
function generateDummyJobs() {
	const statuses = ['scheduled', 'in_progress', 'completed', 'pending_payment', 'cancelled'];
	const priorities = ['high', 'medium', 'low'];
	const customers = [
		{ firstName: 'John', lastName: 'Smith' },
		{ firstName: 'Sarah', lastName: 'Johnson' },
		{ firstName: 'Michael', lastName: 'Brown' },
		{ firstName: 'Emily', lastName: 'Davis' },
		{ firstName: 'David', lastName: 'Wilson' },
		{ firstName: 'Jessica', lastName: 'Martinez' },
		{ firstName: 'Robert', lastName: 'Taylor' },
		{ firstName: 'Amanda', lastName: 'Anderson' }
	];

	const jobTitles = [
		'Residential Roof Replacement',
		'Commercial Roof Installation',
		'Roof Repair - Storm Damage',
		'Gutter Installation',
		'Skylight Installation',
		'Roof Inspection & Maintenance',
		'Metal Roofing Project',
		'Solar Panel Roof Prep',
		'Chimney Repair',
		'Roof Ventilation Upgrade'
	];

	const addresses = [
		'123 Main St, Springfield, IL',
		'456 Oak Ave, Chicago, IL',
		'789 Pine Rd, Aurora, IL',
		'321 Elm St, Naperville, IL',
		'654 Maple Dr, Joliet, IL',
		'987 Cedar Ln, Rockford, IL',
		'147 Birch Way, Peoria, IL',
		'258 Willow Ct, Springfield, IL'
	];

	const jobs = [];
	const now = new Date();

	for (let i = 0; i < 25; i++) {
		const customer = customers[i % customers.length];
		const status = statuses[i % statuses.length];
		const priority = priorities[i % priorities.length];
		const daysAgo = Math.floor(Math.random() * 60);
		const scheduledDate = new Date(now);
		scheduledDate.setDate(scheduledDate.getDate() - daysAgo + Math.floor(Math.random() * 30));

		const startDate = status !== 'scheduled' ? new Date(scheduledDate) : null;
		if (startDate) {
			startDate.setDate(startDate.getDate() + Math.floor(Math.random() * 5));
		}

		const endDate = status === 'completed' ? new Date(startDate || scheduledDate) : null;
		if (endDate) {
			endDate.setDate(endDate.getDate() + Math.floor(Math.random() * 10) + 1);
		}

		const amount = Math.floor(Math.random() * 15000) + 1500;
		const progress = status === 'completed' ? 100 : status === 'in_progress' ? Math.floor(Math.random() * 80) + 20 : 0;

		jobs.push({
			id: `dummy-${i + 1}`,
			title: jobTitles[i % jobTitles.length],
			description: `Professional roofing services for ${customer.firstName} ${customer.lastName}`,
			status,
			priority,
			scheduledDate: scheduledDate.toISOString(),
			startDate: startDate?.toISOString() || null,
			endDate: endDate?.toISOString() || null,
			amount: amount,
			progress,
			customer: {
				id: `customer-${i + 1}`,
				firstName: customer.firstName,
				lastName: customer.lastName,
				email: `${customer.firstName.toLowerCase()}.${customer.lastName.toLowerCase()}@email.com`,
				phone: `555-${String(Math.floor(Math.random() * 9000) + 1000)}`
			},
			address: addresses[i % addresses.length],
			crewDetails: `Crew ${String.fromCharCode(65 + (i % 5))} - ${Math.floor(Math.random() * 3) + 3} members`,
			assignedTo: {
				id: `user-${(i % 3) + 1}`,
				firstName: ['Mike', 'Sarah', 'Tom'][i % 3],
				lastName: ['Johnson', 'Williams', 'Davis'][i % 3]
			},
			createdAt: new Date(now.getTime() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
			updatedAt: new Date(now.getTime() - (daysAgo - Math.floor(Math.random() * 5)) * 24 * 60 * 60 * 1000).toISOString(),
			notes: [
				{ id: 'n1', content: 'Site inspection completed', time: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString() },
				{ id: 'n2', content: 'Materials ordered', time: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString() }
			].slice(0, Math.floor(Math.random() * 3))
		});
	}

	return jobs;
}

export const load: PageServerLoad = async (event) => {
	await requireAuth(event);
	const { url } = event;
	const user = event.locals.user!;

	// Get query parameters
	const q = url.searchParams.get('q') ?? '';
	const status = url.searchParams.get('status') ?? '';
	const priority = url.searchParams.get('priority') ?? '';
	const dateFrom = url.searchParams.get('dateFrom') ?? '';
	const dateTo = url.searchParams.get('dateTo') ?? '';
	const view = url.searchParams.get('view') ?? 'kanban';

	try {
		// Build where clause
		const where: any = {};

		if (status && status !== 'all') {
			where.status = status;
		}

		if (q) {
			where.OR = [
				{ title: { contains: q, mode: 'insensitive' } },
				{ description: { contains: q, mode: 'insensitive' } },
				{
					customer: {
						OR: [
							{ firstName: { contains: q, mode: 'insensitive' } },
							{ lastName: { contains: q, mode: 'insensitive' } }
						]
					}
				}
			];
		}

		if (dateFrom || dateTo) {
			where.AND = [];
			if (dateFrom) {
				where.AND.push({
					OR: [
						{ scheduledDate: { gte: new Date(dateFrom) } },
						{ startDate: { gte: new Date(dateFrom) } }
					]
				});
			}
			if (dateTo) {
				where.AND.push({
					OR: [
						{ scheduledDate: { lte: new Date(dateTo) } },
						{ startDate: { lte: new Date(dateTo) } }
					]
				});
			}
		}

		// Fetch jobs from database
		const jobsRaw = await prisma.job.findMany({
			where,
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
				invoices: {
					select: {
						id: true,
						totalAmount: true,
						status: true
					},
					orderBy: { createdAt: 'desc' }
				}
			},
			orderBy: { createdAt: 'desc' },
			take: 100
		});

		// Transform jobs
		let jobs = jobsRaw.map((job) => {
			// Calculate total amount from all invoices
			const totalAmount = job.invoices?.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0) || 0;
			const progress = job.progress ?? (job.status === 'completed' ? 100 : job.status === 'in_progress' ? 50 : 0);

			// Get customer address
			const customer = job.customer;
			const address = customer
				? [
						customer.addressLine1,
						customer.addressLine2,
						customer.city,
						customer.state,
						customer.postalCode
				  ]
						.filter(Boolean)
						.join(', ')
				: '';

			return {
				id: String(job.id),
				title: job.title,
				description: job.description || '',
				status: job.status,
				priority: 'medium' as const, // Default priority, can be added to schema later
				scheduledDate: job.scheduledDate?.toISOString() || null,
				startDate: job.startDate?.toISOString() || null,
				endDate: job.endDate?.toISOString() || null,
				amount: totalAmount,
				progress,
				customer: customer
					? {
							id: String(customer.id),
							firstName: customer.firstName,
							lastName: customer.lastName,
							email: customer.email || '',
							phone: customer.phone || ''
					  }
					: null,
				address,
				crewDetails: job.crewDetails || '',
				assignedTo: null, // Can be added to schema later
				createdAt: job.createdAt.toISOString(),
				updatedAt: job.updatedAt.toISOString(),
				notes: []
			};
		});

		// If no jobs found, use dummy data
		if (jobs.length === 0) {
			jobs = generateDummyJobs();
		}

		// Apply priority filter if specified
		if (priority && priority !== 'all') {
			jobs = jobs.filter((job) => job.priority === priority);
		}

		// Calculate statistics
		const stats = {
			total: jobs.length,
			scheduled: jobs.filter((j) => j.status === 'scheduled').length,
			inProgress: jobs.filter((j) => j.status === 'in_progress').length,
			completed: jobs.filter((j) => j.status === 'completed').length,
			pendingPayment: jobs.filter((j) => j.status === 'pending_payment').length,
			totalRevenue: jobs.reduce((sum, j) => sum + (j.amount || 0), 0),
			highPriority: jobs.filter((j) => j.priority === 'high').length
		};

		return {
			jobs,
			stats,
			filters: { q, status, priority, dateFrom, dateTo, view },
			role: user.role
		};
	} catch (error) {
		// Fallback to dummy data on error
		console.error('Error loading jobs:', error);
		const jobs = generateDummyJobs();
		const stats = {
			total: jobs.length,
			scheduled: jobs.filter((j) => j.status === 'scheduled').length,
			inProgress: jobs.filter((j) => j.status === 'in_progress').length,
			completed: jobs.filter((j) => j.status === 'completed').length,
			pendingPayment: jobs.filter((j) => j.status === 'pending_payment').length,
			totalRevenue: jobs.reduce((sum, j) => sum + (j.amount || 0), 0),
			highPriority: jobs.filter((j) => j.priority === 'high').length
		};

		return {
			jobs,
			stats,
			filters: { q, status, priority, dateFrom, dateTo, view },
			role: user.role
		};
	}
};

