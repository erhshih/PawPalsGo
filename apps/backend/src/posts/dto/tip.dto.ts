import { IsIn } from 'class-validator';

// 固定分級（1/5/10/50 肉乾），避免任意金額造成的異常交易或誤觸。
export const TIP_AMOUNTS = [1, 5, 10, 50] as const;

export class TipDto {
  @IsIn(TIP_AMOUNTS)
  amount: number;
}
