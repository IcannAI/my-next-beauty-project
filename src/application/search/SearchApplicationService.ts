// src/application/search/SearchApplicationService.ts

import { prisma } from '@/infrastructure/db/prisma';
import { SearchService, SearchFilters } from '@/domain/search/SearchService';
import { logger } from '@/infrastructure/observability/logger';

const searchService = new SearchService();

export async function searchUsers(filters: SearchFilters) {
  const { query, take = 20 } = filters;
  if (!query.trim()) return { users: [], total: 0 };

  const startTime = Date.now();

  try {
    const where = searchService.buildUserWhereClause(query);

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        take,
        select: { id: true, name: true, email: true, role: true },
      }),
      prisma.user.count({ where }),
    ]);

    logger.info({ query, total, durationMs: Date.now() - startTime }, '搜尋完成');
    return { users, total };
  } catch (err) {
    logger.error({ query, err }, '搜尋失敗');
    throw err;
  }
}
