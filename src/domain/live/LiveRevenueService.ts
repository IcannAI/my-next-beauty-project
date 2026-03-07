export interface LiveStreamRevenueInput {
  liveStreamId?: string; // optional — pure calculation does not require an id
  totalRevenue: number;
  commissionRate: number; // e.g. 0.1 = 10%
}

export interface LiveStreamRevenueResult {
  kolEarnings: number;
  platformEarnings: number;
  commissionRate: number;
}

export class LiveRevenueService {
  calculate(input: LiveStreamRevenueInput): LiveStreamRevenueResult {
    if (input.totalRevenue < 0) {
      throw new Error('totalRevenue cannot be negative');
    }
    if (input.commissionRate < 0 || input.commissionRate > 1) {
      throw new Error('commissionRate must be between 0 and 1');
    }

    const kolEarnings = Math.round(input.totalRevenue * input.commissionRate * 100) / 100;
    const platformEarnings = Math.round((input.totalRevenue - kolEarnings) * 100) / 100;

    return { kolEarnings, platformEarnings, commissionRate: input.commissionRate };
  }
}