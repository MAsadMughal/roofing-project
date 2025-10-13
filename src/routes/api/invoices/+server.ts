import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	const rows = await prisma.invoice.findMany({
		where: { status: status ?? undefined },
		include: { customer: { select: { firstName: true, lastName: true } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(rows.map((i) => ({ ...i, first_name: i.customer.firstName, last_name: i.customer.lastName })));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.invoice.create({
		data: {
			customerId: body.customer_id,
			jobId: body.job_id ?? null,
			estimateId: body.estimate_id ?? null,
			status: body.status ?? 'draft',
			dueDate: body.due_date ? new Date(body.due_date) : null,
			totalAmount: body.total_amount
		}
	});
	return json(created, { status: 201 });
};


