import "server-only";
import { PrismaClient } from "@prisma/client";

// Reused across invocations on a warm serverless container, in prod too: without
// this, every module load (which Vercel can trigger more than once per container)
// opens a fresh connection to a database on another continent.
const g = globalThis as unknown as { prisma?: PrismaClient };
export const prisma = g.prisma ?? new PrismaClient();
g.prisma = prisma;
