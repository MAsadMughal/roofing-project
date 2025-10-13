import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const q = url.searchParams.get('q') ?? undefined;
	const limit = Number(url.searchParams.get('limit') ?? '50');
	const customers = await prisma.customer.findMany({
		where: q
			? {
				OR: [
					{ firstName: { contains: q, mode: 'insensitive' } },
					{ lastName: { contains: q, mode: 'insensitive' } },
					{ email: { contains: q, mode: 'insensitive' } }
				]
			}
			: undefined,
		orderBy: { createdAt: 'desc' },
		take: limit,
		select: {
			id: true,
			firstName: true,
			lastName: true,
			email: true,
			phone: true,
			city: true,
			state: true,
			postalCode: true,
			createdAt: true,
			updatedAt: true
		}
	});
	return json(customers);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.customer.create({
		data: {
			firstName: body.first_name,
			lastName: body.last_name,
			email: body.email,
			phone: body.phone,
			addressLine1: body.address_line1,
			addressLine2: body.address_line2,
			city: body.city,
			state: body.state,
			postalCode: body.postal_code
		}
	});
	return json(created, { status: 201 });
};


