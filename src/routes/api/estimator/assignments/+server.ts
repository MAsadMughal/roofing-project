import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { requireAuth, requireRole } from '$lib/server/auth';

// GET: list assignments for current estimator with lead info
export const GET: RequestHandler = async (event) => {
  requireAuth(event);
  requireRole(event, 'ESTIMATOR');
  const estimatorId = event.locals.user!.id as unknown as bigint;

  const assignments = await prisma.assignment.findMany({
    where: { estimatorId },
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
        orderBy: { createdAt: 'desc' }
      }
    }
  });

  return json({ ok: true, assignments });
};


