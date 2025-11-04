import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';
import { requireAuth } from '$lib/server/auth';

function mapStatus(status: string): string {
	switch (status) {
		case 'draft': return 'Draft';
		case 'leading': return 'Leading';
		case 'saved': return 'Saved';
		case 'sent': return 'Sent';
		case 'viewed': return 'Viewed';
		case 'accepted': return 'Accepted';
		case 'rejected': return 'Declined';
		default: return status;
	}
}

export const load: PageServerLoad = async (event) => {
    requireAuth(event);
    const user = event.locals.user!;
    const { fetch, url } = event;
    const role = user?.role ?? null;
    const q = url.searchParams.get('q') ?? '';
    const status = url.searchParams.get('status') ?? '';
    
    let assignments: any[] = [];
    let estimates: any[] = [];

    if (role === 'ESTIMATOR') {
        const params = new URLSearchParams();
        if (q) params.set('q', q);
        if (status) params.set('status', status);
        const res = await fetch(`/api/estimator/assignments${params.toString() ? `?${params.toString()}` : ''}`);
        const out = await res.json().catch(() => ({ assignments: [] }));
        assignments = (res.ok ? (Array.isArray(out) ? out : out.assignments) : []) ?? [];
    } else if (role === 'REP') {
        // For REP, fetch assignments with estimates (similar to estimator)
        const repId = user.id as unknown as bigint;
        const assignmentsRaw = await prisma.assignment.findMany({
            where: { assignedToId: repId },
            orderBy: { createdAt: 'desc' },
            include: {
                lead: {
                    select: {
                        id: true,
                        title: true,
                        status: true,
                        customer: { select: { id: true, firstName: true, lastName: true } }
                    }
                },
                estimates: {
                    orderBy: { createdAt: 'desc' },
                    include: {
                        customer: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true
                            }
                        }
                    }
                }
            }
        });

        assignments = assignmentsRaw.map((a) => ({
            id: String(a.id),
            leadId: String(a.leadId),
            status: a.status,
            lead: a.lead ? {
                id: Number(a.lead.id),
                title: a.lead.title,
                status: a.lead.status,
                customer: a.lead.customer ? {
                    id: Number(a.lead.customer.id),
                    firstName: a.lead.customer.firstName,
                    lastName: a.lead.customer.lastName
                } : null
            } : null,
            estimates: a.estimates.map((e) => ({
                id: Number(e.id),
                status: mapStatus(e.status),
                createdAt: e.createdAt.toISOString(),
                totalAmount: Number(e.totalAmount ?? 0),
                details: e.details as any,
                notes: e.notes,
                customer: e.customer ? {
                    id: Number(e.customer.id),
                    firstName: e.customer.firstName,
                    lastName: e.customer.lastName
                } : null
            }))
        }));

        // Apply search filter if provided
        if (q) {
            const searchLower = q.toLowerCase();
            assignments = assignments.filter((a) => {
                const leadTitle = a.lead?.title?.toLowerCase() ?? '';
                const customerName = `${a.lead?.customer?.firstName ?? ''} ${a.lead?.customer?.lastName ?? ''}`.toLowerCase();
                return leadTitle.includes(searchLower) || customerName.includes(searchLower);
            });
        }
    } else if (role === 'OWNER') {
        // For owner, fetch all estimates with full assignment and lead details (including drafts)
        const ownerId = user.id as unknown as bigint;
        // Only filter by status if explicitly provided, otherwise show all (including drafts)
        const statusFilter = status && status !== 'All' ? status.toLowerCase() : undefined;
        const searchQuery = q ? q.toLowerCase().trim() : '';

        const estimatesRaw = await prisma.estimate.findMany({
            where: {
                assignment: { ownerId },
                ...(statusFilter ? { status: statusFilter } : {})
            },
            include: {
                customer: {
                    select: {
                        id: true,
                        firstName: true,
                        lastName: true,
                        email: true,
                        phone: true
                    }
                },
                assignment: {
                    include: {
                        lead: {
                            select: {
                                id: true,
                                title: true,
                                description: true,
                                status: true,
                                source: true
                            }
                        },
                        assignedTo: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        },
                        estimator: {
                            select: {
                                id: true,
                                firstName: true,
                                lastName: true,
                                email: true
                            }
                        }
                    }
                }
            },
            orderBy: { createdAt: 'desc' }
        });

        estimates = estimatesRaw
            .filter((e) => {
                if (!searchQuery) return true;
                const customerName = `${e.customer?.firstName ?? ''} ${e.customer?.lastName ?? ''}`.toLowerCase();
                const leadTitle = e.assignment?.lead?.title?.toLowerCase() ?? '';
                return customerName.includes(searchQuery) || leadTitle.includes(searchQuery);
            })
            .map((e) => ({
                id: Number(e.id),
                assignmentId: e.assignmentId ? Number(e.assignmentId) : null,
                leadId: e.leadId ? Number(e.leadId) : null,
                status: mapStatus(e.status),
                createdAt: e.createdAt.toISOString(),
                updatedAt: e.updatedAt.toISOString(),
                totalAmount: Number(e.totalAmount ?? 0),
                subtotal: Number(e.subtotal ?? 0),
                taxRate: Number(e.taxRate ?? 0),
                notes: e.notes,
                details: e.details as any,
                customer: e.customer ? {
                    id: Number(e.customer.id),
                    firstName: e.customer.firstName,
                    lastName: e.customer.lastName,
                    email: e.customer.email,
                    phone: e.customer.phone
                } : null,
                assignment: e.assignment ? {
                    id: Number(e.assignment.id),
                    leadId: Number(e.assignment.leadId),
                    status: e.assignment.status,
                    assignedTo: e.assignment.assignedTo ? {
                        id: Number(e.assignment.assignedTo.id),
                        firstName: e.assignment.assignedTo.firstName,
                        lastName: e.assignment.assignedTo.lastName,
                        email: e.assignment.assignedTo.email
                    } : null,
                    estimator: e.assignment.estimator ? {
                        id: Number(e.assignment.estimator.id),
                        firstName: e.assignment.estimator.firstName,
                        lastName: e.assignment.estimator.lastName,
                        email: e.assignment.estimator.email
                    } : null,
                    lead: e.assignment.lead ? {
                        id: Number(e.assignment.lead.id),
                        title: e.assignment.lead.title,
                        description: e.assignment.lead.description,
                        status: e.assignment.lead.status,
                        source: e.assignment.lead.source
                    } : null
                } : null
            }));
    }

    return { role, q, status, assignments, estimates };
};


