// Swipe deck — the main matching screen
const { useState: useStateS, useMemo: useMemoS } = React;

function Badge({ children }) {
  return (
    <span className="mono text-[10px] tracking-[0.15em] uppercase text-zinc-400 hairline border-zinc-700 rounded-full px-2.5 py-1">
      {children}
    </span>
  );
}

function PhotoFrame({ photo }) {
  // High-quality real image; falls back to a tinted placeholder via onError.
  const [errored, setErrored] = useStateS(false);
  return (
    <div className="absolute inset-0 overflow-hidden rounded-[28px]">
      {!errored ? (
        <img
          src={photo.src}
          alt={photo.label}
          onError={() => setErrored(true)}
          className="absolute inset-0 w-full h-full object-cover"
          draggable="false"
        />
      ) : (
        <div
          className="absolute inset-0"
          style={{
            background:
              `linear-gradient(160deg, oklch(0.32 0.06 ${photo.hue}) 0%, oklch(0.16 0.03 ${photo.hue}) 100%)`,
          }}
        >
          <div className="absolute inset-0 bg-noise opacity-50" />
          <div className="absolute bottom-6 left-6 mono text-[10px] tracking-[0.2em] uppercase text-white/60">
            {photo.label}
          </div>
        </div>
      )}
      {/* Vignettes */}
      <div className="absolute inset-x-0 top-0 h-32 bg-gradient-to-b from-black/60 to-transparent pointer-events-none" />
      <div className="absolute inset-x-0 bottom-0 h-56 bg-gradient-to-t from-black/85 via-black/30 to-transparent pointer-events-none" />
    </div>
  );
}

function PhotoBars({ count, index }) {
  return (
    <div className="absolute top-3 left-3 right-3 flex gap-1.5 z-20">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex-1 h-[2px] rounded-full bg-white/20 overflow-hidden">
          <div className={`h-full bg-white transition-all duration-300 ${i === index ? "w-full" : i < index ? "w-full opacity-60" : "w-0"}`} />
        </div>
      ))}
    </div>
  );
}

function IAPModal({ open, onClose, onBuy, pet }) {
  if (!open) return null;
  const L = window.Lucide || {};
  const Beef = L.Beef || (() => null);
  const Check = L.Check || (() => null);
  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md anim-fadeIn" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full anim-pop bg-zinc-900 hairline border-zinc-800 rounded-t-3xl p-5 pb-7">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <div className="flex items-center gap-3">
          <div className="rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 p-2.5">
            <Beef size={18} className="text-zinc-900" />
          </div>
          <div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">in-app · iap</div>
            <div className="text-[17px] font-semibold leading-tight">投餵肉乾給 {pet.name}</div>
          </div>
        </div>

        <div className="mt-5 hairline border-zinc-800 rounded-2xl p-4 bg-black/40">
          <div className="flex items-baseline justify-between">
            <span className="text-zinc-400 text-[13px]">高級肉乾 × 1</span>
            <span className="text-[22px] font-semibold tracking-tight">NT$ 60</span>
          </div>
          <div className="mt-3 space-y-1.5 text-[12px] text-zinc-400">
            {["訊息將被優先顯示在對方信箱頂端", "贈送對方一份限定貼紙", "可選擇匿名 / 顯名"].map((t) => (
              <div key={t} className="flex items-center gap-2">
                <Check size={12} className="text-white" />
                <span>{t}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 grid grid-cols-2 gap-2">
          <button onClick={onClose} className="rounded-xl py-3 text-[13px] hairline border-zinc-700 text-zinc-300">
            取消
          </button>
          <button onClick={onBuy} className="rounded-xl py-3 text-[13px] bg-white text-black font-semibold">
            確認購買
          </button>
        </div>
        <div className="mt-3 text-center mono text-[10px] tracking-[0.15em] uppercase text-zinc-600">
          purely cosmetic · no real charge
        </div>
      </div>
    </div>
  );
}

function ToastBurst({ kind }) {
  if (!kind) return null;
  const map = {
    like:  { txt: "LIKE", color: "text-white" },
    pass:  { txt: "PASS", color: "text-zinc-400" },
    super: { txt: "SUPER", color: "text-white" },
    treat: { txt: "TREAT SENT", color: "text-white" },
  };
  const m = map[kind] || map.like;
  return (
    <div className="absolute top-24 left-1/2 -translate-x-1/2 z-40 anim-pop pointer-events-none">
      <div className={`mono text-[12px] tracking-[0.35em] ${m.color} hairline border-zinc-700 rounded-full px-3 py-1.5 bg-black/70 backdrop-blur`}>
        {m.txt}
      </div>
    </div>
  );
}

function SwipeDeck({ identity, onMatch }) {
  const L = window.Lucide || {};
  const { X, Heart, Star, Sliders, Beef, Sparkles, Plus, MapPin } = L;
  const PETS = window.PawPals.PETS;

  const [stack, setStack] = useStateS(PETS);
  const [photoIdx, setPhotoIdx] = useStateS(0);
  const [swiping, setSwiping] = useStateS(null); // 'left' | 'right' | 'up'
  const [iap, setIap] = useStateS(false);
  const [toast, setToast] = useStateS(null);
  const top = stack[0];
  const next = stack[1];

  function trigger(dir) {
    if (swiping) return;
    setToast(dir === "left" ? "pass" : dir === "right" ? "like" : "super");
    setSwiping(dir);
    setTimeout(() => {
      setStack((s) => {
        const rest = s.slice(1);
        return rest.length ? rest : PETS; // loop for prototype
      });
      setPhotoIdx(0);
      setSwiping(null);
      setTimeout(() => setToast(null), 300);
      if (dir === "right" || dir === "up") onMatch?.(top);
    }, 320);
  }

  function tapPhoto(e) {
    if (!top || swiping) return;
    const rect = e.currentTarget.getBoundingClientRect();
    const left = (e.clientX - rect.left) < rect.width / 2;
    setPhotoIdx((i) => {
      const len = top.photos.length;
      return left ? (i - 1 + len) % len : (i + 1) % len;
    });
  }

  if (!top) return null;
  const photo = top.photos[photoIdx];

  return (
    <div className="anim-fadeIn h-full w-full flex flex-col bg-zinc-950 text-white relative">
      {/* Header */}
      <div className="px-5 pt-3 pb-3 flex items-center justify-between">
        <div className="text-[17px] font-semibold tracking-tight">PawPals <span className="italic font-light text-zinc-500">Go.</span></div>
        <div className="hairline border-zinc-800 rounded-full px-3 py-1 mono text-[10px] tracking-[0.2em] uppercase text-zinc-300">
          {identity === "OWNER" ? "01 · OWNER" : "02 · LOVER"}
        </div>
        <button className="hairline border-zinc-800 rounded-full p-2 text-zinc-300">
          <Sliders size={14} />
        </button>
      </div>

      {/* Card stack */}
      <div className="flex-1 px-5 pb-2 relative">
        {/* Back card peek */}
        {next && (
          <div className="absolute inset-x-5 top-0 bottom-2 rounded-[28px] hairline border-zinc-800 bg-zinc-900 scale-[0.96] -translate-y-2 opacity-70 overflow-hidden">
            <img src={next.photos[0].src} alt="" className="w-full h-full object-cover opacity-60" />
          </div>
        )}

        {/* Top card */}
        <div
          key={top.id + "-" + photoIdx + "-" + swiping}
          className={`absolute inset-x-5 top-0 bottom-2 rounded-[28px] overflow-hidden hairline border-zinc-800 bg-zinc-900 select-none
            ${swiping === "left" ? "swipe-left" : swiping === "right" ? "swipe-right" : swiping === "up" ? "swipe-up" : "anim-fadeIn"}`}
        >
          <PhotoFrame photo={photo} />
          <PhotoBars count={top.photos.length} index={photoIdx} />

          {/* tap zones */}
          <div className="absolute inset-0 grid grid-cols-2 z-10" onClick={tapPhoto}>
            <div /><div />
          </div>

          {/* photo kind chip */}
          <div className="absolute top-7 left-3 z-20">
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-white/80 bg-black/40 hairline border-white/20 rounded-full px-2 py-1">
              {photo.label}
            </div>
          </div>

          {/* Info overlay */}
          <div className="absolute left-0 right-0 bottom-0 p-5 z-20">
            <div className="flex items-end justify-between">
              <div>
                <div className="text-[28px] font-semibold leading-none tracking-tight">{top.name}</div>
                <div className="mt-1.5 text-zinc-300 text-[13px]">{top.breed}</div>
                <div className="mt-3 text-[13px] text-zinc-100/90 max-w-[16rem]">{top.bio}</div>
                <div className="mt-3 flex gap-1.5 flex-wrap">
                  {top.tags.map((t) => <Badge key={t}>{t}</Badge>)}
                </div>
                <div className="mt-3 flex items-center gap-1.5 text-zinc-400 text-[12px]">
                  <MapPin size={12} /> {top.location}
                </div>
              </div>

              {/* Treat / IAP button */}
              <button
                onClick={(e) => { e.stopPropagation(); setIap(true); }}
                className="z-30 relative shrink-0 ml-3 hairline border-white/30 bg-black/40 backdrop-blur rounded-2xl p-3 flex flex-col items-center gap-1"
              >
                <Beef size={18} />
                <span className="mono text-[9px] tracking-[0.15em] uppercase">投餵肉乾</span>
              </button>
            </div>
          </div>
        </div>

        <ToastBurst kind={toast} />
      </div>

      {/* Bottom controls — Pass · Super Like · Like */}
      <div className="px-10 pt-3 pb-5 flex items-center justify-between">
        <button onClick={() => trigger("left")}
          className="h-14 w-14 rounded-full hairline border-zinc-700 flex items-center justify-center active:scale-95 transition">
          <X size={22} className="text-zinc-200" strokeWidth={1.5} />
        </button>
        <button onClick={() => trigger("up")}
          className="h-12 w-12 rounded-full hairline border-zinc-700 flex items-center justify-center active:scale-95 transition">
          <Star size={18} className="text-zinc-200" strokeWidth={1.5} />
        </button>
        <button onClick={() => trigger("right")}
          className="h-16 w-16 rounded-full bg-white text-black flex items-center justify-center active:scale-95 transition shadow-[0_8px_30px_rgba(255,255,255,0.15)]">
          <Heart size={26} fill="black" strokeWidth={1.2} />
        </button>
      </div>

      <IAPModal open={iap} pet={top} onClose={() => setIap(false)} onBuy={() => { setIap(false); setToast("treat"); setTimeout(() => setToast(null), 1000); }} />
    </div>
  );
}

window.SwipeDeck = SwipeDeck;
