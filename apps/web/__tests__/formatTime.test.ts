import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';

// 從 chat 頁面抽出來的 formatTime 函數（測試前先把邏輯抽成獨立函數）
function formatTime(iso: string): string {
  const d = new Date(iso);
  const now = new Date();
  const sameDay = d.toDateString() === now.toDateString();
  const hhmm = d.toLocaleTimeString('zh-TW', {
    hour: '2-digit',
    minute: '2-digit',
    hour12: false,
  });
  return sameDay ? hhmm : `${d.getMonth() + 1}/${d.getDate()} ${hhmm}`;
}

describe('formatTime', () => {
  // 每個測試前，把「現在時間」固定住，讓測試結果穩定
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date('2026-06-04T10:00:00'));
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('同一天只顯示時間', () => {
    const result = formatTime('2026-06-04T08:30:00');
    expect(result).toBe('08:30');
  });

  it('不同天顯示日期加時間', () => {
    const result = formatTime('2026-06-03T08:30:00');
    expect(result).toBe('6/3 08:30');
  });

  it('跨月也能正確顯示', () => {
    const result = formatTime('2026-05-15T14:00:00');
    expect(result).toBe('5/15 14:00');
  });
});
