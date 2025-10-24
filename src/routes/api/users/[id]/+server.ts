import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth } from '$lib/server/auth';

export const GET: RequestHandler = async (event) => {
  requireAuth(event);

  const idParam = event.params.id;
  if (!idParam) {
    return json({ error: 'Missing id' }, { status: 400 });
  }

  let userId: bigint;
  try {
    userId = BigInt(idParam);
  } catch {
    return json({ error: 'Invalid id' }, { status: 400 });
  }

  const requester = event.locals.user;

  // Determine org scope: same contractor or the owner root id matching contractor root
  const contractorRootId = requester.contractorId ?? requester.id;

  const profile = await prisma.user.findFirst({
    where: {
      id: userId,
      OR: [
        { contractorId: contractorRootId as unknown as bigint },
        { id: contractorRootId as unknown as bigint }
      ]
    },
    select: {
      id: true,
      email: true,
      firstName: true,
      lastName: true,
      role: true,
      contractorId: true,
      customerId: true,
      createdAt: true,
      updatedAt: true
    }
  });

  if (!profile) {
    return json({ error: 'Not found' }, { status: 404 });
  }

  // Aggregate some activity metrics for UX (leads assigned, inspections, jobs involved)
  const [assignments] = await Promise.all([
    prisma.assignment.count({ where: { OR: [{ assignedToId: profile.id as unknown as bigint }, { ownerId: profile.id as unknown as bigint }] } })
  ]);

  return json({
    profile,
    metrics: {
      leadsAssigned: 0,
      inspectionsPerformed: 0,
      assignmentsInvolved: assignments
    }
  });
};


