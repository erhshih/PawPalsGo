'use client';
import { useEffect, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { api } from '@/lib/api';
import { useAuthStore } from '@/stores/auth';
import { useWalletStore } from '@/stores/wallet';
import { WalletDto, Gender, UserDto, WALLET_PACKAGES } from '@pawpals/shared';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { toast } from 'sonner';
import { LogOut, Beef, ChevronRight, X, Check, Camera, Settings, PenLine, User, Gift } from 'lucide-react';

const API_URL = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001';

const INTERESTS = [
  { key: '貓咪', emoji: '🐱' }, { key: '狗狗', emoji: '🐶' }, { key: '兔子', emoji: '🐰' },
  { key: '倉鼠', emoji: '🐹' }, { key: '鳥類', emoji: '🐦' }, { key: '爬蟲', emoji: '🦎' },
  { key: '露營', emoji: '⛺' }, { key: '健行', emoji: '🥾' }, { key: '瑜珈', emoji: '🧘' },
  { key: '跑步', emoji: '🏃' }, { key: '游泳', emoji: '🏊' }, { key: '騎車', emoji: '🚴' },
  { key: '旅行', emoji: '✈️' }, { key: '攝影', emoji: '📸' }, { key: '烹飪', emoji: '🍳' },
  { key: '美食', emoji: '🍜' }, { key: '咖啡', emoji: '☕' }, { key: '音樂', emoji: '🎵' },
  { key: '電影', emoji: '🎬' }, { key: '閱讀', emoji: '📚' }, { key: '設計', emoji: '🎨' },
  { key: '電玩', emoji: '🎮' }, { key: '動漫', emoji: '🎌' }, { key: '桌遊', emoji: '♟️' },
  { key: '志工', emoji: '🤝' }, { key: '健身', emoji: '💪' }, { key: '戶外', emoji: '🌿' },
  { key: '公益', emoji: '💚' }, { key: '寵物美容', emoji: '✂️' }, { key: '動物訓練', emoji: '🦮' },
];
const ZODIACS = ['牡羊座', '金牛座', '雙子座', '巨蟹座', '獅子座', '處女座', '天秤座', '天蠍座', '射手座', '摩羯座', '水瓶座', '雙魚座'];
const EDUCATIONS = ['高中', '大學', '碩士', '博士', '其他'];
const GENDERS: { key: Gender; label: string }[] = [
  { key: 'MALE', label: '男' }, { key: 'FEMALE', label: '女' }, { key: 'OTHER', label: '其他' },
];

type FieldKey = 'name' | 'bio' | 'passions' | 'gender' | 'zodiac' | 'city' | 'jobTitle' | 'company' | 'school' | 'education' | 'height';

// ── FieldSheet ─────────────────────────────────────────────────────────────────
function FieldSheet({
  open, title, onClose, onSave, children,
}: {
  open: boolean; title: string; onClose: () => void; onSave: () => void; children: React.ReactNode;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/70" onClick={onClose}>
      <div className="w-full max-w-lg bg-zinc-900 rounded-t-3xl" onClick={(e) => e.stopPropagation()}>
        <div className="mx-auto mt-3 mb-1 h-1 w-10 rounded-full bg-zinc-700" />
        <div className="flex items-center justify-between px-5 py-3 border-b border-zinc-800">
          <button onClick={onClose} className="p-1 text-zinc-500 hover:text-zinc-300">
            <X size={18} />
          </button>
          <span className="text-sm font-semibold text-white">{title}</span>
          <button onClick={onSave} className="p-1 text-zinc-300 hover:text-white">
            <Check size={18} />
          </button>
        </div>
        <div className="p-5 pb-8">{children}</div>
      </div>
    </div>
  );
}

// ── InfoRow ────────────────────────────────────────────────────────────────────
function InfoRow({ emoji, label, value, onClick }: { emoji: string; label: string; value: string; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="w-full flex items-center gap-4 py-3.5 px-0 border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors group"
    >
      <span className="text-xl w-6 text-center shrink-0">{emoji}</span>
      <div className="flex-1 text-left">
        <p className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">{label}</p>
        <p className={`text-sm mt-0.5 ${value ? 'text-white' : 'text-zinc-600'}`}>{value || '新增'}</p>
      </div>
      <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-500 shrink-0" />
    </button>
  );
}

// ── ChipPicker ─────────────────────────────────────────────────────────────────
function ChipPicker({
  options, selected, onToggle, single,
}: {
  options: string[]; selected: string | string[]; onToggle: (v: string) => void; single?: boolean;
}) {
  const isSelected = (v: string) => single ? selected === v : (selected as string[]).includes(v);
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((opt) => (
        <button
          key={opt}
          type="button"
          onClick={() => onToggle(opt)}
          className={`rounded-full px-4 py-1.5 text-sm font-medium border transition-colors ${
            isSelected(opt)
              ? 'bg-white text-black border-white'
              : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
          }`}
        >
          {opt}
        </button>
      ))}
    </div>
  );
}

// ══════════════════════════════════════════════════════════════════════════════
export default function ProfilePage() {
  const router = useRouter();
  const { role, clearTokens } = useAuthStore();
  const { balance, setBalance, addBalance } = useWalletStore();
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);
  const [stats, setStats] = useState({ matches: 0, messages: 0 });

  // field states
  const [email, setEmail] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [bio, setBio] = useState('');
  const [interests, setInterests] = useState<string[]>([]);
  const [gender, setGender] = useState<Gender | null>(null);
  const [city, setCity] = useState('');
  const [zodiac, setZodiac] = useState('');
  const [jobTitle, setJobTitle] = useState('');
  const [company, setCompany] = useState('');
  const [school, setSchool] = useState('');
  const [education, setEducation] = useState('');
  const [height, setHeight] = useState('');
  const [avatarUrl, setAvatarUrl] = useState('');

  // active sheet + temp state
  const [activeField, setActiveField] = useState<FieldKey | null>(null);
  const [nameError, setNameError] = useState(false);
  const [tmpText, setTmpText] = useState('');
  const [tmpGender, setTmpGender] = useState<Gender | null>(null);
  const [tmpZodiac, setTmpZodiac] = useState('');
  const [tmpEdu, setTmpEdu] = useState('');
  const [tmpInterests, setTmpInterests] = useState<string[]>([]);

  useEffect(() => {
    api.get<WalletDto>('/wallet').then(({ data }) => setBalance(data.balance)).catch(() => {});
    api.get<{ matches: number; messages: number }>('/users/me/stats').then(({ data }) => setStats(data)).catch(() => {});
    api.get<UserDto>('/users/me').then(({ data }) => {
      setEmail(data.email);
      setDisplayName(data.displayName ?? '');
      setBio(data.bio ?? '');
      setInterests(data.interests ?? []);
      setGender(data.gender ?? null);
      setCity(data.city ?? '');
      setZodiac(data.zodiac ?? '');
      setJobTitle(data.jobTitle ?? '');
      setCompany(data.company ?? '');
      setSchool(data.school ?? '');
      setEducation(data.education ?? '');
      setHeight(data.height ? String(data.height) : '');
      setAvatarUrl(data.avatarUrl ?? '');
    }).catch(() => {});
  }, []);

  function open(field: FieldKey) {
    setActiveField(field);
    if (field === 'name') setTmpText(displayName);
    else if (field === 'bio') setTmpText(bio);
    else if (field === 'city') setTmpText(city);
    else if (field === 'jobTitle') setTmpText(jobTitle);
    else if (field === 'company') setTmpText(company);
    else if (field === 'school') setTmpText(school);
    else if (field === 'height') setTmpText(height);
    else if (field === 'gender') setTmpGender(gender);
    else if (field === 'zodiac') setTmpZodiac(zodiac);
    else if (field === 'education') setTmpEdu(education);
    else if (field === 'passions') setTmpInterests([...interests]);
  }

  function commit() {
    if (activeField === 'name') { setDisplayName(tmpText.trim()); if (tmpText.trim()) setNameError(false); }
    else if (activeField === 'bio') setBio(tmpText.trim());
    else if (activeField === 'city') setCity(tmpText.trim());
    else if (activeField === 'jobTitle') setJobTitle(tmpText.trim());
    else if (activeField === 'company') setCompany(tmpText.trim());
    else if (activeField === 'school') setSchool(tmpText.trim());
    else if (activeField === 'height') setHeight(tmpText.trim());
    else if (activeField === 'gender') setGender(tmpGender);
    else if (activeField === 'zodiac') setZodiac(tmpZodiac);
    else if (activeField === 'education') setEducation(tmpEdu);
    else if (activeField === 'passions') setInterests(tmpInterests);
    setActiveField(null);
  }

  async function uploadPhoto(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const form = new FormData();
      form.append('file', file);
      const { data } = await api.post<{ avatarUrl: string }>('/users/me/avatar', form);
      setAvatarUrl(data.avatarUrl);
      toast.success('照片已更新');
    } catch { toast.error('上傳失敗'); }
    finally { setUploading(false); if (fileRef.current) fileRef.current.value = ''; }
  }

  function parseApiError(err: any): string {
    const msg = err?.response?.data?.message;
    if (Array.isArray(msg) && msg.length > 0) {
      const m: string = msg[0];
      if (/shorter than|maxLength/.test(m)) return '有欄位超過長度限制';
      if (/isEnum/.test(m)) return '有欄位選項不正確';
      if (/isArray|isString/.test(m)) return '格式錯誤，請重新填寫';
      return m;
    }
    if (typeof msg === 'string') return msg;
    return '儲存失敗，請稍後再試';
  }

  async function save() {
    if (!displayName.trim()) {
      setNameError(true);
      toast.error('請填寫顯示名稱（必填）');
      return;
    }
    setNameError(false);
    setSaving(true);
    try {
      const body: Record<string, unknown> = { displayName: displayName.trim() };
      if (interests.length > 0) body.interests = interests;
      if (bio.trim()) body.bio = bio.trim();
      if (gender) body.gender = gender;
      if (city.trim()) body.city = city.trim();
      if (zodiac) body.zodiac = zodiac;
      if (jobTitle.trim()) body.jobTitle = jobTitle.trim();
      if (company.trim()) body.company = company.trim();
      if (school.trim()) body.school = school.trim();
      if (education) body.education = education;
      const h = parseInt(height, 10);
      if (!isNaN(h) && h >= 100 && h <= 250) body.height = h;
      await api.patch('/users/me', body);
      toast.success('資料已儲存');
    } catch (err: any) {
      toast.error(parseApiError(err));
    } finally {
      setSaving(false);
    }
  }

  async function topup(packageId: string) {
    try {
      const { data } = await api.post<{ added: number; newBalance: number }>('/wallet/topup', { packageId });
      addBalance(data.added);
      toast.success(`已儲值 ${data.added} 塊肉乾！`);
    } catch { toast.error('儲值失敗'); }
  }

  function logout() {
    api.post('/auth/logout').catch(() => {});
    clearTokens();
    router.push('/login');
  }

  const photoSrc = avatarUrl ? (avatarUrl.startsWith('http') ? avatarUrl : `${API_URL}${avatarUrl}`) : null;
  const genderLabel = gender === 'MALE' ? '男' : gender === 'FEMALE' ? '女' : gender === 'OTHER' ? '其他' : '';

  // Profile completion
  const completionChecks = [
    { done: !!avatarUrl, label: '上傳個人照片', hint: '加上照片，配對率提高 25%。' },
    { done: !!displayName, label: '新增顯示名稱', hint: '讓其他人認識你。' },
    { done: !!bio, label: '新增個人簡介', hint: '分享你的故事。' },
    { done: interests.length > 0, label: '新增你的興趣', hint: '分享你的興趣所在。' },
    { done: !!zodiac, label: '新增星座', hint: '幫助更多人找到你。' },
    { done: !!city, label: '新增居住城市', hint: '讓附近的人更容易發現你。' },
  ];
  const pct = Math.round((completionChecks.filter((c) => c.done).length / completionChecks.length) * 100);
  const missing = completionChecks.filter((c) => !c.done);

  return (
    <div className="max-w-lg mx-auto pt-4 px-5 pb-12">

      {/* ── Tinder-style header: avatar(left→edit) + gear(right→settings) ── */}
      <div className="flex items-center justify-between mb-4">
        {/* Left: avatar + name + 編輯檔案 */}
        <div className="flex items-center gap-4">
          <div className="relative shrink-0">
            {photoSrc
              ? <img src={photoSrc} alt="" className="w-16 h-16 rounded-full object-cover border-2 border-zinc-700" />
              : <div className="w-16 h-16 rounded-full bg-zinc-800 flex items-center justify-center border-2 border-zinc-700"><User size={26} className="text-zinc-600" /></div>
            }
            <div className="absolute bottom-0 right-0 bg-white rounded-full p-1 border-2 border-zinc-950">
              <PenLine size={9} className="text-black" />
            </div>
          </div>
          <div>
            <p className="text-white text-lg font-bold leading-tight">{displayName || email.split('@')[0]}</p>
            <span className="mt-1.5 inline-block bg-white text-black text-xs font-bold rounded-full px-3 py-1">編輯檔案</span>
          </div>
        </div>
        {/* Right: gear → settings */}
        <button
          onClick={() => router.push('/profile/settings')}
          className="w-10 h-10 rounded-full bg-zinc-800 border border-zinc-700 flex items-center justify-center hover:bg-zinc-700 transition-colors"
        >
          <Settings size={17} className="text-zinc-300" />
        </button>
      </div>

      {/* ── Progress bar ── */}
      <div className="mb-4">
        <div className="flex items-center gap-2">
          <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
            <div className="h-full bg-orange-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
          </div>
          <span className="text-orange-500 text-xs font-bold w-8 text-right">{pct}%</span>
        </div>
        <p className="text-zinc-500 text-xs mt-1.5">完成你的檔案，讓更多毛孩找到你！</p>
      </div>

      {/* ── Missing items ── */}
      {missing.slice(0, 3).map((item) => (
        <div key={item.label} className="flex items-center gap-3 bg-zinc-900 rounded-xl p-3 mb-2 border border-zinc-800">
          <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center shrink-0">
            <div className="w-2.5 h-2.5 rounded-full border border-zinc-600" />
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-white text-sm font-medium">{item.label}</p>
            <p className="text-zinc-500 text-xs mt-0.5">{item.hint}</p>
          </div>
          <ChevronRight size={14} className="text-zinc-700 shrink-0" />
        </div>
      ))}

      {missing.length > 0 && <div className="mb-2" />}

      {/* ── Save button ── */}
      <div className="flex justify-end mb-6">
        <Button
          onClick={save}
          disabled={saving}
          className="rounded-2xl bg-white text-black hover:bg-zinc-100 text-sm h-8 px-5 font-semibold"
        >
          {saving ? '儲存中…' : '儲存'}
        </Button>
      </div>

      {/* ── Photo Grid (Tinder layout) ── */}
      {/* Row 1: big left (2/3) + 2 stacked small right (1/3) */}
      <div className="flex gap-1">
        {/* Big slot */}
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          className="relative rounded-xl overflow-hidden bg-zinc-900 border border-zinc-800 group"
          style={{ width: '66%', aspectRatio: '3/4' }}
        >
          {photoSrc
            ? <img src={photoSrc} alt="" className="w-full h-full object-cover" />
            : <div className="w-full h-full flex flex-col items-center justify-center gap-1.5 text-zinc-600">
                <Camera size={24} strokeWidth={1.5} />
                <span className="text-xs">新增照片</span>
              </div>}
          <div className="absolute inset-0 bg-black/0 group-hover:bg-black/20 transition-colors" />
          {photoSrc && (
            <div className="absolute bottom-2 right-2 rounded-full bg-white p-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
              <Camera size={11} className="text-black" />
            </div>
          )}
          {uploading && (
            <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
              <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </button>
        <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={uploadPhoto} />

        {/* Right column: 2 stacked small slots */}
        <div className="flex flex-col gap-1" style={{ width: '34%' }}>
          {[0, 1].map((i) => (
            <button
              key={i}
              type="button"
              onClick={() => toast.info('多張照片功能即將推出')}
              className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
            >
              <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center">
                <span className="text-zinc-600 text-lg leading-none">+</span>
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Row 2: 3 equal square slots */}
      <div className="flex gap-1 mt-1">
        {[0, 1, 2].map((i) => (
          <button
            key={i}
            type="button"
            onClick={() => toast.info('多張照片功能即將推出')}
            className="flex-1 rounded-xl bg-zinc-900 border border-zinc-800 flex items-center justify-center hover:bg-zinc-800 transition-colors"
            style={{ aspectRatio: '1' }}
          >
            <div className="w-6 h-6 rounded-full border border-zinc-700 flex items-center justify-center">
              <span className="text-zinc-600 text-lg leading-none">+</span>
            </div>
          </button>
        ))}
      </div>

      {/* ── Name ── */}
      <div className="mt-6">
        <div className="flex items-center justify-between mb-1.5">
          <label className={`font-mono text-[9px] tracking-widest uppercase ${nameError ? 'text-red-500' : 'text-zinc-500'}`}>
            顯示名稱
          </label>
          {nameError && <span className="text-xs text-red-500 font-medium">必填</span>}
        </div>
        <button
          type="button"
          onClick={() => open('name')}
          className={`w-full text-left pb-2 border-b flex items-center justify-between group ${nameError ? 'border-red-600' : 'border-zinc-800'}`}
        >
          <span className={`text-base ${displayName ? 'text-white' : nameError ? 'text-red-900' : 'text-zinc-600'}`}>
            {displayName || '輸入你的名稱'}
          </span>
          <ChevronRight size={15} className={nameError ? 'text-red-700' : 'text-zinc-700 group-hover:text-zinc-500'} />
        </button>
        {nameError && <p className="mt-1.5 text-xs text-red-500">請填寫名稱才能儲存個人資料</p>}
      </div>

      {/* ── Divider ── */}
      <Separator className="my-5 bg-zinc-800" />

      {/* ── About Me ── */}
      <div>
        <label className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">關於我</label>
        <button
          type="button"
          onClick={() => open('bio')}
          className="w-full text-left mt-2 group"
        >
          <div className="flex items-start justify-between gap-2">
            <p className={`text-sm leading-relaxed ${bio ? 'text-white' : 'text-zinc-600'}`}>
              {bio || '介紹你自己（或你的毛孩）…'}
            </p>
            <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-500 shrink-0 mt-0.5" />
          </div>
        </button>
      </div>

      {/* ── Divider ── */}
      <Separator className="my-5 bg-zinc-800" />

      {/* ── Passions ── */}
      <div>
        <div className="flex items-center justify-between mb-3">
          <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">興趣</span>
          <button type="button" onClick={() => open('passions')} className="text-xs text-zinc-400 hover:text-zinc-200 underline">
            編輯
          </button>
        </div>
        {interests.length === 0 ? (
          <button
            type="button"
            onClick={() => open('passions')}
            className="w-full rounded-xl border border-dashed border-zinc-800 py-4 text-zinc-600 text-sm hover:border-zinc-700 transition-colors"
          >
            新增你的興趣
          </button>
        ) : (
          <div className="flex flex-wrap gap-2">
            {interests.map((tag) => {
              const item = INTERESTS.find((i) => i.key === tag);
              return (
                <span key={tag} className="flex items-center gap-1.5 rounded-full border border-zinc-700 px-3 py-1 text-sm text-zinc-300">
                  {item && <span>{item.emoji}</span>}
                  {tag}
                </span>
              );
            })}
          </div>
        )}
      </div>

      {/* ── Block divider ── */}
      <div className="my-5 -mx-5 h-2 bg-zinc-900" />

      {/* ── Info rows ── */}
      <InfoRow emoji="⚧" label="性別" value={genderLabel} onClick={() => open('gender')} />
      <InfoRow emoji="✨" label="星座" value={zodiac} onClick={() => open('zodiac')} />
      <InfoRow emoji="📏" label="身高" value={height ? `${height} cm` : ''} onClick={() => open('height')} />
      <InfoRow emoji="📍" label="居住城市" value={city} onClick={() => open('city')} />
      <InfoRow emoji="🌐" label="我會的語言" value="" onClick={() => toast.info('功能即將推出')} />

      <div className="mt-5 mb-2">
        <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">工作與教育</span>
      </div>
      <InfoRow emoji="🏷️" label="職稱" value={jobTitle} onClick={() => open('jobTitle')} />
      <InfoRow emoji="💼" label="公司" value={company} onClick={() => open('company')} />
      <InfoRow emoji="🎓" label="學校" value={school} onClick={() => open('school')} />
      <InfoRow emoji="📚" label="教育程度" value={education} onClick={() => open('education')} />

      <div className="my-5 -mx-5 h-2 bg-zinc-900" />

      <div className="mb-3">
        <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">歡迎跟我聊</span>
      </div>
      {['外出社交', '我的週末行程', '我 + 手機'].map((prompt) => (
        <button
          key={prompt}
          type="button"
          onClick={() => toast.info('功能即將推出')}
          className="w-full flex items-center justify-between py-3.5 px-0 border-b border-zinc-800/60 hover:bg-zinc-900/40 transition-colors group"
        >
          <div className="text-left">
            <p className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">{prompt}</p>
            <p className="text-sm mt-0.5 text-zinc-600">新增小測驗</p>
          </div>
          <ChevronRight size={15} className="text-zinc-700 group-hover:text-zinc-500 shrink-0" />
        </button>
      ))}

      {/* ── Stats ── */}
      <div className="my-5 -mx-5 h-2 bg-zinc-900" />
      <div className="grid grid-cols-2 gap-2 mb-5">
        {[{ k: '配對', v: stats.matches }, { k: '訊息', v: stats.messages }].map((s) => (
          <div key={s.k} className="rounded-xl border border-zinc-800 py-3 flex flex-col items-center bg-zinc-900/40">
            <span className="text-xl font-semibold text-white">{s.v}</span>
            <span className="mt-1 font-mono text-[9px] tracking-widest uppercase text-zinc-500">{s.k}</span>
          </div>
        ))}
      </div>

      {/* ── Wallet ── */}
      <div className="rounded-2xl border border-zinc-800 bg-zinc-900/40 p-5 mb-4">
        <div className="flex items-center gap-2 mb-3">
          <Beef size={14} className="text-white" />
          <span className="font-mono text-[9px] tracking-widest uppercase text-zinc-500">肉乾錢包</span>
        </div>
        <p className="text-2xl font-semibold mb-4">{balance} <span className="text-zinc-500 text-base font-normal">肉乾</span></p>
        <Separator className="mb-4 bg-zinc-800" />
        <div className="space-y-2">
          {WALLET_PACKAGES.map((pkg) => (
            <div key={pkg.id} className="flex items-center justify-between">
              <div>
                <span className="text-white text-sm font-medium">{pkg.jerky} 肉乾</span>
                <span className="text-zinc-500 text-xs ml-2">{pkg.price}</span>
              </div>
              <Button size="sm" className="rounded-xl bg-white text-black hover:bg-zinc-100 text-xs" onClick={() => topup(pkg.id)}>購買</Button>
            </div>
          ))}
        </div>
      </div>

      {/* ── Redemptions entry ── */}
      <Button
        variant="outline"
        className="w-full border-zinc-800 bg-zinc-900 text-white hover:bg-zinc-800 rounded-2xl mb-4"
        onClick={() => router.push('/redemptions')}
      >
        <Gift size={14} className="mr-2" />
        肉乾兌換好禮
      </Button>

      {/* ── Logout ── */}
      <Button variant="outline" className="w-full border-zinc-800 text-zinc-400 hover:text-white hover:bg-zinc-900 rounded-2xl" onClick={logout}>
        <LogOut size={14} className="mr-2" />
        登出
      </Button>

      {/* ── Field Sheets ── */}

      {/* Text fields */}
      {(['name', 'bio', 'city', 'jobTitle', 'company', 'school'] as FieldKey[]).map((f) => {
        const labels: Record<string, string> = { name: '顯示名稱', bio: '關於我', city: '居住城市', jobTitle: '職稱', company: '公司', school: '學校' };
        const multi = f === 'bio';
        return (
          <FieldSheet key={f} open={activeField === f} title={labels[f]} onClose={() => setActiveField(null)} onSave={commit}>
            {multi ? (
              <>
                <textarea
                  value={tmpText}
                  onChange={(e) => setTmpText(e.target.value)}
                  maxLength={300}
                  autoFocus
                  rows={5}
                  placeholder="介紹你自己（或你的毛孩）…"
                  className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white text-sm resize-none focus:outline-none placeholder:text-zinc-600"
                />
                <p className="text-right text-xs text-zinc-600 mt-1">{tmpText.length}/300</p>
              </>
            ) : (
              <input
                value={tmpText}
                onChange={(e) => setTmpText(e.target.value)}
                maxLength={50}
                autoFocus
                placeholder={`輸入${labels[f]}`}
                className="w-full bg-zinc-800 rounded-xl px-4 py-3 text-white text-sm focus:outline-none placeholder:text-zinc-600"
              />
            )}
          </FieldSheet>
        );
      })}

      {/* Gender */}
      <FieldSheet open={activeField === 'gender'} title="性別" onClose={() => setActiveField(null)} onSave={commit}>
        <div className="flex gap-2">
          {GENDERS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setTmpGender(key)}
              className={`flex-1 py-2.5 rounded-xl border text-sm font-semibold transition-colors ${
                tmpGender === key ? 'bg-white text-black border-white' : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
      </FieldSheet>

      {/* Zodiac */}
      <FieldSheet open={activeField === 'zodiac'} title="星座" onClose={() => setActiveField(null)} onSave={commit}>
        <ChipPicker single options={ZODIACS} selected={tmpZodiac} onToggle={(v) => setTmpZodiac(tmpZodiac === v ? '' : v)} />
      </FieldSheet>

      {/* Education */}
      <FieldSheet open={activeField === 'education'} title="教育程度" onClose={() => setActiveField(null)} onSave={commit}>
        <ChipPicker single options={EDUCATIONS} selected={tmpEdu} onToggle={(v) => setTmpEdu(tmpEdu === v ? '' : v)} />
      </FieldSheet>

      {/* Passions */}
      <FieldSheet open={activeField === 'passions'} title={`興趣（${tmpInterests.length}/5）`} onClose={() => setActiveField(null)} onSave={commit}>
        <div className="flex flex-wrap gap-2 max-h-64 overflow-y-auto">
          {INTERESTS.map(({ key, emoji }) => {
            const sel = tmpInterests.includes(key);
            const disabled = !sel && tmpInterests.length >= 5;
            return (
              <button
                key={key}
                type="button"
                onClick={() => setTmpInterests((prev) => prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key])}
                disabled={disabled}
                className={`flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium border transition-colors ${
                  sel ? 'bg-white text-black border-white'
                    : disabled ? 'border-zinc-800 text-zinc-600 cursor-not-allowed'
                    : 'border-zinc-700 text-zinc-300 hover:border-zinc-500'
                }`}
              >
                <span>{emoji}</span>
                <span>{key}</span>
              </button>
            );
          })}
        </div>
      </FieldSheet>

      {/* Height */}
      <FieldSheet open={activeField === 'height'} title="身高" onClose={() => setActiveField(null)} onSave={commit}>
        <div className="flex items-center gap-3">
          <input
            value={tmpText}
            onChange={(e) => setTmpText(e.target.value.replace(/[^0-9]/g, ''))}
            maxLength={3}
            autoFocus
            placeholder="例如 170"
            className="flex-1 bg-zinc-800 rounded-xl px-4 py-3 text-white text-xl text-center focus:outline-none placeholder:text-zinc-600"
          />
          <span className="text-zinc-500 text-base">cm</span>
        </div>
      </FieldSheet>
    </div>
  );
}
