import { prisma } from "$lib/server/prisma";
import type { Handle } from "@sveltejs/kit";

export const handle: Handle = async ({ event, resolve }) => {
	const sessionId = event.cookies.get('session');
	if (!sessionId) return resolve(event);

	const session = await prisma.session.findUnique({
		where: { id: sessionId },
		include: { user: true }
	});

	if (session && session.expiresAt > new Date()) {
		event.locals.user = {
			id: session.user.id,
			email: session.user.email,
			firstName: session.user.firstName,
			lastName: session.user.lastName,
			role: session.user.role as 'OWNER' | 'REP' | 'ESTIMATOR' | 'PM' | 'FOREMAN' | 'OFFICE' | 'CUSTOMER',
			contractorId: session.user.contractorId ?? null,
			customerId: session.user.customerId ?? null
		};
	} else if (session) {
		await prisma.session.delete({ where: { id: session.id } }).catch(() => {});
	}

	return resolve(event);
};
