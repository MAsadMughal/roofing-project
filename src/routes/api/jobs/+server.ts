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
		include: { customer: { select: { firstName: true, lastName: true } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(jobs.map((j) => ({ ...j, first_name: j.customer.firstName, last_name: j.customer.lastName })));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.job.create({
		data: {
			customerId: body.customer_id,
            leadId: body.lead_id ?? null,
            assignmentId: body.assignment_id ?? null,
			title: body.title,
			description: body.description ?? null,
			status: body.status ?? 'scheduled',
			scheduledDate: body.scheduled_date ? new Date(body.scheduled_date) : null,
			startDate: body.start_date ? new Date(body.start_date) : null,
			endDate: body.end_date ? new Date(body.end_date) : null
		}
	});
    if (body.assignment_id) {
        await prisma.assignment.update({
            where: { id: BigInt(body.assignment_id) },
            data: { latestJobId: created.id as unknown as bigint, lastStatusChangedAt: new Date(), status: 'job_created' }
        }).catch(() => null);
    }
    return json(created, { status: 201 });
};


