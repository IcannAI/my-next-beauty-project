import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function main() {
  const user = await prisma.user.findUnique({
    where: { email: 'kol@example.com' },
    include: { kolProfile: true }
  })

  if (!user) {
    console.error('KOL user not found (kol@example.com)')
    process.exit(1)
  }

  let kolProfile = user.kolProfile;
  if (!kolProfile) {
    console.log('Creating kolProfile for user...');
    kolProfile = await prisma.kolProfile.create({
      data: { userId: user.id },
    })
  }

  const products = [
    { name: "Shiseido Ultimune Power Infusing Concentrate 精華液", price: 2800, description: "強化肌膚防禦，OL維持好氣色" },
    { name: "SK-II Facial Treatment Essence 精華水", price: 3200, description: "經典保濕亮白，小資女主力保養" },
    { name: "Cle de Peau Radiant Fluid Foundation 粉底液", price: 3200, description: "自然光澤持久，OL上班不脫妝" },
    { name: "SUQQU Signature Color Eyes 眼影盤", price: 2500, description: "優雅色調快速專業妝，質感高" },
    { name: "LUNASOL Eye Coloration 眼影盤", price: 2200, description: "溫和大地色，OL日常百搭無技巧" },
    { name: "RMK Creamy Foundation EX 粉底霜", price: 1800, description: "滋潤遮瑕，適合乾燥辦公室" },
    { name: "Addiction The Eyeshadow 單色眼影", price: 1200, description: "多色層疊自然，小資女單買入門" },
    { name: "Ipsa Metabolizer 調理液", price: 2000, description: "客製保濕，對抗OL壓力肌" },
    { name: "Albion Excia Embeage Lotion 化妝水", price: 2800, description: "深層滋潤，忙碌女性簡易步驟" },
    { name: "Pola B.A Lotion 化妝水", price: 3000, description: "抗老保濕，小資女投資型" },
    { name: "Kanebo Dew Lotion 化妝水", price: 1800, description: "清爽不黏膩，OL夏季必備" },
    { name: "Kosé Sekkisei Lotion 化妝水", price: 1500, description: "美白提亮，日常膚色均勻" },
    { name: "MAQuillAGE Dramatic Powder UV 蜜粉", price: 1200, description: "控油定妝，OL補妝神器" },
    { name: "Fancl Mild Cleansing Oil 卸妝油", price: 1000, description: "溫和卸彩，小資女平價高端" },
    { name: "Excel Skinny Rich Shadow 眼影盤", price: 900, description: "四色快速OL妝，性價比高" },
    { name: "Kate Designing Eyebrow 3D 眉筆", price: 500, description: "三合一自然眉，專業形象" },
    { name: "Allie Extra UV Perfect Gel 防曬膠", price: 800, description: "防水防汗，OL通勤必備" },
    { name: "Decorté Loose Powder 散粉", price: 1800, description: "細緻定妝，維持霧光妝感" },
    { name: "&be Black Sponge 美妝蛋", price: 400, description: "均勻底妝，OL快速上妝" },
    { name: "Lululun Hydra-AZ Mask 面膜", price: 600, description: "補水放鬆，小資女週末保養" },
    { name: "DUO The Cleansing Balm 卸妝膏", price: 1200, description: "多效溫和卸妝，不傷肌" },
    { name: "Rosy Rosa Multi Foundation Puff 海綿撲", price: 300, description: "底妝輔助，OL完美肌" },
    { name: "Kanebo Suisai Beauty Clear Powder 酵素潔顏粉", price: 800, description: "深層清潔，適合油性OL" },
    { name: "Sensai Lash Volumiser 38°C 睫毛膏", price: 1500, description: "捲翹持久，自然放大眼睛" },
    { name: "Hada Labo Super Hydrator Lotion 化妝水", price: 600, description: "玻尿酸補水，小資基礎保養" },
    { name: "Shiseido Anessa Perfect UV Sunscreen 防曬乳", price: 900, description: "高防護，OL全年使用" },
    { name: "Shiseido Elixir Superior Day Care Revolution 日霜", price: 1800, description: "保濕防老，OL晨間簡易" },
    { name: "FAS The Black Day Cream 日霜", price: 1500, description: "多功能防護，忙碌女性" },
    { name: "Visee Glossy Rich Eyes 眼影", price: 700, description: "光澤眼妝，OL增添氣質" },
    { name: "Esprique Select Eye Color 眼影", price: 800, description: "單色易搭，小資擴充彩妝" },
    { name: "Integrate Air Feel Maker 妝前乳", price: 900, description: "毛孔隱形，OL底妝前置" },
    { name: "Sofina Primavista Long Keep Base 妝前乳", price: 1200, description: "持妝控油，辦公室一整天" },
    { name: "DHC Deep Cleansing Oil 卸妝油", price: 1000, description: "經典溫和，小資日常卸妝" },
    { name: "Orbis Clearful Lotion 化妝水", price: 900, description: "控痘保濕，年輕OL適合" },
    { name: "Three Dimensional Vision Eye Palette 眼影盤", price: 2200, description: "立體自然眼妝，專業感" },
    { name: "Cle de Peau Lipstick Cashmere 唇膏", price: 1800, description: "滋潤霧面，OL會議唇色" },
    { name: "SUQQU Extra Glow Lipstick 唇膏", price: 1800, description: "光澤唇妝，小資約會用" },
    { name: "LUNASOL Sheer Contrast Eyes 眼影盤", price: 2200, description: "清透色系，日常不誇張" },
    { name: "RMK Color Foundation 粉底", price: 1800, description: "輕薄自然，OL日常妝" },
    { name: "Addiction The Blush 腮紅", price: 1500, description: "細緻上色，增添好氣色" },
    { name: "Ipsa Creative Concealer 遮瑕膏", price: 1400, description: "多色調和，遮OL疲憊痕跡" },
    { name: "Albion Elegant Make Loose Powder 散粉", price: 2000, description: "高級定妝，持久不浮粉" },
    { name: "Pola Wrinkle Shot Serum 精華", price: 2800, description: "針對細紋，小資抗初老" },
    { name: "Kanebo Lissage Cream 面霜", price: 2200, description: "滋養修護，OL夜間保養" },
    { name: "Kosé Infinity Serum 精華", price: 2500, description: "緊緻肌膚，專業女性首選" },
    { name: "MAQuillAGE Dramatic Rouge 唇膏", price: 1200, description: "持久顯色，OL不掉色" },
    { name: "Fancl Washing Powder 潔顏粉", price: 800, description: "溫和潔面，小資旅行攜帶" },
    { name: "Shiseido Synchro Skin Self-Refreshing Foundation 粉底", price: 2200, description: "自適應持妝，動態OL生活" },
    { name: "SK-II Genifique Youth Activating Concentrate 精華", price: 3500, description: "激活年輕肌，投資型產品" },
    { name: "Decorté Rouge Decorte Cream Glow 唇膏", price: 1800, description: "奶油光澤，OL增添魅力" }
  ];

  const result = await prisma.product.createMany({
    data: products.map(p => ({
      ...p,
      kolProfileId: kolProfile!.id,
      stock: 100 // Default stock
    })),
    skipDuplicates: true
  });

  console.log(`Successfully seeded ${result.count} products for KOL kol@example.com`);
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
