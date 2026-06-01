// Meeting / Go! escrow system — schedule, cancel, QR check-in
const { useState: useStateM, useEffect: useEffectM } = React;

const WK = ["日","一","二","三","四","五","六"];
const HOURS = ["10:00","12:00","14:00","16:00","18:00","20:00"];

function nextDays(n) {
  const out = [];
  const base = new Date();
  for (let i = 0; i < n; i++) {
    const d = new Date(base.getFullYear(), base.getMonth(), base.getDate() + i);
    out.push(d);
  }
  return out;
}

function formatDt(dt) {
  if (!dt) return "";
  return `${dt.getMonth()+1}/${dt.getDate()} (${WK[dt.getDay()]}) ${String(dt.getHours()).padStart(2,"0")}:${String(dt.getMinutes()).padStart(2,"0")}`;
}

// Deterministic pseudo-QR — generated visually, does not encode anything
function FakeQR({ seed, size = 25 }) {
  function rand(i) {
    let h = ((seed >>> 0) * 2654435761 + i * 374761393) >>> 0;
    h = ((h ^ (h >>> 13)) * 1274126177) >>> 0;
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function corner(r, c) {
    const blocks = [[0,0],[0,size-7],[size-7,0]];
    for (const [br, bc] of blocks) {
      if (r >= br && r < br+7 && c >= bc && c < bc+7) {
        const lr = r - br, lc = c - bc;
        const outer = lr === 0 || lr === 6 || lc === 0 || lc === 6;
        const inner = lr >= 2 && lr <= 4 && lc >= 2 && lc <= 4;
        return outer || inner;
      }
    }
    return null;
  }
  const rects = [];
  for (let r = 0; r < size; r++) {
    for (let c = 0; c < size; c++) {
      const fin = corner(r, c);
      const fill = fin !== null ? fin : rand(r * size + c) > 0.52;
      if (fill) rects.push(<rect key={r*size+c} x={c} y={r} width="1" height="1" />);
    }
  }
  return (
    <svg viewBox={`-2 -2 ${size+4} ${size+4}`} className="w-44 h-44 bg-white rounded-2xl" shapeRendering="crispEdges">
      <g fill="black">{rects}</g>
    </svg>
  );
}

function RotatingQR() {
  const [now, setNow] = useStateM(Date.now());
  useEffectM(() => {
    const i = setInterval(() => setNow(Date.now()), 200);
    return () => clearInterval(i);
  }, []);
  const tick = Math.floor(now / 15000);
  const progress = ((now % 15000) / 15000) * 100;
  const secondsLeft = Math.max(1, Math.ceil(15 - ((now % 15000) / 1000)));
  return (
    <div className="flex flex-col items-center gap-3">
      <div className="relative">
        <FakeQR seed={tick} />
        <div className="absolute -inset-2 rounded-2xl border-white/15 hairline pointer-events-none" />
      </div>
      <div className="w-44 h-[3px] rounded-full bg-zinc-800 overflow-hidden">
        <div className="h-full bg-white transition-[width] duration-200 ease-linear" style={{ width: `${100 - progress}%` }} />
      </div>
      <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 flex items-center gap-2">
        <span>TOTP · {String(secondsLeft).padStart(2,"0")}s</span>
        <span className="h-1 w-1 rounded-full bg-emerald-400 animate-pulse" />
        <span>對方掃描中</span>
      </div>
    </div>
  );
}

function ScheduleModal({ open, onClose, onConfirm, balance }) {
  const L = window.Lucide || {};
  const { Calendar, Clock, Beef, X } = L;
  const [dayIdx, setDayIdx] = useStateM(1);
  const [time, setTime] = useStateM("14:00");
  if (!open) return null;
  const days = nextDays(7);
  function confirm() {
    const d = days[dayIdx];
    const [h, m] = time.split(":").map(Number);
    onConfirm(new Date(d.getFullYear(), d.getMonth(), d.getDate(), h, m));
  }
  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md anim-fadeIn" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full anim-pop bg-zinc-900 hairline border-zinc-800 rounded-t-3xl p-5 pb-7">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <div className="flex items-center justify-between">
          <div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">go! · schedule</div>
            <div className="text-[17px] font-semibold leading-tight mt-1">發起 Go! 約會</div>
          </div>
          <button onClick={onClose} className="text-zinc-400 p-1"><X size={16} /></button>
        </div>

        <div className="mt-5">
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2 flex items-center gap-1.5">
            <Calendar size={12} /> 選擇日期 · 未來 7 天內
          </div>
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar -mx-1 px-1">
            {days.map((d, i) => {
              const active = dayIdx === i;
              return (
                <button key={i} onClick={() => setDayIdx(i)}
                  className={`shrink-0 rounded-xl px-3 py-2 hairline transition min-w-[44px]
                    ${active ? "bg-white text-black border-white" : "bg-transparent border-zinc-800 text-zinc-300"}`}>
                  <div className="mono text-[9px] tracking-[0.2em] uppercase opacity-70">{WK[d.getDay()]}</div>
                  <div className="text-[15px] font-semibold leading-none mt-1">{d.getDate()}</div>
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-4">
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-zinc-500 mb-2 flex items-center gap-1.5">
            <Clock size={12} /> 選擇時段
          </div>
          <div className="grid grid-cols-6 gap-1.5">
            {HOURS.map((h) => {
              const active = h === time;
              return (
                <button key={h} onClick={() => setTime(h)}
                  className={`rounded-lg py-2 text-[12px] hairline
                    ${active ? "bg-white text-black border-white" : "border-zinc-800 text-zinc-300"}`}>
                  {h}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-5 hairline border-zinc-800 rounded-2xl p-3.5 bg-black/40">
          <div className="flex items-start gap-2 text-[11px] leading-relaxed text-zinc-400">
            <Beef size={14} className="text-white shrink-0 mt-0.5" />
            <span>
              發起約會將扣除您 <span className="text-white font-semibold">5 塊肉乾 🥩</span> 作為誠意金，並暫時由平台託管。
              距約定時間 <span className="text-white font-semibold">2 小時內取消</span>，肉乾將不予退還並直接補償給對方。
            </span>
          </div>
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 shrink-0">
            餘額 · <span className="text-white">{balance} 🥩</span>
          </div>
          <div className="flex gap-2">
            <button onClick={onClose} className="rounded-xl px-4 py-3 text-[13px] hairline border-zinc-700 text-zinc-300">取消</button>
            <button onClick={confirm} disabled={balance < 5}
              className={`rounded-xl px-4 py-3 text-[13px] font-semibold
                ${balance < 5 ? "bg-zinc-800 text-zinc-600" : "bg-white text-black"}`}>
              確認 · −5 🥩
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function ResultModal({ open, kind, message, onClose }) {
  if (!open) return null;
  const L = window.Lucide || {};
  const { Check, AlertTriangle, ShieldCheck, X } = L;
  const cfg = {
    success: { Icon: ShieldCheck, label: "verified · escrow released",      ring: "from-zinc-200 to-zinc-500" },
    refund:  { Icon: Check,       label: "good faith cancel · 100% refund", ring: "from-zinc-200 to-zinc-500" },
    penalty: { Icon: AlertTriangle, label: "penalty · escrow forfeited",    ring: "from-zinc-300 to-zinc-600" },
  }[kind] || {};
  const Ico = cfg.Icon || (() => null);
  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md anim-fadeIn" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full anim-pop bg-zinc-900 hairline border-zinc-800 rounded-t-3xl p-5 pb-7">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />
        <div className="flex items-center gap-3">
          <div className={`rounded-full bg-gradient-to-br ${cfg.ring} p-2.5`}>
            <Ico size={18} className="text-zinc-900" />
          </div>
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">{cfg.label}</div>
        </div>
        <div className="mt-4 text-[14px] leading-relaxed text-zinc-100">{message}</div>
        <button onClick={onClose} className="mt-5 w-full rounded-xl py-3 text-[13px] font-semibold bg-white text-black">
          知道了
        </button>
      </div>
    </div>
  );
}

function CameraScan({ open, onClose, onScanned }) {
  const L = window.Lucide || {};
  const { X } = L;
  useEffectM(() => {
    if (!open) return;
    const t = setTimeout(() => onScanned(), 2200);
    return () => clearTimeout(t);
  }, [open]);
  if (!open) return null;
  return (
    <div className="absolute inset-0 z-50 bg-black anim-fadeIn">
      <div className="absolute top-3 right-3 z-10">
        <button onClick={onClose} className="rounded-full p-2 hairline border-zinc-700 text-white"><X size={14} /></button>
      </div>
      <div className="absolute top-5 left-5 mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
        camera · scanning…
      </div>
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="relative w-64 h-64 overflow-hidden">
          {["top-0 left-0 border-l-2 border-t-2",
            "top-0 right-0 border-r-2 border-t-2",
            "bottom-0 left-0 border-l-2 border-b-2",
            "bottom-0 right-0 border-r-2 border-b-2"
          ].map((c, i) => <div key={i} className={`absolute w-8 h-8 border-white ${c}`} />)}
          <div className="absolute left-0 right-0 h-[1px] bg-white shadow-[0_0_18px_3px_rgba(255,255,255,0.9)] scan-line" />
        </div>
      </div>
      <div className="absolute bottom-10 left-0 right-0 text-center mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">
        對準對方 QR · 平台正在比對 PostGIS 座標
      </div>
    </div>
  );
}

function MeetingCard({ meeting, isInitiator, setIsInitiator, onStart, onCancel, onJumpToCheckin, onScanInit, onReset }) {
  const L = window.Lucide || {};
  const { MapPin, ArrowRight, Camera, Clock, RotateCcw, ShieldCheck, QrCode } = L;

  if (!meeting) {
    return (
      <div className="hairline border-zinc-800 rounded-2xl p-3.5 bg-zinc-900/60 flex items-center gap-3">
        <div className="h-10 w-10 rounded-xl hairline border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0">
          <MapPin size={16} />
        </div>
        <div className="flex-1 min-w-0">
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">附近的友善相約點</div>
          <div className="text-[14px] font-medium truncate">大安森林公園 · 300 公尺</div>
        </div>
        <button onClick={onStart}
          className="shrink-0 rounded-full px-3 py-2 text-[12px] font-semibold flex items-center gap-1.5 bg-white text-black">
          發起 Go! <ArrowRight size={12} />
        </button>
      </div>
    );
  }

  const RoleToggle = () => (
    <div className="hairline border-zinc-800 rounded-full p-0.5 flex text-[10px] mono tracking-[0.15em] uppercase">
      <button onClick={() => setIsInitiator(true)}
        className={`px-2.5 py-1 rounded-full ${isInitiator ? "bg-white text-black" : "text-zinc-400"}`}>發起方</button>
      <button onClick={() => setIsInitiator(false)}
        className={`px-2.5 py-1 rounded-full ${!isInitiator ? "bg-white text-black" : "text-zinc-400"}`}>接受方</button>
    </div>
  );

  if (meeting.status === "scheduled") {
    return (
      <div className="hairline border-zinc-800 rounded-2xl bg-zinc-900/60 overflow-hidden">
        <div className="p-3.5">
          <div className="flex items-center justify-between">
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500 flex items-center gap-1.5">
              <ShieldCheck size={11} /> escrow · 5 🥩 託管中
            </div>
            <RoleToggle />
          </div>
          <div className="mt-2.5 flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl hairline border-zinc-700 flex items-center justify-center text-zinc-200 shrink-0">
              <Clock size={16} />
            </div>
            <div className="flex-1 min-w-0">
              <div className="text-[14px] font-semibold leading-tight">{formatDt(meeting.scheduledAt)}</div>
              <div className="mt-0.5 text-[12px] text-zinc-400 truncate">大安森林公園 · 300 公尺</div>
            </div>
          </div>
        </div>
        <div className="grid grid-cols-2 hairline border-t border-zinc-800 text-[11px]">
          <button onClick={() => onCancel("good")}
            className="py-3 hairline border-r border-zinc-800 text-zinc-300 hover:bg-zinc-800/40 transition">
            模擬 · &gt;2h 取消
          </button>
          <button onClick={() => onCancel("penalty")}
            className="py-3 text-zinc-300 hover:bg-zinc-800/40 transition">
            模擬 · &lt;2h 取消
          </button>
        </div>
        <button onClick={onJumpToCheckin}
          className="w-full py-3 hairline border-t border-zinc-800 text-[11px] mono tracking-[0.18em] uppercase text-zinc-400 hover:bg-zinc-800/40 transition flex items-center justify-center gap-2">
          <QrCode size={11} /> 跳到簽到時間
        </button>
      </div>
    );
  }

  if (meeting.status === "checkin") {
    return (
      <div className="hairline border-zinc-800 rounded-2xl bg-zinc-900/60 p-4">
        <div className="flex items-center justify-between">
          <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">線下見面簽到</div>
          <RoleToggle />
        </div>

        <div className="mt-4 flex flex-col items-center">
          {isInitiator ? (
            <>
              <div className="relative mb-4">
                <div className="absolute inset-0 rounded-full bg-white/20 pulse-ring" />
                <div className="relative h-16 w-16 rounded-full hairline border-zinc-700 bg-black flex items-center justify-center">
                  <Camera size={22} className="text-white" />
                </div>
              </div>
              <div className="text-[13px] text-zinc-300 mb-3 text-center">作為發起方 · 請開啟相機掃描對方出示的 QR</div>
              <button onClick={onScanInit}
                className="rounded-2xl bg-white text-black px-5 py-3 text-[13px] font-semibold flex items-center gap-2">
                <Camera size={14} /> 開啟相機掃描簽到
              </button>
            </>
          ) : (
            <>
              <div className="text-[13px] text-zinc-300 mb-3 text-center">作為接受方 · 向發起方出示此動態 QR</div>
              <RotatingQR />
            </>
          )}
        </div>

        <button onClick={onReset}
          className="mt-4 w-full py-2.5 hairline border-zinc-800 rounded-xl text-[11px] mono tracking-[0.18em] uppercase text-zinc-500 flex items-center justify-center gap-1.5">
          <RotateCcw size={11} /> 重置情境
        </button>
      </div>
    );
  }

  if (meeting.status === "completed") {
    return (
      <div className="hairline border-zinc-800 rounded-2xl bg-zinc-900/60 p-4 anim-pop">
        <div className="flex items-center gap-2 mono text-[10px] tracking-[0.2em] uppercase text-zinc-400">
          <ShieldCheck size={12} /> go! · completed · escrow released
        </div>
        <div className="mt-2 text-[14px] text-zinc-200 leading-relaxed">
          託管的 <span className="font-semibold text-white">5 🥩</span> 已安全撥入接受方錢包。
        </div>
        <button onClick={onReset}
          className="mt-4 w-full py-2.5 hairline border-zinc-800 rounded-xl text-[12px] text-zinc-300 flex items-center justify-center gap-1.5">
          <RotateCcw size={11} /> 重新開始情境
        </button>
      </div>
    );
  }

  return null;
}

window.Meeting = { ScheduleModal, ResultModal, CameraScan, MeetingCard, formatDt };
