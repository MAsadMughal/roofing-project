import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';

export const GET: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	const row = await prisma.proposal.findUnique({ where: { id } });
	if (!row) return new Response('Not Found', { status: 404 });
	return json(row);
};

export const PUT: RequestHandler = async ({ params, request }) => {
	const id = BigInt(params.id);
	const body = await request.json();
	const row = await prisma.proposal.update({
		where: { id },
		data: {
			estimateId: body.estimate_id ?? undefined,
			content: body.content ?? undefined,
			status: body.status ?? undefined,
			signedAt: body.signed_at ? new Date(body.signed_at) : undefined,
			updatedAt: new Date()
		}
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.proposal.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


