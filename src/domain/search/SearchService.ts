// src/domain/search/SearchService.ts

export interface SearchFilters {
  query: string;
  type?: 'user' | 'product' | 'all';
  take?: number;
}

export interface SearchResultItem {
  id: string;
  type: 'user' | 'product';
  name: string;
  relevanceScore?: number;
}

export class SearchService {
  buildUserWhereClause(query: string) {
    return {
      OR: [
        { name: { contains: query, mode: 'insensitive' as const } },
        { kolProfile: { bio: { contains: query, mode: 'insensitive' as const } } },
      ],
    };
  }
}
