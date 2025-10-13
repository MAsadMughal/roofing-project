import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const estimate = await prisma.estimate.findUnique({
		where: { id },
		include: { items: true }
	});
	if (!estimate) return new Response('Not Found', { status: 404 });
	return json(estimate);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const updated = await prisma.$transaction(async (tx) => {
		const estimate = await tx.estimate.update({
			where: { id },
			data: {
				customerId: body.customer_id ?? undefined,
				jobId: body.job_id ?? undefined,
				status: body.status ?? undefined,
				validUntil: body.valid_until ? new Date(body.valid_until) : undefined,
				updatedAt: new Date()
			}
		});
		if (Array.isArray(body.items)) {
			await tx.estimateItem.deleteMany({ where: { estimateId: id } });
			for (const item of body.items) {
				await tx.estimateItem.create({
					data: {
						estimateId: id,
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
	return json(updated);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.estimate.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


