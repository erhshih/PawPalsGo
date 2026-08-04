/**
 * 建立 50 筆假用戶資料到 Railway 後端
 * 執行方式：node scripts/seed-users.mjs
 */

const API = 'https://pawpalsgo-production.up.railway.app';

const MALE_NAMES = ['志明','建宏','俊傑','文凱','彥廷','宗翰','承恩','柏宇','冠廷','育豪','昱辰','晉瑋','哲宇','博凱','宇翔','子豪','浩然','冠霖','睿恩','家豪'];
const FEMALE_NAMES = ['雅婷','怡君','佳蓉','欣怡','淑芬','雅雯','佩珊','宜蓁','詩涵','婉婷','心瑜','庭瑄','芷涵','欣穎','貞儀','若涵','語彤','晴慧','昕妍','柔安'];
const CITIES = ['台北大安','台北信義','台北中山','台北松山','台北南港','台北文山','新北板橋','新北中和','新北永和','新北新店','桃園中壢','台中西屯','台中北屯','高雄左營','高雄前鎮'];
const BREEDS = ['柴犬','黃金獵犬','邊境牧羊犬','法國鬥牛犬','貴賓犬','馬爾濟斯','柯基','哈士奇','拉不拉多','比熊犬','美國短毛貓','布偶貓','英國短毛貓','橘貓','緬因貓'];
const PET_NAMES = ['小福','奶茶','豆腐','肉桂','拿鐵','可可','布丁','麻糬','糰子','餅乾','芒果','西瓜','草莓','蘋果','栗子'];
const BIOS = [
  '喜歡帶毛孩出去玩，希望認識同樣愛狗的朋友！',
  '每天早晨都會帶毛小孩去公園散步，很開心遇到你',
  '家裡有一隻超黏人的貓，牠就是我的全世界',
  '週末固定去寵物友善咖啡廳，歡迎一起約',
  '養狗多年，對各種品種都很了解，喜歡交流飼養心得',
  '喜歡幫毛孩拍照，IG 幾乎都是牠的日常',
  '第一次養貓，正在努力學習中，希望認識有經驗的飼主',
  '毛孩是我最好的夥伴，願意為牠做任何事',
  '相信貓狗可以和平共處，我家就是最好的證明',
  '熱愛戶外活動，每個假日都帶毛孩去不同的地方探險',
];
const INTERESTS = [
  ['爬山', '攝影', '咖啡'],
  ['游泳', '閱讀', '料理'],
  ['跑步', '瑜珈', '旅行'],
  ['電影', '音樂', '健身'],
  ['美食', '繪畫', '寵物美容'],
  ['露營', '騎車', '手作'],
  ['貓咖', '下午茶', '逛街'],
  ['登山', '衝浪', '打球'],
];
const ZODIACS = ['牡羊座','金牛座','雙子座','巨蟹座','獅子座','處女座','天秤座','天蠍座','射手座','摩羯座','水瓶座','雙魚座'];
const JOBS = ['工程師','設計師','老師','護士','業務','會計師','攝影師','行銷','廚師','獸醫','學生','自由接案'];

// 台北周邊座標（隨機分散在 30km 範圍內）
function randomLocation() {
  const baseLat = 25.0330;
  const baseLng = 121.5654;
  const lat = baseLat + (Math.random() - 0.5) * 0.5;
  const lng = baseLng + (Math.random() - 0.5) * 0.5;
  return { lat: parseFloat(lat.toFixed(6)), lng: parseFloat(lng.toFixed(6)) };
}

function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickN(arr, n) {
  const shuffled = [...arr].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, n);
}

async function post(path, body, token) {
  const headers = { 'Content-Type': 'application/json' };
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const res = await fetch(`${API}${path}`, { method: 'POST', headers, body: JSON.stringify(body) });
  return res.json();
}

async function patch(path, body, token) {
  const headers = { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` };
  const res = await fetch(`${API}${path}`, { method: 'PATCH', headers, body: JSON.stringify(body) });
  return res.json();
}

async function createUser(i) {
  const isOwner = i < 30; // 前 30 個是 OWNER，後 20 個是 LOVER
  const gender = i % 3 === 0 ? 'MALE' : (i % 3 === 1 ? 'FEMALE' : 'OTHER');
  const namePool = gender === 'MALE' ? MALE_NAMES : FEMALE_NAMES;
  const displayName = pick(namePool);
  const email = `user${i + 1}@seed.pawpals.dev`;
  const password = 'Seed1234!';
  const role = isOwner ? 'OWNER' : 'LOVER';

  // 1. 註冊
  const reg = await post('/auth/register', { email, password, role, gender });
  if (!reg.accessToken) {
    if (reg.statusCode === 409) {
      // 已存在，嘗試登入
      const login = await post('/auth/login', { email, password });
      if (!login.accessToken) { console.log(`✗ user${i+1} login failed`, login); return; }
      reg.accessToken = login.accessToken;
    } else {
      console.log(`✗ user${i+1} register failed`, reg);
      return;
    }
  }
  const token = reg.accessToken;

  // 2. 更新個人資料
  const loc = randomLocation();
  await patch('/users/me', {
    displayName,
    bio: pick(BIOS),
    city: pick(CITIES),
    zodiac: pick(ZODIACS),
    jobTitle: pick(JOBS),
    height: 155 + Math.floor(Math.random() * 35),
    interests: pickN(INTERESTS.flat(), 3),
  }, token);

  // 3. 設定位置
  await patch('/users/me/location', loc, token);

  // 4. 建立寵物（OWNER 才有寵物）
  if (isOwner) {
    await post('/pets', {
      name: pick(PET_NAMES),
      breed: pick(BREEDS),
      bio: `很乖巧可愛，喜歡和人玩耍！`,
      tags: pickN(['活潑','黏人','安靜','愛撒嬌','愛運動','聰明','膽小','勇敢'], 3),
    }, token);
  }

  console.log(`✓ ${i+1}/50 ${role} ${displayName} (${email}) @ ${loc.lat},${loc.lng}`);
}

async function main() {
  console.log('開始建立 50 筆假用戶...\n');
  for (let i = 0; i < 50; i++) {
    await createUser(i);
    await new Promise(r => setTimeout(r, 100)); // 避免 rate limit
  }
  console.log('\n完成！');
}

main().catch(console.error);
