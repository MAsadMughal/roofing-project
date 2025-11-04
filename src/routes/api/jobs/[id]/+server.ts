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
	
	const updateData: any = {};
	
	if (body.customer_id !== undefined) updateData.customerId = BigInt(body.customer_id);
	if (body.lead_id !== undefined) updateData.leadId = body.lead_id ? BigInt(body.lead_id) : null;
	if (body.assignment_id !== undefined) updateData.assignmentId = body.assignment_id ? BigInt(body.assignment_id) : null;
	if (body.title !== undefined) updateData.title = body.title;
	if (body.description !== undefined) updateData.description = body.description;
	if (body.status !== undefined) updateData.status = body.status;
	if (body.progress !== undefined) updateData.progress = Number(body.progress);
	if (body.scheduled_date !== undefined) updateData.scheduledDate = body.scheduled_date ? new Date(body.scheduled_date) : null;
	if (body.start_date !== undefined) updateData.startDate = body.start_date ? new Date(body.start_date) : null;
	if (body.end_date !== undefined) updateData.endDate = body.end_date ? new Date(body.end_date) : null;
	if (body.crew_details !== undefined) updateData.crewDetails = body.crew_details;
	
	const row = await prisma.job.update({
		where: { id },
		data: updateData
	});
	return json(row);
};

export const DELETE: RequestHandler = async ({ params }) => {
	const id = BigInt(params.id);
	await prisma.job.delete({ where: { id } });
	return new Response(null, { status: 204 });
};


