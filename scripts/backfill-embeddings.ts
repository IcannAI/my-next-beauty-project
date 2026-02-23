import { prisma } from '../lib/prisma';
import { generateEmbedding } from '../lib/embeddings';
import fetch from 'node-fetch';
import { performance } from 'perf_hooks';

const DATADOG_API_KEY = process.env.DATADOG_API_KEY;
const DATADOG_SITE = 'datadoghq.com';

async function sendDatadogEvent(title: string, text: string, tags: string[] = []) {
  if (!DATADOG_API_KEY) {
    console.warn('DATADOG_API_KEY 未設定，跳過事件上報');
    return;
  }

  const payload = {
    title,
    text,
    tags: [
      'project:beauty-social-commerce',
      'task:vector-backfill',
      `env:${process.env.NODE_ENV || 'development'}`,
      ...tags,
    ],
    alert_type: title.includes('失敗') ? 'error' : 'success',
  };

  try {
    const res = await fetch(`https://api.${DATADOG_SITE}/api/v1/events`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'DD-API-KEY': DATADOG_API_KEY,
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      console.error(`Datadog 事件上報失敗：${res.status} ${await res.text()}`);
    } else {
      console.log(`Datadog 事件已上報：${title}`);
    }
  } catch (err) {
    console.error('無法連線到 Datadog 事件 API', err);
  }
}

async function backfillModel<T>(
  modelName: string,
  findMany: (skip: number, take: number) => Promise<T[]>,
  update: (id: string, embedding: number[]) => Promise<void>,
  getText: (record: T) => string,
  batchSize = 50
) {
  const startTime = performance.now();
  console.log(`開始回填 ${modelName}...`);

  let skip = 0;
  let processed = 0;
  let failed = 0;

  while (true) {
    const batchStart = performance.now();

    const records = await findMany(skip, batchSize);
    if (records.length === 0) break;

    for (const record of records) {
      const id = (record as any).id;
      const text = getText(record);

      if (!text || text.trim().length < 10) continue;

      try {
        const embedding = await generateEmbedding(text);
        await update(id, embedding);
        processed++;
      } catch (err) {
        failed++;
        console.error(`回填 ${modelName} ${id} 失敗：`, err);
      }
    }

    const batchDuration = ((performance.now() - batchStart) / 1000).toFixed(2);
    console.log(`批次完成：${records.length} 筆，耗時 ${batchDuration}s`);

    skip += batchSize;
    await new Promise(r => setTimeout(r, 1000));
  }

  const totalDuration = ((performance.now() - startTime) / 1000).toFixed(2);
  const status = failed === 0 ? '成功' : '部分失敗';

  await sendDatadogEvent(
    `${modelName} 向量回填 ${status}`,
    `模型：${modelName}\n處理筆數：${processed + failed}\n成功：${processed}\n失敗：${failed}\n總耗時：${totalDuration} 秒`,
    [`model:${modelName}`, `status:${status.toLowerCase()}`, `duration:${totalDuration}`]
  );

  console.log(`=== ${modelName} 回填完成 === 總計 ${processed + failed} 筆，成功 ${processed}，失敗 ${failed}，耗時 ${totalDuration}s`);
}

async function main() {
  const overallStart = performance.now();

  await backfillModel(
    'User',
    (skip, take) => prisma.user.findMany({
      where: { embedding: null },
      skip,
      take,
      include: { kolProfile: { select: { bio: true } } },
    }),
    (id, embedding) => prisma.user.update({
      where: { id },
      data: { embedding },
    }),
    (u) => [u.name, u.kolProfile?.bio].filter(Boolean).join(' ').trim()
  );

  await backfillModel(
    'Product',
    (skip, take) => prisma.product.findMany({
      where: { embedding: null },
      skip,
      take,
    }),
    (id, embedding) => prisma.product.update({
      where: { id },
      data: { embedding },
    }),
    (p) => [p.name, p.description].filter(Boolean).join(' ').trim()
  );

  await backfillModel(
    'LiveStream',
    (skip, take) => prisma.liveStream.findMany({
      where: { embedding: null },
      skip,
      take,
    }),
    (id, embedding) => prisma.liveStream.update({
      where: { id },
      data: { embedding },
    }),
    (l) => [l.title, l.description].filter(Boolean).join(' ').trim()
  );

  await backfillModel(
    'Article',
    (skip, take) => prisma.article.findMany({
      where: { embedding: null },
      skip,
      take,
    }),
    (id, embedding) => prisma.article.update({
      where: { id },
      data: { embedding },
    }),
    (a) => [a.title, a.content, a.summary].filter(Boolean).join(' ').trim()
  );

  const overallDuration = ((performance.now() - overallStart) / 1000).toFixed(2);

  await sendDatadogEvent(
    '全量向量回填完成',
    `所有模型回填完成\n總耗時：${overallDuration} 秒`,
    ['task:vector-backfill-complete', `duration:${overallDuration}`]
  );

  console.log('全量回填全部完成！');
  process.exit(0);
}

main().catch(err => {
  console.error('回填腳本異常終止：', err);
  sendDatadogEvent(
    '向量回填腳本失敗',
    `錯誤：${err.message}\n堆疊：${err.stack?.slice(0, 500)}`,
    ['status:failure']
  ).finally(() => process.exit(1));
});
