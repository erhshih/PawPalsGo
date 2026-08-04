import { describe, it, expect, beforeEach } from 'vitest';
import { useDiscoverPrefs } from '../stores/discoverPrefs';

// 每個測試前把 store 重置到初始狀態，避免測試互相影響
beforeEach(() => {
  useDiscoverPrefs.setState({
    radius: 50,
    showMore: true,
    genderFilter: ['男性', '女性', '多元性別'],
    roleFilter: null,
  });
});

describe('useDiscoverPrefs store', () => {
  it('初始值：radius 預設 50', () => {
    const { radius } = useDiscoverPrefs.getState();
    expect(radius).toBe(50);
  });

  it('setRadius 可以更新半徑', () => {
    useDiscoverPrefs.getState().setRadius(20);
    expect(useDiscoverPrefs.getState().radius).toBe(20);
  });

  it('toggleGender：取消已選的性別', () => {
    useDiscoverPrefs.getState().toggleGender('男性');
    const { genderFilter } = useDiscoverPrefs.getState();
    expect(genderFilter).not.toContain('男性');
    expect(genderFilter).toContain('女性');
  });

  it('toggleGender：加入未選的性別', () => {
    useDiscoverPrefs.setState({ genderFilter: [] });
    useDiscoverPrefs.getState().toggleGender('女性');
    expect(useDiscoverPrefs.getState().genderFilter).toContain('女性');
  });

  it('getGenderParam：全選時回傳 undefined（不需要篩選）', () => {
    const param = useDiscoverPrefs.getState().getGenderParam();
    expect(param).toBeUndefined();
  });

  it('getGenderParam：只選男性時回傳 MALE', () => {
    useDiscoverPrefs.setState({ genderFilter: ['男性'] });
    expect(useDiscoverPrefs.getState().getGenderParam()).toBe('MALE');
  });

  it('setRoleFilter 可以設定角色篩選', () => {
    useDiscoverPrefs.getState().setRoleFilter('OWNER');
    expect(useDiscoverPrefs.getState().roleFilter).toBe('OWNER');
  });
});
