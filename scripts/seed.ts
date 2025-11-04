import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
	console.log('🌱 Seeding database with Prisma...');

	// Find users (we need them for relationships)
	const owner = await prisma.user.findFirst({ where: { role: 'OWNER' } });
	const rep = await prisma.user.findFirst({ where: { role: 'REP' } });

	if (!owner || !rep) {
		console.log('⚠️  No users found. Please create users first.');
		return;
	}

	// Find customers
	const customers = await prisma.customer.findMany({
		where: {
			email: {
				in: [
					'john.doe@example.com',
					'emma.brown@example.com',
					'mike.taylor@example.com',
					'sarah.johnson@example.com',
					'robert.king@example.com',
					'sophia.martinez@example.com',
					'daniel.lee@example.com',
					'william.harris@example.com'
				]
			}
		}
	});

	const customerMap = new Map(customers.map((c) => [c.email, c]));

	// Find leads
	const leads = await prisma.lead.findMany({
		where: {
			title: {
				in: [
					'Roof Inspection',
					'Shingle Repair',
					'Full Re-roof',
					'Skylight Leak',
					'Gutter Replacement',
					'Flat Roof Repair',
					'Storm Damage',
					'Metal Roof Install'
				]
			}
		}
	});

	const leadMap = new Map(leads.map((l) => [l.title, l]));

	// Create jobs
	console.log('📝 Creating/updating jobs...');
	const jobsData = [
		{
			customer: 'john.doe@example.com',
			lead: 'Roof Inspection',
			title: 'Roof Inspection',
			description: 'Schedule inspection',
			status: 'scheduled',
			progress: 0,
			scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
			crewDetails: 'Crew A - 2 members'
		},
		{
			customer: 'emma.brown@example.com',
			lead: 'Shingle Repair',
			title: 'Shingle Repair',
			description: 'Repair missing shingles',
			status: 'in_progress',
			progress: 45,
			scheduledDate: new Date(),
			startDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000),
			crewDetails: 'Crew B - 3 members'
		},
		{
			customer: 'mike.taylor@example.com',
			lead: 'Full Re-roof',
			title: 'Full Re-roof',
			description: 'Complete replacement',
			status: 'completed',
			progress: 100,
			scheduledDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
			startDate: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
			endDate: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000),
			crewDetails: 'Crew C - 5 members'
		},
		{
			customer: 'sarah.johnson@example.com',
			lead: 'Skylight Leak',
			title: 'Skylight Leak Repair',
			description: 'Reseal skylight curb',
			status: 'scheduled',
			progress: 0,
			scheduledDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
			crewDetails: 'Crew A - 2 members'
		},
		{
			customer: 'robert.king@example.com',
			lead: 'Gutter Replacement',
			title: 'Gutter Replacement',
			description: 'Aluminum K-style gutters',
			status: 'scheduled',
			progress: 0,
			scheduledDate: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000),
			crewDetails: 'Crew B - 3 members'
		},
		{
			customer: 'sophia.martinez@example.com',
			lead: 'Flat Roof Repair',
			title: 'Flat Roof Repair',
			description: 'TPO patching and drains',
			status: 'in_progress',
			progress: 75,
			scheduledDate: new Date(Date.now() + 24 * 60 * 60 * 1000),
			startDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
			crewDetails: 'Crew D - 4 members'
		},
		{
			customer: 'daniel.lee@example.com',
			lead: 'Storm Damage',
			title: 'Storm Damage Repair',
			description: 'Shingle replacement under insurance',
			status: 'pending_payment',
			progress: 90,
			scheduledDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
			startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
			endDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
			crewDetails: 'Crew C - 5 members'
		},
		{
			customer: 'william.harris@example.com',
			lead: 'Metal Roof Install',
			title: 'Metal Roof Install',
			description: 'Standing seam roof',
			status: 'cancelled',
			progress: 0,
			scheduledDate: new Date(Date.now() - 24 * 60 * 60 * 1000),
			crewDetails: null
		}
	];

	const jobs = [];
	for (const jobData of jobsData) {
		const customer = customerMap.get(jobData.customer);
		const lead = leadMap.get(jobData.lead);
		if (!customer) {
			console.log(`⚠️  Customer ${jobData.customer} not found, skipping job`);
			continue;
		}

		// Check if job exists
		const existing = await prisma.job.findFirst({
			where: {
				title: jobData.title,
				customerId: customer.id
			}
		});

		const job = existing
			? await prisma.job.update({
					where: { id: existing.id },
					data: {
						description: jobData.description,
						status: jobData.status,
						progress: jobData.progress,
						scheduledDate: jobData.scheduledDate,
						startDate: jobData.startDate || null,
						endDate: jobData.endDate || null,
						crewDetails: jobData.crewDetails
					}
			  })
			: await prisma.job.create({
					data: {
						customerId: customer.id,
						leadId: lead?.id || null,
						title: jobData.title,
						description: jobData.description,
						status: jobData.status,
						progress: jobData.progress,
						scheduledDate: jobData.scheduledDate,
						startDate: jobData.startDate || null,
						endDate: jobData.endDate || null,
						crewDetails: jobData.crewDetails
					}
			  });
		jobs.push(job);
	}

	// Create estimates
	console.log('📊 Creating/updating estimates...');
	const estimates = [];
	const estimatesData = [
		{ job: 'Roof Inspection', totalAmount: 250.0, status: 'draft' },
		{ job: 'Shingle Repair', totalAmount: 1200.0, status: 'sent' },
		{ job: 'Full Re-roof', totalAmount: 9800.0, status: 'accepted' },
		{ job: 'Skylight Leak Repair', totalAmount: 450.0, status: 'draft' },
		{ job: 'Gutter Replacement', totalAmount: 2100.0, status: 'sent' },
		{ job: 'Flat Roof Repair', totalAmount: 5200.0, status: 'sent' },
		{ job: 'Storm Damage Repair', totalAmount: 6800.0, status: 'accepted' }
	];

	for (const estData of estimatesData) {
		const job = jobs.find((j) => j.title === estData.job);
		if (!job) continue;

		const existing = await prisma.estimate.findFirst({
			where: { jobId: job.id }
		});

		const estimate = existing
			? await prisma.estimate.update({
					where: { id: existing.id },
					data: {
						status: estData.status,
						totalAmount: estData.totalAmount
					}
			  })
			: await prisma.estimate.create({
					data: {
						customerId: job.customerId,
						jobId: job.id,
						leadId: job.leadId,
						status: estData.status,
						validUntil: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000),
						totalAmount: estData.totalAmount
					}
			  });
		estimates.push(estimate);
	}

	// Create invoices
	console.log('💰 Creating/updating invoices...');
	const invoicesData = [
		{
			customer: 'mike.taylor@example.com',
			job: 'Full Re-roof',
			invoiceNumber: 'INV-2024-001',
			subtotal: 9800.0,
			taxRate: 8.5,
			taxAmount: 833.0,
			totalAmount: 10633.0,
			status: 'sent',
			createdBy: owner
		},
		{
			customer: 'robert.king@example.com',
			job: 'Gutter Replacement',
			invoiceNumber: 'INV-2024-002',
			subtotal: 2100.0,
			taxRate: 8.5,
			taxAmount: 178.5,
			totalAmount: 2278.5,
			status: 'sent',
			createdBy: rep
		},
		{
			customer: 'daniel.lee@example.com',
			job: 'Storm Damage Repair',
			invoiceNumber: 'INV-2024-003',
			subtotal: 6800.0,
			taxRate: 8.5,
			taxAmount: 578.0,
			totalAmount: 7378.0,
			status: 'paid',
			createdBy: owner
		},
		{
			customer: 'emma.brown@example.com',
			job: 'Shingle Repair',
			invoiceNumber: 'INV-2024-004',
			subtotal: 1200.0,
			taxRate: 8.5,
			taxAmount: 102.0,
			totalAmount: 1302.0,
			status: 'draft',
			createdBy: rep
		}
	];

	for (const invData of invoicesData) {
		const customer = customerMap.get(invData.customer);
		const job = jobs.find((j) => j.title === invData.job);
		const estimate = estimates.find((e) => e.jobId === job?.id);

		if (!customer || !job) continue;

		const existing = await prisma.invoice.findFirst({
			where: { invoiceNumber: invData.invoiceNumber }
		});

		if (existing) {
			await prisma.invoice.update({
				where: { id: existing.id },
				data: {
					status: invData.status,
					totalAmount: invData.totalAmount,
					subtotal: invData.subtotal,
					taxRate: invData.taxRate,
					taxAmount: invData.taxAmount
				}
			});
		} else {
			await prisma.invoice.create({
				data: {
					customerId: customer.id,
					jobId: job.id,
					estimateId: estimate?.id || null,
					invoiceNumber: invData.invoiceNumber,
					status: invData.status,
					dueDate: new Date(Date.now() + 15 * 24 * 60 * 60 * 1000),
					subtotal: invData.subtotal,
					taxRate: invData.taxRate,
					taxAmount: invData.taxAmount,
					totalAmount: invData.totalAmount,
					createdById: invData.createdBy.id
				}
			});
		}
	}

	console.log('✅ Seeding completed!');
}

main()
	.catch((e) => {
		console.error('❌ Error seeding database:', e);
		process.exit(1);
	})
	.finally(async () => {
		await prisma.$disconnect();
	});

