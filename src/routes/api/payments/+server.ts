import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ url }) => {
	const invoice_id = url.searchParams.get('invoice_id');
	const rows = await prisma.payment.findMany({
		where: invoice_id ? { invoiceId: BigInt(invoice_id) } : undefined,
		orderBy: { paidAt: 'desc' },
		take: 200
	});
	return json(rows);
};

export const POST: RequestHandler = async ({ request }) => {
	const body = await request.json();
	const created = await prisma.payment.create({
		data: {
			invoiceId: body.invoice_id,
			amount: body.amount,
			method: body.method ?? null,
			paidAt: body.paid_at ? new Date(body.paid_at) : undefined
		}
	});
	return json(created, { status: 201 });
};


