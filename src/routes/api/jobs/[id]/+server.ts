import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.job.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const row = await prisma.job.update({
		where: { id },
		data: {
			customerId: body.customer_id ?? undefined,
			leadId: body.lead_id ?? undefined,
			title: body.title ?? undefined,
			description: body.description ?? undefined,
			status: body.status ?? undefined,
			scheduledDate: body.scheduled_date ? new Date(body.scheduled_date) : undefined,
			startDate: body.start_date ? new Date(body.start_date) : undefined,
			endDate: body.end_date ? new Date(body.end_date) : undefined,
			updatedAt: new Date()
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.job.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


