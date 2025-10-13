import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.invoice.findUnique({ where: { id }, include: { payments: true } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const row = await prisma.invoice.update({
		where: { id },
		data: {
			customerId: body.customer_id ?? undefined,
			jobId: body.job_id ?? undefined,
			estimateId: body.estimate_id ?? undefined,
			status: body.status ?? undefined,
			dueDate: body.due_date ? new Date(body.due_date) : undefined,
			totalAmount: body.total_amount ?? undefined,
			updatedAt: new Date()
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.invoice.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


