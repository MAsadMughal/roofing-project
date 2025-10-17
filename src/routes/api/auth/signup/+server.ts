import type { RequestHandler } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';
import { json } from '$lib/server/json';
import { pbkdf2Sync, randomUUID } from 'node:crypto';

function hashPassword(password: string): string {
    return pbkdf2Sync(password, process.env.PBKDF2_SALT || 'changeme', 310000, 32, 'sha256').toString('hex');
}

export const POST: RequestHandler = async ({ request, cookies }) => {
    const body = await request.json();
    const { email, password, firstName, lastName, role } = body ?? {};

    if (!email || !password) return json({ error: 'email and password required' }, { status: 400 });

    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) return json({ error: 'email already registered' }, { status: 409 });

    // Only allow open signup for OWNER or CUSTOMER; others must use invite
    const roleValue = role ?? 'OWNER';
    if (roleValue !== 'OWNER' && roleValue !== 'CUSTOMER') {
        return json({ error: 'This role requires an invite' }, { status: 400 });
    }

    let customerId: bigint | undefined;
    if (roleValue === 'CUSTOMER') {
        // Link to existing customer by email or create a new one
        const customer = await prisma.customer.upsert({
            where: { email },
            update: {
                firstName: firstName ?? undefined,
                lastName: lastName ?? undefined
            },
            create: {
                email,
                firstName: firstName ?? 'Customer',
                lastName: lastName ?? ''
            }
        });
        customerId = customer.id;
    }

    const user = await prisma.user.create({
        data: {
            email,
            passwordHash: hashPassword(password),
            firstName: firstName ?? null,
            lastName: lastName ?? null,
            role: roleValue,
            customerId
        }
    });

    // create session
    const sessionId = randomUUID();
    const expiresAt = new Date(Date.now() + 1000 * 60 * 60 * 24 * 7); // 7 days
    await prisma.session.create({ data: { id: sessionId, userId: user.id, expiresAt } });

    cookies.set('session', sessionId, {
        path: '/',
        httpOnly: true,
        sameSite: 'lax',
        secure: process.env.NODE_ENV === 'production',
        maxAge: 60 * 60 * 24 * 7
    });

    return json({ id: user.id, email: user.email, firstName: user.firstName, lastName: user.lastName, role: user.role, customerId: user.customerId ?? null }, { status: 201 });
};


