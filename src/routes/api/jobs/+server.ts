import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;
	const dateFrom = url.searchParams.get('dateFrom') ?? undefined;
	const dateTo = url.searchParams.get('dateTo') ?? undefined;

	const jobs = await prisma.job.findMany({
		where: {
			status: status ?? undefined,
			AND: [
				dateFrom ? { OR: [
					{ scheduledDate: { gte: new Date(dateFrom) } },
					{ startDate: { gte: new Date(dateFrom) } }
				] } : {},
				dateTo ? { OR: [
					{ scheduledDate: { lte: new Date(dateTo) } },
					{ startDate: { lte: new Date(dateTo) } }
				] } : {},
				q ? { OR: [
					{ title: { contains: q, mode: 'insensitive' } },
					{ description: { contains: q, mode: 'insensitive' } },
					{ customer: { is: { OR: [
						{ firstName: { contains: q, mode: 'insensitive' } },
						{ lastName: { contains: q, mode: 'insensitive' } }
					] } } }
				] } : {}
			]
		},
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

	return json(
		jobs.map((j) => {
			const totalAmount = j.invoices?.reduce((sum, inv) => sum + Number(inv.totalAmount || 0), 0) || 0;
			const address = [
				j.customer.addressLine1,
				j.customer.addressLine2,
				j.customer.city,
				j.customer.state,
				j.customer.postalCode
			]
				.filter(Boolean)
				.join(', ');

			return {
				id: String(j.id),
				customer_id: String(j.customerId),
				lead_id: j.leadId ? String(j.leadId) : null,
				assignment_id: j.assignmentId ? String(j.assignmentId) : null,
				title: j.title,
				description: j.description,
				status: j.status,
				progress: j.progress || 0,
				scheduled_date: j.scheduledDate?.toISOString() || null,
				start_date: j.startDate?.toISOString() || null,
				end_date: j.endDate?.toISOString() || null,
				crew_details: j.crewDetails,
				created_at: j.createdAt.toISOString(),
				updated_at: j.updatedAt.toISOString(),
				first_name: j.customer.firstName,
				last_name: j.customer.lastName,
				customer_email: j.customer.email,
				customer_phone: j.customer.phone,
				customer_address: address,
				total_amount: totalAmount
			};
		})
	);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.job.create({
		data: {
			customerId: BigInt(body.customer_id),
			leadId: body.lead_id ? BigInt(body.lead_id) : null,
			assignmentId: body.assignment_id ? BigInt(body.assignment_id) : null,
			title: body.title,
			description: body.description ?? null,
			status: body.status ?? 'scheduled',
			progress: body.progress ?? 0,
			scheduledDate: body.scheduled_date ? new Date(body.scheduled_date) : null,
			startDate: body.start_date ? new Date(body.start_date) : null,
			endDate: body.end_date ? new Date(body.end_date) : null,
			crewDetails: body.crew_details ?? null
		}
	});
	if (body.assignment_id) {
		await prisma.assignment
			.update({
				where: { id: BigInt(body.assignment_id) },
				data: {
					latestJobId: created.id,
					lastStatusChangedAt: new Date(),
					status: 'job_created'
				}
			})
			.catch(() => null);
	}
	return json(created, { status: 201 });
};


