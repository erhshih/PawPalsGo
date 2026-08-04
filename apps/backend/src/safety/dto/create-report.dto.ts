import { IsEnum, IsOptional, IsString, IsUUID, MaxLength } from 'class-validator';

const REPORT_REASONS = ['HARASSMENT', 'FAKE_PROFILE', 'INAPPROPRIATE_CONTENT', 'SCAM', 'SPAM', 'OTHER'] as const;

export class CreateReportDto {
  @IsUUID()
  targetId: string;

  @IsEnum(REPORT_REASONS)
  reason: (typeof REPORT_REASONS)[number];

  @IsOptional()
  @IsString()
  @MaxLength(500)
  detail?: string;

  @IsOptional()
  @IsUUID()
  postId?: string;
}
