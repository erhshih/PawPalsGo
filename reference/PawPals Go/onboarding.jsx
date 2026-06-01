// Photo upload onboarding — multi-photo gallery, up to 5 per category
const { useState: useStateO, useRef: useRefO } = React;

const MAX_PER_CATEGORY = 5;

function PhotoTile({ src, isPrimary, onRemove }) {
  const L = window.Lucide || {};
  const { X, Check } = L;
  return (
    <div className="relative rounded-xl overflow-hidden hairline border-white/30 aspect-[3/4] bg-zinc-900">
      <img src={src} alt="" className="absolute inset-0 w-full h-full object-cover" />
      <div className="absolute inset-x-0 bottom-0 h-10 bg-gradient-to-t from-black/80 to-transparent" />
      {isPrimary && (
        <div className="absolute top-1.5 left-1.5 mono text-[8px] tracking-[0.2em] uppercase bg-white text-black rounded-full px-1.5 py-0.5 flex items-center gap-1">
          <Check size={9} strokeWidth={3} /> 主圖
        </div>
      )}
      <button onClick={onRemove}
        className="absolute top-1.5 right-1.5 rounded-full p-1 bg-black/70 hairline border-white/30 text-white">
        <X size={10} />
      </button>
    </div>
  );
}

function AddTile({ onPick, label }) {
  const L = window.Lucide || {};
  const { Plus } = L;
  const ref = useRefO(null);
  function handleFile(e) {
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = () => onPick(reader.result);
    reader.readAsDataURL(f);
    e.target.value = "";
  }
  return (
    <button onClick={() => ref.current?.click()}
      className="relative rounded-xl hairline border-zinc-700 border-dashed aspect-[3/4] flex flex-col items-center justify-center gap-1.5 bg-zinc-900/30 hover:bg-zinc-900/60 hover:border-white/50 transition group">
      <Plus size={16} className="text-zinc-500 group-hover:text-white transition" />
      <span className="mono text-[8px] tracking-[0.18em] uppercase text-zinc-500">{label}</span>
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={handleFile} />
    </button>
  );
}

function GhostTile() {
  return <div className="rounded-xl hairline border-zinc-900 aspect-[3/4] bg-zinc-950/40" />;
}

function PhotoCategory({ title, hint, accent, photos, onChange, minRequired }) {
  const L = window.Lucide || {};
  const { ChevronRight } = L;
  const list = photos || [];
  const count = list.length;
  const canAdd = count < MAX_PER_CATEGORY;
  const need = Math.max(0, minRequired - count);

  function setAt(i, v) {
    const next = list.slice();
    if (v == null) next.splice(i, 1);
    else next[i] = v;
    onChange(next);
  }
  function add(v) {
    if (!canAdd) return;
    onChange([...list, v]);
  }

  // 5-cell grid: filled tiles + one add-tile + ghost fillers
  const tiles = [];
  for (let i = 0; i < MAX_PER_CATEGORY; i++) {
    if (i < count) {
      tiles.push(<PhotoTile key={`p-${i}`} src={list[i]} isPrimary={i === 0} onRemove={() => setAt(i, null)} />);
    } else if (i === count && canAdd) {
      tiles.push(<AddTile key="add" onPick={add} label={i === 0 ? "加首張" : "加一張"} />);
    } else {
      tiles.push(<GhostTile key={`g-${i}`} />);
    }
  }

  return (
    <div className="mt-5">
      <div className="flex items-end justify-between mb-2.5">
        <div>
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">{accent}</div>
          <div className="mt-1 text-[15px] font-semibold leading-tight">{title}</div>
          <div className="mt-0.5 text-[11px] text-zinc-500">{hint}</div>
        </div>
        <div className="text-right">
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-zinc-400">
            {count} / {MAX_PER_CATEGORY}
          </div>
          {need > 0 && (
            <div className="mono text-[9px] tracking-[0.18em] uppercase text-white mt-0.5">
              還差 {need} 張
            </div>
          )}
        </div>
      </div>
      <div className="grid grid-cols-5 gap-1.5">{tiles}</div>
    </div>
  );
}

function Onboarding({ identity, onDone, onBack }) {
  const L = window.Lucide || {};
  const { ChevronLeft, ArrowRight, ShieldCheck } = L;

  const categories = identity === "OWNER"
    ? [{ key: "self", title: "你的本人照片", hint: "至少 1 張，最多 5 張", accent: "01 · REQUIRED" }]
    : [{ key: "self",    title: "你的本人照片",   hint: "至少 1 張，最多 5 張", accent: "01 · REQUIRED" },
       { key: "withPet", title: "與毛孩的合照",   hint: "至少 1 張，最多 5 張", accent: "02 · REQUIRED" }];

  const [photos, setPhotos] = useStateO(() => Object.fromEntries(categories.map((c) => [c.key, []])));
  const allDone = categories.every((c) => (photos[c.key] || []).length >= 1);
  const totalNeed = categories.reduce((n, c) => n + Math.max(0, 1 - (photos[c.key] || []).length), 0);

  function setCat(k, v) { setPhotos((p) => ({ ...p, [k]: v })); }

  return (
    <div className="anim-fadeIn h-full w-full bg-zinc-950 text-white flex flex-col overflow-y-auto no-scrollbar">
      {/* Top */}
      <div className="px-5 pt-3 pb-2 flex items-center justify-between shrink-0">
        <button onClick={onBack} className="p-1.5 -ml-1 text-zinc-300">
          <ChevronLeft size={18} />
        </button>
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">step 02 · profile</div>
        <div className="w-6" />
      </div>

      <div className="px-5">
        <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">
          {identity === "OWNER" ? "01 / 飼主" : "02 / 貓狗奴"}
        </div>
        <div className="mt-2 text-[24px] font-semibold leading-[1.15] tracking-tight">
          {identity === "OWNER" ? "建立你的人像相簿" : "建立你 · 與毛孩的相簿"}
        </div>
        <div className="mt-1.5 text-[12px] text-zinc-400 leading-relaxed">
          {identity === "OWNER"
            ? "至少 1 張本人照片，可上傳至 5 張，第一張為主圖。"
            : "本人照與毛孩合照各至少 1 張，每類最多 5 張，各自第一張為主圖。"}
        </div>
      </div>

      {/* Categories */}
      <div className="px-5">
        {categories.map((c) => (
          <PhotoCategory key={c.key}
            title={c.title} hint={c.hint} accent={c.accent}
            photos={photos[c.key]} onChange={(v) => setCat(c.key, v)}
            minRequired={1} />
        ))}
      </div>

      {/* Trust badge */}
      <div className="px-5 mt-5">
        <div className="hairline border-zinc-800 rounded-xl px-3 py-2.5 flex items-start gap-2 bg-zinc-900/40">
          <ShieldCheck size={14} className="text-white shrink-0 mt-0.5" />
          <div className="text-[11px] text-zinc-400 leading-relaxed">
            照片用於人工 + AI 真人驗證。通過後顯示「<span className="text-white">已驗證</span>」徽章；未通過將自動刪除。
          </div>
        </div>
      </div>

      {/* CTA */}
      <div className="mt-auto px-5 pb-5 pt-4 shrink-0">
        <button onClick={() => onDone(photos)} disabled={!allDone}
          className={`w-full rounded-2xl py-4 flex items-center justify-center gap-2 transition
            ${allDone ? "bg-white text-black" : "bg-zinc-900 text-zinc-600 hairline border-zinc-800"}`}>
          <span className="text-[14px] font-semibold">
            {allDone ? "進入毛孩世界" : `還差 ${totalNeed} 張必填照片`}
          </span>
          {allDone && <ArrowRight size={14} />}
        </button>
        <div className="mt-3 text-center mono text-[10px] tracking-[0.2em] uppercase text-zinc-600">
          prototype · photos stay in your browser
        </div>
      </div>
    </div>
  );
}

window.Onboarding = Onboarding;
