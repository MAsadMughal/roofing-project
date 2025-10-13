import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;
	const estimates = await prisma.estimate.findMany({
		where: {
			status: status ?? undefined,
			customer: q ? { OR: [
				{ firstName: { contains: q, mode: 'insensitive' } },
				{ lastName: { contains: q, mode: 'insensitive' } }
			] } : undefined
		},
		include: { customer: { select: { firstName: true, lastName: true } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(estimates.map((e) => ({ ...e, first_name: e.customer.firstName, last_name: e.customer.lastName })));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const { customer_id, job_id, status, valid_until, items } = body;
	const created = await prisma.$transaction(async (tx) => {
		const estimate = await tx.estimate.create({
			data: {
				customerId: customer_id,
				jobId: job_id ?? null,
				status: status ?? 'draft',
				validUntil: valid_until ? new Date(valid_until) : null
			}
		});
		if (Array.isArray(items) && items.length > 0) {
			for (const item of items) {
				await tx.estimateItem.create({
					data: {
						estimateId: estimate.id,
						name: item.name,
						description: item.description ?? null,
						quantity: item.quantity,
						unitPrice: item.unit_price,
						total: item.total
					}
				});
			}
		}
		return estimate;
	});
	return json(created, { status: 201 });
};


