import { PrismaClient, UserRole, PhotoKind, Gender } from '@prisma/client';
import * as bcrypt from 'bcrypt';

const prisma = new PrismaClient();

const LOCATIONS = [
  { lat: 25.0260, lng: 121.5430, city: '大安區' },
  { lat: 25.0330, lng: 121.5654, city: '信義區' },
  { lat: 25.0630, lng: 121.5240, city: '中山區' },
  { lat: 25.0920, lng: 121.5250, city: '士林區' },
  { lat: 24.9920, lng: 121.5700, city: '文山區' },
  { lat: 25.0800, lng: 121.5870, city: '內湖區' },
  { lat: 25.0530, lng: 121.5770, city: '松山區' },
  { lat: 25.0440, lng: 121.5130, city: '中正區' },
  { lat: 25.0350, lng: 121.4990, city: '萬華區' },
  { lat: 25.0720, lng: 121.5010, city: '北投區' },
  { lat: 25.0550, lng: 121.6100, city: '南港區' },
  { lat: 25.0480, lng: 121.5600, city: '中山區' },
  { lat: 25.0380, lng: 121.5460, city: '大安區' },
  { lat: 25.0150, lng: 121.5300, city: '中正區' },
  { lat: 25.0690, lng: 121.5580, city: '松山區' },
];

const FEMALE_AVATARS = [
  'https://images.unsplash.com/photo-1529693529563-1de3d68e6188?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1488426862026-3ee34a7d66df?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1524504388940-b1c1722653e3?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1534528741775-53994a69daeb?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1489424731084-a5d8b219a5bb?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1508214751196-bcfd4ca60f91?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1531746020798-e6953c6e8e04?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1517841905240-472988babdf9?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1520813792240-56fc4a3765a7?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1521146764736-56c929d59c83?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1502823403499-6ccfcf4fb453?w=600&h=800&fit=crop&crop=faces',
];

const MALE_AVATARS = [
  'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1519085360753-af0119f7cbe7?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1531427186611-ecfd6d936c79?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1463453091185-61582044d556?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1545996124-0501ebae84d0?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1491528323818-fdd1faba62cc?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1548142813-c348350df52b?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1499996860823-5214fcc65f8f?w=600&h=800&fit=crop&crop=faces',
  'https://images.unsplash.com/photo-1492562080023-ab3db95bfbce?w=600&h=800&fit=crop&crop=faces',
];

const DOG_PHOTOS = [
  'https://images.unsplash.com/photo-1583512603806-077998240c7a?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1552053831-71594a27632d?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1587300003388-59208cc962cb?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1601979031925-424e53b6caaa?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1503256207526-0d5523284ff6?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1494947665470-20322015e3a8?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1547407139-3c921a66005c?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1605568427561-40dd23c2acea?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1588943211346-0908a1fb0b01?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1536043385234-2f5e97a12e85?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1543466835-00a7907e9de1?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1517849845537-4d257902454a?w=600&h=800&fit=crop',
];

const CAT_PHOTOS = [
  'https://images.unsplash.com/photo-1514888286974-6c03e2ca1dba?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1571566882372-1598d88abd90?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1598935898639-81586f7d2129?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1596854407944-bf87f6fdd49e?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1561948955-570b270e7c36?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1533743983669-94fa5c4338ec?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1548802673-380ab8ebc7b7?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=600&h=800&fit=crop',
  'https://images.unsplash.com/photo-1574158622682-e40e69881006?w=600&h=800&fit=crop',
];

async function setLocation(userId: string, lat: number, lng: number) {
  await prisma.$executeRaw`
    UPDATE "User"
    SET location = ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
    WHERE id = ${userId}
  `;
}

// ── Raw data ──────────────────────────────────────────────────────────────────
// Format: [email, displayName, gender(F/M), bio, interests[], jobTitle, height, zodiac, education, avatarIdx, balance, locIdx]
// Pets (OWNER only): [petName, breed, petBio, tags[], photoType('dog'|'cat'), photoIdx]

const OWNERS_RAW: Array<{
  email: string; displayName: string; gender: Gender;
  bio: string; interests: string[]; jobTitle: string;
  height: number; zodiac: string; education: string;
  avatarIdx: number; balance: number; locIdx: number;
  pet: { name: string; breed: string; bio: string; tags: string[]; type: 'dog' | 'cat' | 'other'; photoIdx: number };
}> = [
  {
    email: 'wei.lin@test.com', displayName: '林小薇', gender: Gender.FEMALE,
    bio: '柴犬媽媽一枚，每天被 Mochi 治癒 ☀️ 喜歡週末去公園曬太陽、手沖咖啡、追韓劇。找個也愛狗的你一起遛毛孩！',
    interests: ['遛狗', '咖啡', '韓劇', '瑜伽', '手作'], jobTitle: '行銷企劃',
    height: 163, zodiac: '天秤座', education: '大學', avatarIdx: 0, balance: 100, locIdx: 0,
    pet: { name: 'Mochi', breed: '柴犬 · 2 歲', bio: '喜歡在公園曬太陽，跟誰都能五分鐘內變熟人。最愛被摸耳朵。', tags: ['活潑', '友善', '訓練良好', '愛散步'], type: 'dog', photoIdx: 0 },
  },
  {
    email: 'weiting.chen@test.com', displayName: '陳威廷', gender: Gender.MALE,
    bio: '軟體工程師，貓奴三年。Luna 是我老大，我只是幫她付帳單的工具人 😂 下班後煮飯、看書、偶爾打電動。',
    interests: ['貓咪', '程式', '烹飪', '閱讀', '電玩'], jobTitle: '軟體工程師',
    height: 178, zodiac: '雙子座', education: '碩士', avatarIdx: 0, balance: 50, locIdx: 1,
    pet: { name: 'Luna', breed: '波斯貓 · 3 歲', bio: '高冷外表下藏著熱情的心。只要給零食馬上變世界最甜的貓。', tags: ['高冷', '獨立', '偶爾撒嬌', '愛睡覺'], type: 'cat', photoIdx: 0 },
  },
  {
    email: 'yijia.wang@test.com', displayName: '王佳穎', gender: Gender.FEMALE,
    bio: 'UI 設計師 🎨 有一隻垂耳兔叫可可，比我還傲嬌。喜歡逛展覽、拍照、找好吃的早午餐。',
    interests: ['設計', '攝影', '藝術展覽', '早午餐', '兔兔'], jobTitle: 'UI/UX 設計師',
    height: 160, zodiac: '雙魚座', education: '大學', avatarIdx: 1, balance: 200, locIdx: 2,
    pet: { name: '可可', breed: '垂耳兔 · 1 歲', bio: '全台北最傲嬌的兔子，但其實超愛撒嬌。最喜歡被摸耳朵和吃蘋果。', tags: ['傲嬌', '可愛', '安靜', '愛吃'], type: 'other', photoIdx: 0 },
  },
  {
    email: 'ming.chang@test.com', displayName: '張明宏', gender: Gender.MALE,
    bio: '自己創業賣咖啡豆，養了一隻叫 Koda 的黃金獵犬，兩件事都讓我每天累到爆 😅 週末喜歡騎車去陽明山。',
    interests: ['咖啡', '創業', '騎車', '登山', '狗狗'], jobTitle: '創業家',
    height: 182, zodiac: '獅子座', education: '大學', avatarIdx: 1, balance: 300, locIdx: 3,
    pet: { name: 'Koda', breed: '黃金獵犬 · 4 歲', bio: '天生好朋友！愛游泳愛追球，任何地點都能玩出一百種花樣。', tags: ['外向', '親人', '愛運動', '適合遛狗'], type: 'dog', photoIdx: 1 },
  },
  {
    email: 'yating.li@test.com', displayName: '李雅婷', gender: Gender.FEMALE,
    bio: '國小老師，下課後的快樂是我的英短胖虎。喜歡做烘焙、讀繪本、週末去市集。生活小確幸收集中～',
    interests: ['烘焙', '貓咪', '閱讀', '市集', '園藝'], jobTitle: '小學老師',
    height: 157, zodiac: '巨蟹座', education: '大學', avatarIdx: 2, balance: 80, locIdx: 4,
    pet: { name: '胖虎', breed: '英國短毛貓 · 5 歲', bio: '名字叫胖虎但性格溫和，喜歡窩在陽台曬太陽、盯鳥看。', tags: ['溫和', '愛曬太陽', '慵懶', '安靜'], type: 'cat', photoIdx: 2 },
  },
  {
    email: 'jguo.wu@test.com', displayName: '吳建國', gender: Gender.MALE,
    bio: '急診科醫師，壓力很大但有邊境牧羊犬阿智陪我解壓 🐕 阿智每天監視我有沒有準時下班。假日最愛去海邊。',
    interests: ['狗狗', '游泳', '爬山', '醫學', '旅行'], jobTitle: '急診科醫師',
    height: 180, zodiac: '天蠍座', education: '博士', avatarIdx: 2, balance: 500, locIdx: 5,
    pet: { name: '阿智', breed: '邊境牧羊犬 · 3 歲', bio: '聰明到讓人害怕，每天想著怎麼偷翻垃圾桶。需要大量運動和心理刺激。', tags: ['聰明', '活潑', '需要運動', '愛飛盤'], type: 'dog', photoIdx: 4 },
  },
  {
    email: 'wenxin.hsu@test.com', displayName: '許文欣', gender: Gender.FEMALE,
    bio: '自由攝影師，暹羅貓冰冰是我最上鏡的模特兒 🐱📸 喜歡深夜逛書店、看獨立電影、騎 YouBike 亂晃。',
    interests: ['攝影', '貓咪', '電影', '書店', '藝術'], jobTitle: '攝影師',
    height: 165, zodiac: '水瓶座', education: '大學', avatarIdx: 3, balance: 120, locIdx: 6,
    pet: { name: '冰冰', breed: '暹羅貓 · 2 歲', bio: '世界最有個性的貓，叫聲很大意見很多，但選中你就是一生的朋友。', tags: ['有個性', '話多', '黏人', '愛撒嬌'], type: 'cat', photoIdx: 4 },
  },
  {
    email: 'zhihao.tsai@test.com', displayName: '蔡志豪', gender: Gender.MALE,
    bio: '律師，養了一隻哈士奇叫法官，每天在家大叫表達意見 😆 需要有人一起遛狗解壓。',
    interests: ['法律', '哈士奇', '健身', '美食', '旅遊'], jobTitle: '律師',
    height: 176, zodiac: '摩羯座', education: '碩士', avatarIdx: 3, balance: 400, locIdx: 7,
    pet: { name: '法官', breed: '哈士奇 · 2 歲', bio: '在家最大聲的成員，吃飯前一定要先叫三分鐘。出門超乖。', tags: ['話多', '活潑', '愛叫', '出門超乖'], type: 'dog', photoIdx: 6 },
  },
  {
    email: 'yitong.lin@test.com', displayName: '林映彤', gender: Gender.FEMALE,
    bio: '產品經理，工作忙但心裡住著一隻柯基 Cooper 🐾 每天回家看到他跑來迎接，所有疲憊都消了。',
    interests: ['柯基', '產品', '瑜伽', '美食', '旅行'], jobTitle: '產品經理',
    height: 162, zodiac: '牡羊座', education: '碩士', avatarIdx: 4, balance: 150, locIdx: 8,
    pet: { name: 'Cooper', breed: '柯基 · 1.5 歲', bio: '屁股不停搖的開心果，跑步姿勢讓所有路人都忍不住笑出來。', tags: ['開心', '可愛', '愛搖屁股', '活力充沛'], type: 'dog', photoIdx: 8 },
  },
  {
    email: 'yutong.chen@test.com', displayName: '陳語彤', gender: Gender.FEMALE,
    bio: '人資專員，有一隻布偶貓叫雪球，美到讓來我家的朋友都只顧著拍牠 😤 最喜歡瑜伽和去寵物友善咖啡廳。',
    interests: ['貓咪', '瑜伽', '咖啡廳', '植物', '手帳'], jobTitle: '人資專員',
    height: 158, zodiac: '金牛座', education: '大學', avatarIdx: 5, balance: 60, locIdx: 1,
    pet: { name: '雪球', breed: '布偶貓 · 2 歲', bio: '藍眼睛白毛，每隔幾秒就要確認主人在不在，分離焦慮嚴重但超級可愛。', tags: ['黏人', '美麗', '溫和', '愛撒嬌'], type: 'cat', photoIdx: 6 },
  },
  {
    email: 'xiaoqing.wang@test.com', displayName: '王曉晴', gender: Gender.FEMALE,
    bio: '外商業務，個性跟我的薩摩耶 Polar 一樣熱情 ✨ 愛交朋友、愛戶外活動，週末一定要出門曬太陽。',
    interests: ['狗狗', '戶外', '旅行', '健身', '美食'], jobTitle: '業務代表',
    height: 166, zodiac: '射手座', education: '大學', avatarIdx: 6, balance: 90, locIdx: 2,
    pet: { name: 'Polar', breed: '薩摩耶 · 2 歲', bio: '一身白毛像雪一樣純，但個性超活潑，見到任何人都要去打招呼。', tags: ['友善', '活潑', '親人', '愛跑步'], type: 'dog', photoIdx: 9 },
  },
  {
    email: 'junhong.lin@test.com', displayName: '林俊宏', gender: Gender.MALE,
    bio: '建築師，設計空間也設計生活。和拉布拉多 Max 住在我自己改造的公寓裡。週末一定要出門跑步。',
    interests: ['建築', '跑步', '設計', '狗狗', '閱讀'], jobTitle: '建築師',
    height: 179, zodiac: '處女座', education: '碩士', avatarIdx: 4, balance: 250, locIdx: 0,
    pet: { name: 'Max', breed: '拉布拉多 · 3 歲', bio: '溫柔又聰明，不論到哪裡都是全場焦點。最愛陪主人晨跑。', tags: ['溫柔', '聰明', '愛運動', '親人'], type: 'dog', photoIdx: 10 },
  },
  {
    email: 'zhiwei.wang@test.com', displayName: '王志偉', gender: Gender.MALE,
    bio: '會計師，數字是我的語言，但橘貓大橘是我的解藥 😸 他能把任何空間佔滿，包括我的心。',
    interests: ['貓咪', '理財', '下廚', '電影', '健走'], jobTitle: '會計師',
    height: 174, zodiac: '天蠍座', education: '大學', avatarIdx: 5, balance: 180, locIdx: 1,
    pet: { name: '大橘', breed: '橘貓 · 4 歲', bio: '圓潤而充實，每天最重要的事就是吃飯、睡覺、監督主人吃飯。', tags: ['圓潤', '愛吃', '慵懶', '黏人'], type: 'cat', photoIdx: 8 },
  },
  {
    email: 'jianting.li@test.com', displayName: '李建廷', gender: Gender.MALE,
    bio: '警察，工作需要嚴肅，但德牧 Zeus 永遠是我最忠實的夥伴 🐾 下班喜歡打籃球和健身。',
    interests: ['狗狗', '籃球', '健身', '登山', '電影'], jobTitle: '警察',
    height: 183, zodiac: '牡羊座', education: '大學', avatarIdx: 6, balance: 70, locIdx: 9,
    pet: { name: 'Zeus', breed: '德國牧羊犬 · 4 歲', bio: '威嚴的外表下其實超級黏主人，每次主人出門都要趴在門口等。', tags: ['忠誠', '聰明', '保護性強', '黏主人'], type: 'dog', photoIdx: 2 },
  },
  {
    email: 'boyan.huang@test.com', displayName: '黃柏諺', gender: Gender.MALE,
    bio: '軟體工程師，養了一隻橘白米克斯叫 Boba 🧋 在家一起打 code 一起看影片，是我最好的配對。',
    interests: ['程式', '貓咪', '動漫', '手遊', '下廚'], jobTitle: '軟體工程師',
    height: 171, zodiac: '雙魚座', education: '碩士', avatarIdx: 7, balance: 130, locIdx: 10,
    pet: { name: 'Boba', breed: '橘白米克斯 · 1 歲', bio: '從路邊撿到，從此以為自己是老大。最愛搶佔鍵盤和任何溫暖的地方。', tags: ['調皮', '好奇', '黏人', '愛窩'], type: 'cat', photoIdx: 9 },
  },
  {
    email: 'guanting.wu@test.com', displayName: '吳冠廷', gender: Gender.MALE,
    bio: '視覺設計師，和柯基 Rudy 一起住。他的屁股每天給我靈感 😂 喜歡去寵物友善咖啡廳邊喝咖啡邊素描。',
    interests: ['設計', '柯基', '咖啡', '素描', '攝影'], jobTitle: '視覺設計師',
    height: 172, zodiac: '天秤座', education: '大學', avatarIdx: 8, balance: 95, locIdx: 0,
    pet: { name: 'Rudy', breed: '柯基 · 2 歲', bio: '每次出門都吸引一堆路人，回家後在沙發上睡得不省人事。', tags: ['萌', '活潑', '話多', '愛社交'], type: 'dog', photoIdx: 3 },
  },
  {
    email: 'yuntingz.zhang@test.com', displayName: '張筠婷', gender: Gender.FEMALE,
    bio: '幼教老師，有一隻比熊 Bibi 跟我一樣愛孩子 🐾 喜歡假日去公園野餐，做手作蠟燭，過慢慢的生活。',
    interests: ['幼教', '狗狗', '野餐', '手作', '烘焙'], jobTitle: '幼兒園老師',
    height: 155, zodiac: '巨蟹座', education: '大學', avatarIdx: 7, balance: 55, locIdx: 5,
    pet: { name: 'Bibi', breed: '比熊犬 · 2 歲', bio: '白白圓圓的毛球，見到任何人都要蹦過去撒嬌，完全不知道什麼叫陌生人。', tags: ['可愛', '愛撒嬌', '友善', '毛茸茸'], type: 'dog', photoIdx: 11 },
  },
  {
    email: 'zhewei.hsu@test.com', displayName: '許哲維', gender: Gender.MALE,
    bio: '資料科學家，有一隻英短銀漸層 Ash 跟我一樣喜歡安靜思考 🐱 假日下棋、讀書、偶爾去健行。',
    interests: ['資料', '貓咪', '下棋', '閱讀', '健行'], jobTitle: '資料科學家',
    height: 175, zodiac: '處女座', education: '博士', avatarIdx: 9, balance: 200, locIdx: 2,
    pet: { name: 'Ash', breed: '英短銀漸層 · 3 歲', bio: '眼神深邃，靜靜坐在那裡就是一幅畫。偶爾會走過來踩踩鍵盤表達存在感。', tags: ['優雅', '安靜', '高冷', '偶爾撒嬌'], type: 'cat', photoIdx: 3 },
  },
  {
    email: 'ziqing.liu@test.com', displayName: '劉子晴', gender: Gender.FEMALE,
    bio: '記者，採訪很累但回家有暹羅貓 Suki 療癒我 💆‍♀️ 喜歡找台北巷弄裡的老店、追紀錄片、週末去爬山。',
    interests: ['新聞', '貓咪', '爬山', '老屋', '紀錄片'], jobTitle: '記者',
    height: 161, zodiac: '雙子座', education: '大學', avatarIdx: 8, balance: 85, locIdx: 6,
    pet: { name: 'Suki', breed: '暹羅貓 · 2 歲', bio: '意見很多，每次主人講電話都要插嘴，但只要開罐罐就立刻閉嘴。', tags: ['話多', '黏人', '有主見', '愛罐罐'], type: 'cat', photoIdx: 5 },
  },
  {
    email: 'shihan.huang2@test.com', displayName: '黃詩涵', gender: Gender.FEMALE,
    bio: '藥劑師，養了一隻柴犬叫小福，每天下班第一件事就是抱他 🐕 假日喜歡去農夫市集買菜自己煮。',
    interests: ['狗狗', '下廚', '市集', '健走', '植物'], jobTitle: '藥劑師',
    height: 159, zodiac: '天秤座', education: '大學', avatarIdx: 9, balance: 75, locIdx: 7,
    pet: { name: '小福', breed: '柴犬 · 3 歲', bio: '脾氣好、愛乾淨，走在路上永遠是最帥的那個。最愛被摸下巴。', tags: ['溫和', '乾淨', '帥氣', '愛散步'], type: 'dog', photoIdx: 7 },
  },
  {
    email: 'chenghao.tsai@test.com', displayName: '蔡承翰', gender: Gender.MALE,
    bio: '主廚，馬爾濟斯 Cotton 是我的美食評審 🍳 她不吃的料理我就重做。假日喜歡去傳統市場找食材。',
    interests: ['料理', '狗狗', '市場', '葡萄酒', '健身'], jobTitle: '主廚',
    height: 177, zodiac: '金牛座', education: '專科', avatarIdx: 10, balance: 160, locIdx: 8,
    pet: { name: 'Cotton', breed: '馬爾濟斯 · 4 歲', bio: '小小一隻卻很有氣勢，喜歡坐在主人手上俯視一切。毛要每天梳。', tags: ['優雅', '嬌小', '有氣勢', '需要梳毛'], type: 'dog', photoIdx: 5 },
  },
  {
    email: 'zonghao.yang@test.com', displayName: '楊宗翰', gender: Gender.MALE,
    bio: '攝影師，和橘貓 Miso 一起住在老公寓。他每次都擋在鏡頭前，害我的作品意外都是貓片。',
    interests: ['攝影', '貓咪', '旅行', '咖啡', '電影'], jobTitle: '攝影師',
    height: 173, zodiac: '天蠍座', education: '大學', avatarIdx: 11, balance: 110, locIdx: 4,
    pet: { name: 'Miso', breed: '橘貓 · 5 歲', bio: '家裡最年長的成員，對外來者一律冷漠，但主人回家一定要先打招呼。', tags: ['傲嬌', '年長', '有威嚴', '固執'], type: 'cat', photoIdx: 7 },
  },
  {
    email: 'yunting.li@test.com', displayName: '李韻婷', gender: Gender.FEMALE,
    bio: '護理師，三班輪替但心裡永遠有我的異國短毛貓豆腐 🐱 他圓眼睛扁臉，每次看到都噴笑。',
    interests: ['貓咪', '瑜伽', '下廚', '追劇', '爬山'], jobTitle: '護理師',
    height: 160, zodiac: '雙魚座', education: '大學', avatarIdx: 10, balance: 45, locIdx: 3,
    pet: { name: '豆腐', breed: '異國短毛貓 · 2 歲', bio: '扁臉圓眼，整張臉就是一個問號表情，看了就想捏。脾氣超好，不會抓人。', tags: ['扁臉', '圓眼', '溫和', '可愛'], type: 'cat', photoIdx: 1 },
  },
  {
    email: 'yujun.fang@test.com', displayName: '方怡君', gender: Gender.FEMALE,
    bio: '長榮空服員，飛來飛去但心裡掛念的是我的橘貓橘子 ✈️🐱 回台北就要抱他睡覺補充能量。',
    interests: ['旅行', '貓咪', '美食', '語言', '瑜伽'], jobTitle: '空服員',
    height: 166, zodiac: '天蠍座', education: '大學', avatarIdx: 11, balance: 70, locIdx: 11,
    pet: { name: '橘子', breed: '橘貓 · 3 歲', bio: '胖橘的體態，哲學家的神情。每次主人出差都要罷工不吃飯表示抗議。', tags: ['胖橘', '黏人', '罷工型', '愛吃'], type: 'cat', photoIdx: 2 },
  },
  {
    email: 'jingyi.wu@test.com', displayName: '吳靜宜', gender: Gender.FEMALE,
    bio: '公關顧問，工作講求人際，回家需要貓咪的安靜陪伴 🐾 有一隻折耳貓叫泡芙，每天治癒我的社交疲勞。',
    interests: ['公關', '貓咪', '瑜伽', '紅酒', '展覽'], jobTitle: '公關顧問',
    height: 167, zodiac: '射手座', education: '碩士', avatarIdx: 12, balance: 220, locIdx: 12,
    pet: { name: '泡芙', breed: '折耳貓 · 2 歲', bio: '耳朵往下折，看起來很憂鬱但其實什麼事都無所謂。最愛盯著窗外發呆。', tags: ['安靜', '療癒', '憂鬱臉', '愛發呆'], type: 'cat', photoIdx: 4 },
  },
];

const LOVERS_RAW: Array<{
  email: string; displayName: string; gender: Gender;
  bio: string; interests: string[]; jobTitle: string;
  height: number; zodiac: string; education: string;
  avatarIdx: number; balance: number; locIdx: number;
}> = [
  {
    email: 'sihan.huang@test.com', displayName: '黃思涵', gender: Gender.FEMALE,
    bio: 'UX 設計師，超愛狗但租屋沒辦法養 😢 每次看到別人的狗都想蹲下摸。希望認識狗主人，跟毛孩做朋友！',
    interests: ['設計', '狗狗', '健行', '手沖咖啡', '插畫'], jobTitle: 'UX 設計師',
    height: 162, zodiac: '射手座', education: '大學', avatarIdx: 0, balance: 30, locIdx: 8,
  },
  {
    email: 'yuxiang.zheng@test.com', displayName: '鄭宇翔', gender: Gender.MALE,
    bio: '財務分析師，數字日常，週末遠離 Excel。從小愛動物，尤其貓咪。希望認識貓主人被療癒一下 🐾',
    interests: ['貓咪', '理財', '路跑', '音樂', '電影'], jobTitle: '財務分析師',
    height: 175, zodiac: '金牛座', education: '碩士', avatarIdx: 0, balance: 60, locIdx: 9,
  },
  {
    email: 'meiling.liu@test.com', displayName: '劉美玲', gender: Gender.FEMALE,
    bio: '護理師，三班輪替，下大夜看到別人遛狗超羨慕 🌙 貓貓狗狗都喜歡，動物比人類更懂你。',
    interests: ['貓咪', '狗狗', '瑜伽', '追劇', '野餐'], jobTitle: '護理師',
    height: 158, zodiac: '牡羊座', education: '大學', avatarIdx: 1, balance: 20, locIdx: 10,
  },
  {
    email: 'zixuan.zhou@test.com', displayName: '周子軒', gender: Gender.MALE,
    bio: '大四資工系，家裡以前養過狗，自己住之後每次看到狗都走不動 🐶 想認識愛寵物的人！',
    interests: ['程式', '狗狗', '電競', '籃球', '動漫'], jobTitle: '學生',
    height: 173, zodiac: '雙子座', education: '大學', avatarIdx: 1, balance: 10, locIdx: 11,
  },
  {
    email: 'yawen.yang@test.com', displayName: '楊雅文', gender: Gender.FEMALE,
    bio: '廣告業 AE，老闆不讓養貓 😠 最愛貓咪影片、去寵物咖啡廳充電。認識我的話保證每天傳貓圖給你。',
    interests: ['貓咪', '廣告', '咖啡廳', '健身', '旅行'], jobTitle: '廣告 AE',
    height: 164, zodiac: '天秤座', education: '大學', avatarIdx: 2, balance: 50, locIdx: 12,
  },
  {
    email: 'bowen.xie@test.com', displayName: '謝博文', gender: Gender.MALE,
    bio: '高中地理老師，喜歡研究地形地圖（職業病）。也很喜歡動物，尤其柴犬秋田這類有土地感的品種。',
    interests: ['教育', '狗狗', '地理', '健行', '攝影'], jobTitle: '高中老師',
    height: 177, zodiac: '處女座', education: '碩士', avatarIdx: 2, balance: 40, locIdx: 13,
  },
  {
    email: 'yijun.fang2@test.com', displayName: '范依潔', gender: Gender.FEMALE,
    bio: '插畫家，在家工作但需要貓咪陪伴的那種 🎨 每次去朋友家看到貓就畫個不停。想認識貓主人！',
    interests: ['插畫', '貓咪', '藝術', '咖啡', '獨立音樂'], jobTitle: '插畫家',
    height: 161, zodiac: '雙魚座', education: '大學', avatarIdx: 3, balance: 35, locIdx: 14,
  },
  {
    email: 'yichen.lin@test.com', displayName: '林宜蓁', gender: Gender.FEMALE,
    bio: '行銷研究員，住在寵物禁止的公寓，每次看到毛孩心就碎了一片 💔 希望認識有毛孩的人，輪流陪他們！',
    interests: ['行銷', '狗狗', '咖啡', '健走', '韓劇'], jobTitle: '行銷研究員',
    height: 163, zodiac: '巨蟹座', education: '大學', avatarIdx: 4, balance: 25, locIdx: 0,
  },
  {
    email: 'yutian.zhang@test.com', displayName: '張宇天', gender: Gender.MALE,
    bio: '獸醫系學生，老本行讓我超愛所有動物。特別想認識有貓有狗的主人，趁實習前多累積實際相處經驗 🐾',
    interests: ['獸醫', '動物', '跑步', '料理', '籃球'], jobTitle: '學生',
    height: 176, zodiac: '獅子座', education: '大學', avatarIdx: 3, balance: 15, locIdx: 1,
  },
  {
    email: 'wanyu.chen@test.com', displayName: '陳婉瑜', gender: Gender.FEMALE,
    bio: '產品設計師，週末最愛去寵物咖啡廳吸貓充電 🐱 覺得貓的眼神特別能治癒設計師的靈魂。',
    interests: ['設計', '貓咪', '咖啡廳', '展覽', '瑜伽'], jobTitle: '產品設計師',
    height: 164, zodiac: '水瓶座', education: '大學', avatarIdx: 5, balance: 55, locIdx: 2,
  },
  {
    email: 'jianwei.li@test.com', displayName: '李建維', gender: Gender.MALE,
    bio: '軟體工程師，家裡沒養寵物但對貓超有感情。看到貓會自動蹲下對話 🐱 想認識可以帶我玩貓的人。',
    interests: ['程式', '貓咪', '音樂', '爬山', '攝影'], jobTitle: '後端工程師',
    height: 179, zodiac: '雙子座', education: '碩士', avatarIdx: 4, balance: 80, locIdx: 3,
  },
  {
    email: 'xinyi.wu@test.com', displayName: '吳心怡', gender: Gender.FEMALE,
    bio: '公務員，穩定的工作配上毛茸茸的朋友才是最完美的人生 🐾 希望認識有狗的主人，一起去寵物公園！',
    interests: ['狗狗', '野餐', '健走', '閱讀', '烘焙'], jobTitle: '公務員',
    height: 156, zodiac: '天蠍座', education: '大學', avatarIdx: 6, balance: 45, locIdx: 4,
  },
  {
    email: 'haoyu.huang@test.com', displayName: '黃浩宇', gender: Gender.MALE,
    bio: '體育老師，每天帶學生運動，下班最想做的事是去公園找狗狗一起玩 😆 特別喜歡大型犬！',
    interests: ['運動', '狗狗', '健身', '籃球', '戶外'], jobTitle: '體育老師',
    height: 185, zodiac: '牡羊座', education: '大學', avatarIdx: 5, balance: 35, locIdx: 5,
  },
  {
    email: 'sijia.lin@test.com', displayName: '林思嘉', gender: Gender.FEMALE,
    bio: '社工師，白天陪人，晚上需要貓咪陪我 🐱 貓的療癒力是我工作繼續的原動力。想認識有貓的主人。',
    interests: ['貓咪', '音樂', '閱讀', '健走', '社會議題'], jobTitle: '社工師',
    height: 160, zodiac: '雙魚座', education: '大學', avatarIdx: 7, balance: 20, locIdx: 6,
  },
  {
    email: 'mingzhe.wang@test.com', displayName: '王明哲', gender: Gender.MALE,
    bio: '創業中，辦公室不讓養貓，但每天需要動物能量補充 🐾 希望認識有毛孩的朋友，順便偷充電一下。',
    interests: ['創業', '貓咪', '投資', '健身', '旅行'], jobTitle: '新創創辦人',
    height: 174, zodiac: '天秤座', education: '碩士', avatarIdx: 6, balance: 150, locIdx: 7,
  },
  {
    email: 'yuhui.fang@test.com', displayName: '方玉慧', gender: Gender.FEMALE,
    bio: '牙醫，工作戴口罩整天，下班最愛摘下口罩去遛狗 😂 沒有自己的狗但非常想參與別人的狗的生活。',
    interests: ['狗狗', '健行', '烘焙', '瑜伽', '旅行'], jobTitle: '牙醫師',
    height: 165, zodiac: '金牛座', education: '博士', avatarIdx: 8, balance: 200, locIdx: 8,
  },
  {
    email: 'yunhao.chen@test.com', displayName: '陳韻昊', gender: Gender.MALE,
    bio: '研究所學生，論文壓力很大，唯一的解藥就是去摸貓 🐱 希望認識可以定期讓我療癒的貓主人。',
    interests: ['學術', '貓咪', '閱讀', '咖啡', '音樂'], jobTitle: '研究生',
    height: 172, zodiac: '處女座', education: '碩士', avatarIdx: 7, balance: 5, locIdx: 9,
  },
  {
    email: 'xinjie.lin@test.com', displayName: '林心潔', gender: Gender.FEMALE,
    bio: '平面設計師，住在貓咪友善公寓但房東剛換成不讓養的 😭 心中始終有一塊貓咪形狀的洞。',
    interests: ['設計', '貓咪', '攝影', '藝術', '咖啡廳'], jobTitle: '平面設計師',
    height: 159, zodiac: '射手座', education: '大學', avatarIdx: 9, balance: 40, locIdx: 10,
  },
  {
    email: 'zhenxuan.wang@test.com', displayName: '王振軒', gender: Gender.MALE,
    bio: '工程師，被貓咪影片洗腦多年，終於決定要認識真實的貓 🐾 希望邊學程式邊撸貓，人生才完整。',
    interests: ['程式', '貓咪', '動漫', '下廚', '健走'], jobTitle: '前端工程師',
    height: 170, zodiac: '雙魚座', education: '大學', avatarIdx: 8, balance: 65, locIdx: 11,
  },
  {
    email: 'jiamin.li@test.com', displayName: '李佳敏', gender: Gender.FEMALE,
    bio: '空姐，每次飛回台灣都直接去朋友家看她的柴犬 ✈️ 想自己養但生活型態不允許，只能靠認識狗主人解饞。',
    interests: ['旅行', '狗狗', '語言', '美食', '健身'], jobTitle: '空服員',
    height: 167, zodiac: '天蠍座', education: '大學', avatarIdx: 10, balance: 90, locIdx: 12,
  },
  {
    email: 'haoxin.zhang@test.com', displayName: '張浩鑫', gender: Gender.MALE,
    bio: '金融業，壓力大，狗狗是唯一的精神支柱 💪 週末去寵物公園看別人遛狗是我的休閒活動（感覺有點可憐）。',
    interests: ['狗狗', '金融', '路跑', '葡萄酒', '健身'], jobTitle: '投資顧問',
    height: 178, zodiac: '獅子座', education: '碩士', avatarIdx: 9, balance: 120, locIdx: 13,
  },
  {
    email: 'weixin.wu@test.com', displayName: '吳威鑫', gender: Gender.MALE,
    bio: '廚師，養過狗知道那種感情。現在沒辦法養但依然想要跟毛孩互動。最愛柴犬和秋田。',
    interests: ['料理', '狗狗', '健身', '美食探店', '旅行'], jobTitle: '廚師',
    height: 176, zodiac: '摩羯座', education: '專科', avatarIdx: 10, balance: 75, locIdx: 14,
  },
  {
    email: 'jiajia.chen@test.com', displayName: '陳佳佳', gender: Gender.FEMALE,
    bio: '新聞主播，鏡頭前要嚴肅，鏡頭外超愛抱貓 😸 去年採訪了一個貓咪救援故事之後整個人更愛貓了。',
    interests: ['新聞', '貓咪', '閱讀', '瑜伽', '演講'], jobTitle: '新聞主播',
    height: 168, zodiac: '水瓶座', education: '大學', avatarIdx: 11, balance: 180, locIdx: 0,
  },
  {
    email: 'zhengwei.lin@test.com', displayName: '林正威', gender: Gender.MALE,
    bio: '消防員，工作高壓，下班後需要動物療癒 🐾 非常嚮往有個狗狗在家等我回家的感覺。',
    interests: ['狗狗', '健身', '籃球', '電影', '下廚'], jobTitle: '消防員',
    height: 181, zodiac: '牡羊座', education: '大學', avatarIdx: 11, balance: 55, locIdx: 1,
  },
  {
    email: 'shuyun.huang@test.com', displayName: '黃淑筠', gender: Gender.FEMALE,
    bio: '圖書館員，每天跟書相處，但其實最想跟貓相處 🐱 貓跟書一樣安靜療癒，是我的心靈雙寶。',
    interests: ['閱讀', '貓咪', '咖啡', '藝術電影', '手作'], jobTitle: '圖書館員',
    height: 158, zodiac: '雙子座', education: '碩士', avatarIdx: 12, balance: 30, locIdx: 2,
  },
];

async function seed() {
  console.log('🌱 Seeding 50 users...');
  const HASH = await bcrypt.hash('password123', 10);

  await prisma.message.deleteMany();
  await prisma.meeting.deleteMany();
  await prisma.match.deleteMany();
  await prisma.swipe.deleteMany();
  await prisma.walletTransaction.deleteMany();
  await prisma.wallet.deleteMany();
  await prisma.photo.deleteMany();
  await prisma.pet.deleteMany();
  await prisma.user.deleteMany();

  // Create OWNER users
  const owners: any[] = [];
  let fIdx = 0, mIdx = 0;
  for (const d of OWNERS_RAW) {
    const { balance, locIdx, pet, avatarIdx, ...userData } = d;
    const avatarUrl = userData.gender === Gender.FEMALE
      ? FEMALE_AVATARS[fIdx++ % FEMALE_AVATARS.length]
      : MALE_AVATARS[mIdx++ % MALE_AVATARS.length];
    const u = await prisma.user.create({
      data: { ...userData, avatarUrl, passwordHash: HASH, role: UserRole.OWNER },
    });
    await prisma.wallet.create({ data: { userId: u.id, balance } });
    await setLocation(u.id, LOCATIONS[locIdx].lat, LOCATIONS[locIdx].lng);

    const photoPool = pet.type === 'cat' ? CAT_PHOTOS : DOG_PHOTOS;
    const p = await prisma.pet.create({ data: { ownerId: u.id, name: pet.name, breed: pet.breed, bio: pet.bio, tags: pet.tags } });
    await prisma.photo.createMany({
      data: [
        { petId: p.id, url: photoPool[pet.photoIdx % photoPool.length], kind: PhotoKind.closeup, sortOrder: 0 },
        { petId: p.id, url: photoPool[(pet.photoIdx + 1) % photoPool.length], kind: PhotoKind.bw, sortOrder: 1 },
      ],
    });
    owners.push(u);
  }

  // Create LOVER users
  fIdx = 0; mIdx = 0;
  const lovers: any[] = [];
  for (const d of LOVERS_RAW) {
    const { balance, locIdx, avatarIdx, ...userData } = d;
    const avatarUrl = userData.gender === Gender.FEMALE
      ? FEMALE_AVATARS[fIdx++ % FEMALE_AVATARS.length]
      : MALE_AVATARS[mIdx++ % MALE_AVATARS.length];
    const u = await prisma.user.create({
      data: { ...userData, avatarUrl, passwordHash: HASH, role: UserRole.LOVER },
    });
    await prisma.wallet.create({ data: { userId: u.id, balance } });
    await setLocation(u.id, LOCATIONS[locIdx].lat, LOCATIONS[locIdx].lng);
    lovers.push(u);
  }

  console.log(`\n✅ Seed done! ${owners.length} OWNERs + ${lovers.length} LOVERs = ${owners.length + lovers.length} users`);
  console.log('\n── OWNER accounts ──────────────────────────');
  OWNERS_RAW.forEach(d => console.log(`  ${d.displayName.padEnd(5)} │ ${d.email}`));
  console.log('\n── LOVER accounts ──────────────────────────');
  LOVERS_RAW.forEach(d => console.log(`  ${d.displayName.padEnd(5)} │ ${d.email}`));
  console.log('\n  All passwords: password123');
}

seed()
  .catch(console.error)
  .finally(() => prisma.$disconnect());
