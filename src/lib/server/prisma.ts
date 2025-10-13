import pkg from '@prisma/client';
import type { PrismaClient as PrismaClientType } from '@prisma/client';
const { PrismaClient } = pkg;

const globalForPrisma = globalThis as unknown as { prisma?: PrismaClientType };

export const prisma =
	globalForPrisma.prisma ??
	new PrismaClient({
		log: ['error']
	});

if (!globalForPrisma.prisma) {
	globalForPrisma.prisma = prisma;
}


