import { json } from '@sveltejs/kit';
import { prisma } from '$lib/server/prisma';

export async function GET() {
	try {
		await prisma.$connect();
		return json({ status: 'connected', env: { hasDbUrl: !!process.env.DATABASE_URL } });
	} catch (error) {
		return json({ 
			status: 'error', 
			error: error instanceof Error ? error.message : 'Unknown error',
			env: { hasDbUrl: !!process.env.DATABASE_URL }
		}, { status: 500 });
	}
}
