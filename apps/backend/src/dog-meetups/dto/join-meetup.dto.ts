import { IsOptional, IsUUID } from 'class-validator';

export class JoinMeetupDto {
  @IsOptional()
  @IsUUID()
  petId?: string;
}
