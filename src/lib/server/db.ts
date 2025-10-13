import { prisma } from './prisma';

export async function pingDatabase(): Promise<boolean> {
    try {
        await prisma.$queryRaw`select 1`;
        return true;
    } catch {
        return false;
    }
}


