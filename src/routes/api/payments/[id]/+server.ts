import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.payment.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const row = await prisma.payment.update({
		where: { id },
		data: {
			invoiceId: body.invoice_id ?? undefined,
			amount: body.amount ?? undefined,
			method: body.method ?? undefined,
			paidAt: body.paid_at ? new Date(body.paid_at) : undefined
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.payment.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


