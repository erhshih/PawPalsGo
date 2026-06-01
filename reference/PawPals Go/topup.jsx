// Top-up / 儲值 modal — buy treats with NT$ (simulated)
const { useState: useStateT, useEffect: useEffectT } = React;

const PACKAGES = [
  { id: "s",  count: 10,  bonus: 0,  price: 60,  tag: null },
  { id: "m",  count: 30,  bonus: 2,  price: 180, tag: "熱門" },
  { id: "l",  count: 60,  bonus: 5,  price: 360, tag: null },
  { id: "xl", count: 120, bonus: 15, price: 720, tag: "最划算" },
];

function TopUpModal({ open, balance, onClose, onPurchase }) {
  const L = window.Lucide || {};
  const { X, Beef, Check, ShieldCheck } = L;
  const [sel, setSel] = useStateT("m");
  const [done, setDone] = useStateT(null); // { count }

  useEffectT(() => {
    if (!open) { setSel("m"); setDone(null); }
  }, [open]);

  if (!open) return null;

  const pkg = PACKAGES.find((p) => p.id === sel);
  const total = pkg.count + pkg.bonus;

  function confirm() {
    onPurchase(total);
    setDone({ count: total });
    setTimeout(() => { onClose(); }, 1400);
  }

  return (
    <div className="absolute inset-0 z-50 flex items-end" onClick={onClose}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md anim-fadeIn" />
      <div onClick={(e) => e.stopPropagation()} className="relative w-full anim-pop bg-zinc-900 hairline border-zinc-800 rounded-t-3xl p-5 pb-7 max-h-[92%] overflow-y-auto no-scrollbar">
        <div className="mx-auto mb-4 h-1 w-10 rounded-full bg-zinc-700" />

        {done ? (
          <div className="py-6 flex flex-col items-center text-center">
            <div className="rounded-full bg-gradient-to-br from-zinc-200 to-zinc-500 p-3 mb-3">
              <Check size={20} className="text-zinc-900" strokeWidth={2.5} />
            </div>
            <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">purchase complete</div>
            <div className="mt-2 text-[20px] font-semibold tracking-tight">
              + {done.count} 🥩 已入袋
            </div>
            <div className="mt-1 text-[12px] text-zinc-400">餘額 · {balance} 🥩</div>
          </div>
        ) : (
          <>
            {/* Header */}
            <div className="flex items-center justify-between">
              <div>
                <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">in-app · top up</div>
                <div className="text-[17px] font-semibold leading-tight mt-1">儲值肉乾 🥩</div>
              </div>
              <button onClick={onClose} className="text-zinc-400 p-1"><X size={16} /></button>
            </div>

            {/* Current balance */}
            <div className="mt-4 hairline border-zinc-800 rounded-xl px-3.5 py-2.5 flex items-center justify-between bg-black/40">
              <div className="flex items-center gap-2">
                <Beef size={14} className="text-white" />
                <span className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">目前餘額</span>
              </div>
              <span className="text-[18px] font-semibold tracking-tight">{balance} 🥩</span>
            </div>

            {/* Packages */}
            <div className="mt-4 grid grid-cols-2 gap-2">
              {PACKAGES.map((p) => {
                const active = p.id === sel;
                return (
                  <button key={p.id} onClick={() => setSel(p.id)}
                    className={`relative text-left rounded-2xl p-3.5 hairline transition
                      ${active ? "bg-white text-black border-white"
                              : "bg-zinc-900/40 text-white border-zinc-800 hover:border-zinc-600"}`}>
                    {p.tag && (
                      <div className={`absolute -top-1.5 right-2 mono text-[8px] tracking-[0.2em] uppercase rounded-full px-1.5 py-0.5
                        ${active ? "bg-black text-white" : "bg-white text-black"}`}>
                        {p.tag}
                      </div>
                    )}
                    <div className="flex items-baseline gap-1">
                      <span className="text-[22px] font-semibold leading-none tracking-tight">{p.count}</span>
                      <span className="text-[12px] opacity-70">🥩</span>
                    </div>
                    {p.bonus > 0 && (
                      <div className={`mt-1 mono text-[9px] tracking-[0.18em] uppercase ${active ? "text-black/70" : "text-zinc-400"}`}>
                        + 加贈 {p.bonus}
                      </div>
                    )}
                    <div className={`mt-2 text-[12px] font-medium ${active ? "text-black" : "text-zinc-200"}`}>
                      NT$ {p.price}
                    </div>
                  </button>
                );
              })}
            </div>

            {/* Summary */}
            <div className="mt-4 hairline border-zinc-800 rounded-xl p-3.5 bg-black/30">
              <div className="flex items-center justify-between text-[13px]">
                <span className="text-zinc-400">本次入袋</span>
                <span className="text-white font-semibold">{total} 🥩</span>
              </div>
              <div className="mt-1 flex items-center justify-between text-[13px]">
                <span className="text-zinc-400">應付金額</span>
                <span className="text-white font-semibold">NT$ {pkg.price}</span>
              </div>
              <div className="mt-2 flex items-start gap-1.5 text-[10px] text-zinc-500 leading-relaxed">
                <ShieldCheck size={11} className="text-zinc-400 shrink-0 mt-0.5" />
                <span>透過 App Store / Google Play 安全結帳 · 7 日內可申請退款</span>
              </div>
            </div>

            {/* CTA */}
            <div className="mt-4 grid grid-cols-[1fr_1.6fr] gap-2">
              <button onClick={onClose} className="rounded-xl py-3 text-[13px] hairline border-zinc-700 text-zinc-300">
                取消
              </button>
              <button onClick={confirm}
                className="rounded-xl py-3 text-[13px] font-semibold bg-white text-black flex items-center justify-center gap-1.5">
                確認購買 · NT$ {pkg.price}
              </button>
            </div>
            <div className="mt-3 text-center mono text-[10px] tracking-[0.2em] uppercase text-zinc-600">
              prototype · no real charge
            </div>
          </>
        )}
      </div>
    </div>
  );
}

window.TopUpModal = TopUpModal;
