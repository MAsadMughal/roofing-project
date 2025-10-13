import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const status = url.searchParams.get('status') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;
	const rows = await prisma.proposal.findMany({
		where: {
			status: status ?? undefined,
			estimate: q ? { customer: { OR: [
				{ firstName: { contains: q, mode: 'insensitive' } },
				{ lastName: { contains: q, mode: 'insensitive' } }
			] } } : undefined
		},
		include: { estimate: { select: { totalAmount: true, customer: { select: { firstName: true, lastName: true } } } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(rows.map((p) => ({
		...p,
		total_amount: p.estimate?.totalAmount,
		first_name: p.estimate?.customer.firstName,
		last_name: p.estimate?.customer.lastName
	})));
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.proposal.create({
		data: {
			estimateId: body.estimate_id,
			content: body.content ?? null,
			status: body.status ?? 'draft'
		}
	});
	return json(created, { status: 201 });
};


