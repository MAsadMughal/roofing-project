import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.customer.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const row = await prisma.customer.update({
		where: { id },
		data: {
			firstName: body.first_name ?? undefined,
			lastName: body.last_name ?? undefined,
			email: body.email ?? undefined,
			phone: body.phone ?? undefined,
			addressLine1: body.address_line1 ?? undefined,
			addressLine2: body.address_line2 ?? undefined,
			city: body.city ?? undefined,
			state: body.state ?? undefined,
			postalCode: body.postal_code ?? undefined,
			updatedAt: new Date()
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.customer.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


