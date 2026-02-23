import OpenAI from 'openai';
import { RateLimiter } from 'limiter';

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

const limiter = new RateLimiter({ tokensPerInterval: 200, interval: 'minute' });

export async function generateEmbedding(text: string): Promise<number[]> {
  if (!text.trim()) return new Array(1536).fill(0);

  await limiter.removeTokens(1);

  try {
    const response = await openai.embeddings.create({
      model: 'text-embedding-3-small',
      input: text,
      dimensions: 1536,
    });
    return response.data[0].embedding;
  } catch (err: any) {
    if (err.status === 429 || err.code === 'rate_limit_exceeded') {
      console.warn('OpenAI rate limit 觸發，等待 60 秒後重試');
      await new Promise(r => setTimeout(r, 60000));
      return generateEmbedding(text);
    }
    console.error('Embedding 失敗：', err);
    return new Array(1536).fill(0);
  }
}

export async function generateEmbeddingsBatch(texts: string[]): Promise<number[][]> {
  if (texts.length === 0) return [];

  await limiter.removeTokens(texts.length);

  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: texts,
  });

  return response.data.map(d => d.embedding);
}
