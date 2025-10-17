import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params }) => {
    const token = params.token;
    const invite = await prisma.invite.findUnique({ where: { token } });
    const valid = Boolean(invite && !invite.acceptedAt && invite.expiresAt > new Date());
    return { token, valid, email: invite?.email ?? null, name: invite?.name ?? null };
};


