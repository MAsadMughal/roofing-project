import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { params } = event;
	const id = BigInt(params.id ?? '');
	const row = await prisma.lead.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { params, request } = event;
	const id = BigInt(params.id ?? '');
	const body = await request.json();
	const row = await prisma.lead.update({
		where: { id },
		data: {
			customerId: body.customer_id ?? undefined,
			title: body.title ?? undefined,
			description: body.description ?? undefined,
			status: body.status ?? undefined,
			source: body.source ?? undefined,
			updatedAt: new Date()
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { params } = event;
	const id = BigInt(params.id ?? '');
	await prisma.lead.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


