// Chat & Go! escrow integration
const { useState: useStateC, useRef: useRefC, useEffect: useEffectC } = React;

function Chat({ balance, setBalance, onTopUp }) {
  const L = window.Lucide || {};
  const { Send, ChevronLeft, Camera, Plus, Beef } = L;
  const { ScheduleModal, ResultModal, CameraScan, MeetingCard, formatDt } = window.Meeting;
  const SEED = window.PawPals.SEED_CHAT;

  const [msgs, setMsgs] = useStateC(SEED);
  const [draft, setDraft] = useStateC("");
  const [meeting, setMeeting] = useStateC(null);   // { scheduledAt, status: 'scheduled'|'checkin'|'completed' }
  const [isInitiator, setIsInitiator] = useStateC(true);
  const [showSchedule, setShowSchedule] = useStateC(false);
  const [showCamera, setShowCamera] = useStateC(false);
  const [result, setResult] = useStateC(null);     // { kind, message }
  const endRef = useRefC(null);

  useEffectC(() => {
    endRef.current?.parentElement?.scrollTo({ top: 999999, behavior: "smooth" });
  }, [msgs.length, meeting?.status]);

  function nowStr() {
    const n = new Date();
    return `${String(n.getHours()).padStart(2,"0")}:${String(n.getMinutes()).padStart(2,"0")}`;
  }

  function sysMsg(text) {
    return { id: Date.now() + Math.random(), from: "sys", text, time: nowStr() };
  }

  function send() {
    const t = draft.trim();
    if (!t) return;
    setMsgs((m) => [...m, { id: Date.now(), from: "me", text: t, time: nowStr() }]);
    setDraft("");
    setTimeout(() => {
      const replies = ["好喔！👌", "那我們約老地方？", "Mochi 一定很開心", "拍照記得帶我家的", "+1"];
      const r = replies[Math.floor(Math.random() * replies.length)];
      setMsgs((m) => [...m, { id: Date.now()+1, from: "them", text: r, time: nowStr() }]);
    }, 900);
  }

  // ── Meeting handlers ───────────────────────────────────────────
  function startMeeting(dt) {
    if (balance < 5) return;
    setBalance((b) => b - 5);
    setMeeting({ scheduledAt: dt, status: "scheduled" });
    setShowSchedule(false);
    setMsgs((m) => [...m, sysMsg(`Go! 約會已建立 · ${formatDt(dt)} · 5 🥩 已託管於平台`)]);
  }

  function cancel(kind) {
    if (kind === "good") {
      setBalance((b) => b + 5);
      setResult({
        kind: "refund",
        message: "屬於良性取消，5 塊肉乾已 100% 全額退回您的錢包 🥩。期待下次相約。",
      });
      setMsgs((m) => [...m, sysMsg("約會已取消 · 良性取消 · 5 🥩 已全額退回")]);
    } else {
      setResult({
        kind: "penalty",
        message: "距離約定時間不足 2 小時！5 塊肉乾已被沒收，並作為放鳥補償強制撥給對方。",
      });
      setMsgs((m) => [...m, sysMsg("約會已取消 · 惡意放鳥 · 5 🥩 已撥付對方作為補償")]);
    }
    setMeeting(null);
  }

  function jumpToCheckin() {
    setMeeting((m) => ({ ...m, status: "checkin" }));
    setMsgs((mm) => [...mm, sysMsg("已到簽到時間 · 雙方請完成 QR 驗證")]);
  }

  function onScanInit() { setShowCamera(true); }

  function onScanned() {
    setShowCamera(false);
    setMeeting((m) => (m ? { ...m, status: "completed" } : m));
    setResult({
      kind: "success",
      message: "驗證成功（PostGIS 空間解鎖過關）！託管的 5 塊肉乾已安全撥入非發起者的錢包 🐾",
    });
    setMsgs((mm) => [...mm, sysMsg("簽到成功 · PostGIS 解鎖 · 5 🥩 已撥入接受方錢包")]);
  }

  function reset() {
    setMeeting(null);
    setIsInitiator(true);
  }

  return (
    <div className="anim-fadeIn h-full w-full flex flex-col bg-zinc-950 text-white">
      {/* Header */}
      <div className="px-4 pt-3 pb-3 flex items-center gap-3 hairline border-b border-zinc-800">
        <button className="p-1.5 -ml-1 text-zinc-300"><ChevronLeft size={18} /></button>
        <div className="h-9 w-9 rounded-full overflow-hidden hairline border-zinc-700 shrink-0">
          <img src="https://images.unsplash.com/photo-1583511655802-41f1c4f1a3e4?w=200&q=80" alt="" className="w-full h-full object-cover" />
        </div>
        <div className="flex-1 min-w-0">
          <div className="text-[14px] font-semibold leading-tight truncate">Mochi &amp; 嘉嘉</div>
          <div className="mono text-[10px] tracking-[0.18em] uppercase text-zinc-500">online · 大安區</div>
        </div>
        <button onClick={onTopUp}
          className="hairline border-zinc-800 rounded-full pl-2 pr-1 py-1 mono text-[10px] tracking-[0.2em] uppercase text-zinc-200 flex items-center gap-1.5 active:scale-95 transition">
          <Beef size={11} /> {balance}
          <span className="ml-0.5 rounded-full bg-white text-black w-4 h-4 flex items-center justify-center">
            <Plus size={9} strokeWidth={3} />
          </span>
        </button>
      </div>

      {/* Meeting card */}
      <div className="px-4 pt-3">
        <MeetingCard
          meeting={meeting}
          isInitiator={isInitiator}
          setIsInitiator={setIsInitiator}
          onStart={() => setShowSchedule(true)}
          onCancel={cancel}
          onJumpToCheckin={jumpToCheckin}
          onScanInit={onScanInit}
          onReset={reset}
        />
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto no-scrollbar px-4 py-4 space-y-2">
        <div className="text-center mono text-[10px] tracking-[0.2em] uppercase text-zinc-600 py-2">
          — TODAY · 14:00 —
        </div>
        {msgs.map((m) => <Bubble key={m.id} m={m} />)}
        <div ref={endRef} />
      </div>

      {/* Composer */}
      <div className="px-3 pb-4 pt-2 hairline border-t border-zinc-800 bg-zinc-950">
        <div className="flex items-center gap-2">
          <button className="h-10 w-10 rounded-full hairline border-zinc-800 flex items-center justify-center text-zinc-300 shrink-0">
            <Plus size={16} />
          </button>
          <div className="flex-1 hairline border-zinc-800 rounded-full px-4 py-2.5 flex items-center gap-2 bg-zinc-900/60">
            <input
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") send(); }}
              placeholder="傳訊息給 Mochi…"
              className="flex-1 bg-transparent outline-none text-[14px] placeholder:text-zinc-600"
            />
            <button className="text-zinc-500"><Camera size={16} /></button>
          </div>
          <button onClick={send} disabled={!draft.trim()}
            className={`h-10 w-10 rounded-full flex items-center justify-center shrink-0 transition
              ${draft.trim() ? "bg-white text-black" : "bg-zinc-800 text-zinc-600"}`}>
            <Send size={15} />
          </button>
        </div>
      </div>

      {/* Modals */}
      <ScheduleModal open={showSchedule} balance={balance} onClose={() => setShowSchedule(false)} onConfirm={startMeeting} />
      <ResultModal open={!!result} kind={result?.kind} message={result?.message} onClose={() => setResult(null)} />
      <CameraScan open={showCamera} onClose={() => setShowCamera(false)} onScanned={onScanned} />
    </div>
  );
}

function Bubble({ m }) {
  if (m.from === "sys") {
    return (
      <div className="anim-fadeIn flex justify-center">
        <div className="mono text-[10px] tracking-[0.18em] uppercase text-zinc-500 hairline border-zinc-800 rounded-full px-3 py-1 bg-zinc-900/50 max-w-[85%] text-center leading-relaxed">
          {m.text}
        </div>
      </div>
    );
  }
  const me = m.from === "me";
  return (
    <div className={`flex ${me ? "justify-end" : "justify-start"} anim-fadeIn`}>
      <div className="max-w-[78%]">
        <div className={`px-3.5 py-2.5 text-[14px] leading-snug rounded-2xl
          ${me ? "bg-white text-black rounded-br-md" : "bg-zinc-900 text-white hairline border-zinc-800 rounded-bl-md"}`}>
          {m.text}
        </div>
        <div className={`mono text-[9px] tracking-[0.15em] uppercase mt-1 ${me ? "text-right text-zinc-600" : "text-zinc-600"}`}>
          {m.time}
        </div>
      </div>
    </div>
  );
}

window.Chat = Chat;
