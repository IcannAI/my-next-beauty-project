import { prisma } from '../lib/prisma';

const MODELS = ['User', 'Product', 'LiveStream', 'Article'];

async function checkEmbeddingQuality() {
  for (const model of MODELS) {
    console.log(`檢查 ${model} 向量品質...`);

    const sample = await prisma.$queryRaw`
      SELECT id, embedding
      FROM "${Prisma.raw(model)}"
      WHERE embedding IS NOT NULL
      ORDER BY RANDOM()
      LIMIT 1000
    `;

    let validCount = 0;
    let totalLength = 0;

    for (const row of sample) {
      const emb = row.embedding as number[];
      if (emb?.length === 1536) {
        validCount++;
        totalLength += emb.length;
      } else {
        console.warn(`異常 embedding 長度：${emb?.length || 'null'} (id: ${row.id})`);
      }
    }

    console.log(`  - 總記錄數：${sample.length}`);
    console.log(`  - 有效向量數：${validCount} (${((validCount / sample.length) * 100).toFixed(2)}%)`);
    console.log(`  - 平均長度：${validCount > 0 ? (totalLength / validCount).toFixed(0) : 'N/A'}`);
  }

  console.log('向量品質檢查完成！');
}

checkEmbeddingQuality().catch(err => {
  console.error('品質檢查失敗：', err);
  process.exit(1);
});
