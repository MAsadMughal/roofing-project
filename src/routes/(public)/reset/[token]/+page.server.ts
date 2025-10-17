import type { PageServerLoad } from './$types';
import { prisma } from '$lib/server/prisma';

export const load: PageServerLoad = async ({ params }) => {
    const token = params.token;
    const reset = await prisma.passwordReset.findUnique({ where: { token } });
    const valid = Boolean(reset && !reset.usedAt && reset.expiresAt > new Date());
    return { token, valid };
};


