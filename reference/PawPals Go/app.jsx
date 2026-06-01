// App shell — phone frame + bottom tab nav + tab switching
const { useState: useStateA, useEffect: useEffectA } = React;

function PhoneFrame({ children }) {
  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-black p-4 sm:p-8">
      {/* device */}
      <div className="relative w-[390px] h-[844px] max-h-[calc(100vh-32px)] rounded-[54px] bg-zinc-950 hairline border-zinc-800 shadow-[0_40px_120px_rgba(0,0,0,0.6)] overflow-hidden">
        {/* notch */}
        <div className="absolute top-2 left-1/2 -translate-x-1/2 w-[112px] h-[30px] rounded-full bg-black z-50 flex items-center justify-end px-3">
          <div className="h-2 w-2 rounded-full bg-zinc-800" />
        </div>
        {/* status bar */}
        <div className="absolute top-0 left-0 right-0 h-[44px] flex items-end justify-between px-7 pb-1.5 text-[12px] mono z-40 text-white">
          <span>9:41</span>
          <span className="opacity-80">●●● 5G ▮</span>
        </div>
        <div className="absolute inset-0 pt-[44px] flex flex-col">
          {children}
        </div>
        {/* home indicator */}
        <div className="absolute bottom-2 left-1/2 -translate-x-1/2 w-[120px] h-[5px] rounded-full bg-zinc-700 z-40" />
      </div>
    </div>
  );
}

function TabBar({ tab, setTab, identity }) {
  const L = window.Lucide || {};
  const { Compass, MessageCircle, User } = L;
  const items = [
    { id: "swipe", label: "探索", icon: Compass },
    { id: "chat",  label: "訊息", icon: MessageCircle },
    { id: "me",    label: identity || "身份", icon: User },
  ];
  return (
    <div className="shrink-0 h-[78px] bg-zinc-950/95 backdrop-blur hairline border-t border-zinc-800 z-30">
      <div className="grid grid-cols-3 h-[60px]">
        {items.map((it) => {
          const active = tab === it.id;
          const Icon = it.icon || (() => null);
          return (
            <button
              key={it.id}
              onClick={() => setTab(it.id)}
              className="flex flex-col items-center justify-center gap-1 transition active:scale-95"
            >
              <Icon size={20} className={active ? "text-white" : "text-zinc-600"} strokeWidth={active ? 2 : 1.5} />
              <span className={`mono text-[9px] tracking-[0.2em] uppercase ${active ? "text-white" : "text-zinc-600"}`}>
                {it.label}
              </span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

function MePanel({ identity, balance, photos, onSwitch, onTopUp }) {
  const L = window.Lucide || {};
  const { Dog, Cat, ArrowRight, User, Beef, Plus } = L;
  const avatar = (photos?.self && photos.self[0]) || (photos?.withPet && photos.withPet[0]) || null;
  return (
    <div className="anim-fadeIn h-full w-full bg-zinc-950 text-white flex flex-col">
      <div className="px-5 pt-3 pb-4 flex items-center justify-between">
        <div className="text-[17px] font-semibold tracking-tight">身份</div>
        <button onClick={() => onSwitch(null)} className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-400 hairline border-zinc-800 rounded-full px-3 py-1">
          切換 ↺
        </button>
      </div>

      <div className="px-5">
        <div className="hairline border-zinc-800 rounded-2xl p-5 bg-zinc-900/40">
          <div className="flex items-start gap-4">
            <div className="h-16 w-16 rounded-full overflow-hidden hairline border-zinc-700 shrink-0 bg-zinc-900 flex items-center justify-center">
              {avatar
                ? <img src={avatar} alt="" className="w-full h-full object-cover" />
                : <User size={22} className="text-zinc-500" />}
            </div>
            <div className="flex-1 min-w-0">
              <div className="mono text-[10px] tracking-[0.2em] uppercase text-zinc-500">當前身份</div>
              <div className="mt-1 text-[28px] font-semibold leading-none tracking-tight">{identity}</div>
              <div className="mt-2 mono text-[10px] tracking-[0.18em] uppercase text-zinc-300 hairline border-zinc-700 rounded-full px-2 py-0.5 inline-block">
                ✓ 已驗證
              </div>
            </div>
          </div>
          <div className="mt-3 text-zinc-400 text-[13px] leading-relaxed">
            {identity === "OWNER"
              ? "你是飼主。為毛孩建立檔案，認識其他主人。"
              : "你是貓狗奴。瀏覽附近毛孩，投餵與相約。"}
          </div>
          <div className="mt-5 grid grid-cols-3 gap-2 text-center">
            {[
              { k: "配對", v: "12", action: null },
              { k: "訊息", v: "4", action: null },
              { k: "肉乾", v: String(balance), action: onTopUp },
            ].map((s) => {
              const Tag = s.action ? "button" : "div";
              return (
                <Tag key={s.k} onClick={s.action || undefined}
                  className={`hairline border-zinc-800 rounded-xl py-3 transition w-full
                    ${s.action ? "hover:border-white/50 active:scale-[0.98] relative" : ""}`}>
                  <div className="text-[20px] font-semibold leading-none">{s.v}</div>
                  <div className="mt-1 mono text-[9px] tracking-[0.2em] uppercase text-zinc-500">{s.k}</div>
                  {s.action && (
                    <div className="absolute top-1 right-1 rounded-full bg-white text-black p-0.5">
                      <Plus size={9} strokeWidth={3} />
                    </div>
                  )}
                </Tag>
              );
            })}
          </div>

          <button onClick={onTopUp}
            className="mt-3 w-full rounded-xl py-3 bg-white text-black text-[13px] font-semibold flex items-center justify-center gap-2 active:scale-[0.99] transition">
            <Beef size={14} /> 儲值肉乾 · 立即補貨
          </button>
        </div>
      </div>

      <div className="px-5 mt-4 space-y-2 text-[13px]">
        {["編輯毛孩檔案", "通知偏好", "封鎖名單", "關於 PawPals Go"].map((row) => (
          <button key={row} className="w-full hairline border-zinc-800 rounded-xl px-4 py-3.5 flex items-center justify-between bg-zinc-900/30">
            <span className="text-zinc-200">{row}</span>
            <ArrowRight size={14} className="text-zinc-600" />
          </button>
        ))}
      </div>

      <div className="mt-auto px-5 pb-5 mono text-[10px] tracking-[0.2em] uppercase text-zinc-700 text-center">
        prototype · static mock data · no backend
      </div>
    </div>
  );
}

function App() {
  const [ready, setReady] = useStateA(!!window.Lucide);
  const [identity, setIdentity] = useStateA(null);
  const [onboarded, setOnboarded] = useStateA(false);
  const [photos, setPhotos] = useStateA({});
  const [tab, setTab] = useStateA("swipe");
  const [balance, setBalance] = useStateA(27);
  const [showTopUp, setShowTopUp] = useStateA(false);

  function topUp(amount) { setBalance((b) => b + amount); }

  function pickIdentity(id) {
    setIdentity(id);
    setOnboarded(false);
    setPhotos({});
    setTab("swipe");
  }
  function finishOnboarding(p) {
    setPhotos(p);
    setOnboarded(true);
  }
  function resetIdentity() {
    setIdentity(null);
    setOnboarded(false);
    setPhotos({});
  }

  useEffectA(() => {
    if (ready) return;
    const onReady = () => setReady(true);
    window.addEventListener("lucide-ready", onReady);
    return () => window.removeEventListener("lucide-ready", onReady);
  }, [ready]);

  if (!ready) {
    return (
      <PhoneFrame>
        <div className="flex-1 flex items-center justify-center bg-zinc-950 mono text-[10px] tracking-[0.3em] uppercase text-zinc-600">
          loading…
        </div>
      </PhoneFrame>
    );
  }

  let screen;
  let showTabs = false;
  if (!identity) {
    screen = <Welcome onPick={pickIdentity} />;
  } else if (!onboarded) {
    screen = <Onboarding identity={identity} onBack={() => setIdentity(null)} onDone={finishOnboarding} />;
  } else if (tab === "swipe") {
    screen = <SwipeDeck identity={identity} />;
    showTabs = true;
  } else if (tab === "chat") {
    screen = <Chat balance={balance} setBalance={setBalance} onTopUp={() => setShowTopUp(true)} />;
    showTabs = true;
  } else if (tab === "me") {
    screen = <MePanel identity={identity} balance={balance} photos={photos} onSwitch={resetIdentity} onTopUp={() => setShowTopUp(true)} />;
    showTabs = true;
  }

  return (
    <PhoneFrame>
      <div className="flex-1 min-h-0 relative">
        {screen}
      </div>
      {showTabs && <TabBar tab={tab} setTab={setTab} identity={identity} />}
      <TopUpModal open={showTopUp} balance={balance} onClose={() => setShowTopUp(false)} onPurchase={topUp} />
    </PhoneFrame>
  );
}

const root = ReactDOM.createRoot(document.getElementById("root"));
root.render(<App />);
