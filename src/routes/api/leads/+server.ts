import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { url } = event;
	const status = url.searchParams.get('status') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;
	const source = url.searchParams.get('source') ?? undefined;

	const leads = await prisma.lead.findMany({
		where: {
			status: status ?? undefined,
			source: source ?? undefined,
			OR: q
				? [
					{ title: { contains: q, mode: 'insensitive' } },
					{ description: { contains: q, mode: 'insensitive' } },
					{ customer: { is: { OR: [
						{ firstName: { contains: q, mode: 'insensitive' } },
						{ lastName: { contains: q, mode: 'insensitive' } }
					] } } }
				]
				: undefined
		},
		include: { customer: { select: { firstName: true, lastName: true, email: true, phone: true } } },
		orderBy: { createdAt: 'desc' },
		take: 100
	});
	return json(leads.map((l) => ({
		...l,
		first_name: l.customer?.firstName,
		last_name: l.customer?.lastName,
		email: l.customer?.email,
		phone: l.customer?.phone
	})));
};

export const POST: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { request } = event;
	const body = await request.json();
	const { customer_id, title, description, status, source } = body;
	const lead = await prisma.lead.create({
		data: {
			customerId: customer_id != null ? BigInt(customer_id) : null,
			title,
			description: description ?? null,
			status: status ?? undefined,
			source: source ?? undefined
		}
	});
	return json(lead, { status: 201 });
};


