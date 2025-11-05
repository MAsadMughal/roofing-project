import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
    requireAuth(event);
    const { url } = event;
	const status = url.searchParams.get('status') ?? undefined;
	const q = url.searchParams.get('q') ?? undefined;
	const source = url.searchParams.get('source') ?? undefined;
    const unassigned = url.searchParams.get('unassigned') === 'true';
    const userId = event.locals.user!.id as unknown as bigint;
    const user = await prisma.user.findUnique({ where: { id: userId } });
    const ownerContractorId = (user?.contractorId ?? user?.id) as unknown as bigint;

    const isRep = (event.locals.user?.role === 'REP');
    const whereBase: any = {
        status: status ?? undefined,
        source: source ?? undefined,
        OR: q
            ? [
                { title: { contains: q, mode: 'insensitive' } },
                { description: { contains: q, mode: 'insensitive' } },
                { customer: { is: { OR: [
                    { firstName: { contains: q, mode: 'insensitive' } },
                    { lastName: { contains: q, mode: 'insensitive' } }
                ] } } }
            ]
            : undefined
    };

    if (unassigned) {
        whereBase.assignments = { none: {} };
    }

    const leads = await prisma.lead.findMany({
        where: isRep ? { ...whereBase, assignments: { some: { assignedToId: userId } } } : whereBase,
        include: {
            customer: { select: { firstName: true, lastName: true, email: true, phone: true } },
            // For reps: include their latest assignment
            // For owners: include latest assignment created by them (to compute assigned flag)
            assignments: isRep
                ? { where: { assignedToId: userId }, orderBy: { assignedAt: 'desc' }, take: 1, select: { id: true, status: true, assignedAt: true, history: true } }
                : {
                    where: {
                        OR: [
                            { ownerId: ownerContractorId },
                            { owner: { contractorId: ownerContractorId } }
                        ]
                    },
                    orderBy: { assignedAt: 'desc' },
                    take: 1,
                    include: { assignedTo: { select: { id: true, firstName: true, lastName: true, email: true } } }
                }
        },
        orderBy: { createdAt: 'desc' },
        take: 100
    });
    return json(leads.map((l: any) => {
        const viewerAssignment = Array.isArray(l.assignments) && l.assignments.length > 0 ? l.assignments[0] : null;
        const assigned = !isRep && viewerAssignment != null; // owner perspective
        // Build assigned_to metadata for owners
        const assignedToMeta = viewerAssignment?.assignedTo
            ? {
                id: viewerAssignment.assignedTo.id,
                first_name: viewerAssignment.assignedTo.firstName,
                last_name: viewerAssignment.assignedTo.lastName,
                email: viewerAssignment.assignedTo.email
            }
            : null;

        return {
            ...l,
            first_name: l.customer?.firstName,
            last_name: l.customer?.lastName,
            email: l.customer?.email,
            phone: l.customer?.phone,
            viewer_assignment: isRep ? viewerAssignment : null,
            assigned: assigned,
            assigned_to: assignedToMeta,
            watchlisted: ((user as any)?.watchlistLeadIds ?? []).includes(l.id),
            history: assigned ? viewerAssignment?.history : null
        };
    }));
};

export const POST: RequestHandler = async (event) => {
    requireRole(event, 'OWNER');
    const { request } = event;
	const body = await request.json();
	const { customer_id, title, description, status, source, first_name, last_name, email, phone } = body;
	
	let customerId: bigint | null = null;
	
	// If customer data provided, create or find customer
	if (first_name && last_name) {
		if (email) {
			// Try to find existing customer by email, otherwise create
			const existing = await prisma.customer.findUnique({ where: { email } });
			if (existing) {
				customerId = existing.id;
				// Update existing customer
				await prisma.customer.update({
					where: { id: customerId },
					data: {
						firstName: first_name,
						lastName: last_name,
						...(phone && { phone })
					}
				});
			} else {
				const customer = await prisma.customer.create({
					data: {
						firstName: first_name,
						lastName: last_name,
						email,
						...(phone && { phone })
					}
				});
				customerId = customer.id;
			}
		} else {
			// No email, just create new customer
			const customer = await prisma.customer.create({
				data: {
					firstName: first_name,
					lastName: last_name,
					...(phone && { phone })
				}
			});
			customerId = customer.id;
		}
	} else if (customer_id != null) {
		customerId = BigInt(customer_id);
	}
	
	const lead = await prisma.lead.create({
		data: {
			customerId,
			title,
			description: description ?? null,
			status: status ?? undefined,
			source: source ?? undefined
		}
	});
	return json(lead, { status: 201 });
};
