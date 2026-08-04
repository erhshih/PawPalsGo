import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';

// 直接在測試檔裡寫一個簡單元件來學習，不需要import真實頁面
function MatchCard({ name, onChat }: { name: string; onChat: () => void }) {
  return (
    <div>
      <p>{name}</p>
      <button onClick={onChat}>開始聊天</button>
    </div>
  );
}

describe('MatchCard 元件', () => {
  it('顯示名字', () => {
    render(<MatchCard name="小花" onChat={() => {}} />);
    // screen.getByText 找不到就直接報錯 → 測試失敗
    expect(screen.getByText('小花')).toBeInTheDocument();
  });

  it('點按鈕會呼叫 onChat', async () => {
    // vi.fn() 建立一個「假函數」，可以追蹤它被呼叫幾次、傳了什麼參數
    const handleChat = vi.fn();

    render(<MatchCard name="小黑" onChat={handleChat} />);

    // userEvent 模擬真實使用者行為（比 fireEvent 更真實）
    await userEvent.click(screen.getByRole('button', { name: '開始聊天' }));

    expect(handleChat).toHaveBeenCalledTimes(1);
  });
});
