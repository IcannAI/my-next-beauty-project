import { prisma } from '@/infrastructure/db/prisma';

export async function getRefundRequest(id: string) {
  return prisma.refundRequest.findUnique({ where: { id } });
}
