// Welcome / identity selection screen
const { useState } = React;

function Welcome({ onPick }) {
  const L = window.Lucide || {};
  const Dog = L.Dog || (() => null);
  const Cat = L.Cat || (() => null);
  const ArrowRight = L.ArrowRight || (() => null);
  const [hover, setHover] = useState(null);

  return (
    <div className="anim-fadeIn h-full w-full flex flex-col bg-zinc-950 text-white">
      {/* Top brand bar */}
      <div className="flex items-center justify-between px-6 pt-3 pb-2 mono text-[10px] tracking-[0.2em] text-zinc-500 uppercase">
        <span>v0.1 · prototype</span>
        <span>26 · 05 · 26</span>
      </div>

      {/* Wordmark */}
      <div className="px-6 pt-16">
        <div className="text-[42px] leading-[0.95] tracking-tight font-semibold">
          PawPals
          <br />
          <span className="italic font-light text-zinc-400">Go.</span>
        </div>
        <div className="mt-4 text-zinc-500 text-[13px] leading-relaxed max-w-[20rem]">
          雙軌制毛孩交友。<br/>選一個身份開始 — 你可以隨時切換。
        </div>
      </div>

      {/* Identity cards */}
      <div className="mt-auto px-6 pb-6 space-y-3">
        <button
          onMouseEnter={() => setHover("owner")} onMouseLeave={() => setHover(null)}
          onClick={() => onPick("OWNER")}
          className="group w-full text-left bg-white text-black rounded-2xl p-5 transition-transform active:scale-[0.99] hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">01 / 飼主</div>
              <div className="mt-3 text-[28px] font-semibold leading-none">OWNER</div>
              <div className="mt-2 text-[13px] text-zinc-600">我家有毛孩 · 想幫他找朋友、找伴、找一場散步。</div>
            </div>
            <div className="rounded-full bg-black text-white p-2.5 group-hover:rotate-[-45deg] transition-transform">
              <ArrowRight size={16} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 mono text-[11px] text-zinc-500">
            <Dog size={14} />
            <span>建立毛孩檔案 · 上傳三張照片 · 開始配對</span>
          </div>
        </button>

        <button
          onMouseEnter={() => setHover("lover")} onMouseLeave={() => setHover(null)}
          onClick={() => onPick("LOVER")}
          className="group w-full text-left bg-zinc-900 text-white rounded-2xl p-5 hairline border-zinc-800 transition-transform active:scale-[0.99] hover:-translate-y-0.5"
        >
          <div className="flex items-start justify-between">
            <div>
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">02 / 貓狗奴</div>
              <div className="mt-3 text-[28px] font-semibold leading-none">LOVER</div>
              <div className="mt-2 text-[13px] text-zinc-400">沒養但很愛 · 找一隻可以代散、代擼、代陪伴的毛朋友。</div>
            </div>
            <div className="rounded-full bg-white text-black p-2.5 group-hover:rotate-[-45deg] transition-transform">
              <ArrowRight size={16} />
            </div>
          </div>
          <div className="mt-5 flex items-center gap-2 mono text-[11px] text-zinc-500">
            <Cat size={14} />
            <span>瀏覽附近毛孩 · 投餵肉乾 · 發起相約</span>
          </div>
        </button>

        <div className="pt-2 text-center mono text-[10px] tracking-[0.2em] uppercase text-zinc-600">
          — 滑動 · 配對 · 相約 —
        </div>
      </div>
    </div>
  );
}

window.Welcome = Welcome;
