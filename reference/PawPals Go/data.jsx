// Static mock data — NO backend. Pure frontend prototype.
const PETS = [
  {
    id: "p1",
    name: "Mochi",
    breed: "柴犬 · ♂ 2y",
    bio: "週末山系犬。喜歡曬太陽與紅豆冰。",
    tags: ["山系", "親人", "結紮"],
    location: "大安區 · 0.4km",
    photos: [
      { kind: "closeup",  label: "毛孩特寫",      hue: 28, src: "https://images.unsplash.com/photo-1583511655802-41f1c4f1a3e4?w=900&q=80" },
      { kind: "owner",    label: "主僕街拍合照",  hue: 220, src: "https://images.unsplash.com/photo-1450778869180-41d0601e046e?w=900&q=80" },
      { kind: "bw",       label: "高冷黑白照",    hue: 0, src: "https://images.unsplash.com/photo-1537151608828-ea2b11777ee8?w=900&q=80&sat=-100" },
    ],
  },
  {
    id: "p2",
    name: "Latte",
    breed: "英短 · ♀ 3y",
    bio: "拿鐵色系。會自己關燈。",
    tags: ["室內派", "已驅蟲", "可代養"],
    location: "信義區 · 1.2km",
    photos: [
      { kind: "closeup", label: "毛孩特寫",     hue: 35, src: "https://images.unsplash.com/photo-1574144611937-0df059b5ef3e?w=900&q=80" },
      { kind: "owner",   label: "主僕街拍合照", hue: 200, src: "https://images.unsplash.com/photo-1511044568932-338cba0ad803?w=900&q=80" },
      { kind: "bw",      label: "高冷黑白照",   hue: 0, src: "https://images.unsplash.com/photo-1494256997604-768d1f608cac?w=900&q=80&sat=-100" },
    ],
  },
  {
    id: "p3",
    name: "Soba",
    breed: "米克斯 · ♂ 1y",
    bio: "撿來的奇蹟。叫得出名字會跑來。",
    tags: ["浪浪認養", "幼犬", "親小孩"],
    location: "中山區 · 2.1km",
    photos: [
      { kind: "closeup", label: "毛孩特寫",     hue: 18, src: "https://images.unsplash.com/photo-1561037404-61cd46aa615b?w=900&q=80" },
      { kind: "owner",   label: "主僕街拍合照", hue: 240, src: "https://images.unsplash.com/photo-1583337130417-3346a1be7dee?w=900&q=80" },
      { kind: "bw",      label: "高冷黑白照",   hue: 0, src: "https://images.unsplash.com/photo-1477884213360-7e9d7dcc1e48?w=900&q=80&sat=-100" },
    ],
  },
  {
    id: "p4",
    name: "Tofu",
    breed: "美短 · ♀ 4y",
    bio: "豆腐心。看起來很兇但其實怕吹風機。",
    tags: ["膽小", "貴婦食量", "禁止追尾"],
    location: "松山區 · 0.9km",
    photos: [
      { kind: "closeup", label: "毛孩特寫",     hue: 50, src: "https://images.unsplash.com/photo-1573865526739-10659fec78a5?w=900&q=80" },
      { kind: "owner",   label: "主僕街拍合照", hue: 280, src: "https://images.unsplash.com/photo-1606214174585-fe31582dc6ee?w=900&q=80" },
      { kind: "bw",      label: "高冷黑白照",   hue: 0, src: "https://images.unsplash.com/photo-1495360010541-f48722b34f7d?w=900&q=80&sat=-100" },
    ],
  },
  {
    id: "p5",
    name: "Cocoa",
    breed: "貴賓 · ♀ 5y",
    bio: "可可色系老靈魂。下午茶限定。",
    tags: ["溫順", "穿衣模特", "需陪散"],
    location: "大同區 · 3.4km",
    photos: [
      { kind: "closeup", label: "毛孩特寫",     hue: 22, src: "https://images.unsplash.com/photo-1583512603805-3cc6b41f3edb?w=900&q=80" },
      { kind: "owner",   label: "主僕街拍合照", hue: 210, src: "https://images.unsplash.com/photo-1518155317743-a8ff43ea6a5f?w=900&q=80" },
      { kind: "bw",      label: "高冷黑白照",   hue: 0, src: "https://images.unsplash.com/photo-1444212477490-ca407925329e?w=900&q=80&sat=-100" },
    ],
  },
];

const SEED_CHAT = [
  { id: 1, from: "them", text: "嗨～看你家 Mochi 也住大安區耶 🐾", time: "14:02" },
  { id: 2, from: "them", text: "週末有打算去森林公園散步嗎？", time: "14:02" },
  { id: 3, from: "me",   text: "在計畫了！你家的也太上相，主僕合照超有電影感", time: "14:05" },
  { id: 4, from: "them", text: "哈哈我朋友幫拍的。要不要約週六下午三點？", time: "14:06" },
];

window.PawPals = { PETS, SEED_CHAT };
