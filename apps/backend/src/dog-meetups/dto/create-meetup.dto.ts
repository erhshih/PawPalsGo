import {
  IsDateString,
  IsInt,
  IsLatitude,
  IsLongitude,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

export class CreateMeetupDto {
  @IsString()
  @MaxLength(60)
  title: string;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  description?: string;

  @IsString()
  @MaxLength(100)
  location: string;

  @IsOptional()
  @IsLatitude()
  latitude?: number;

  @IsOptional()
  @IsLongitude()
  longitude?: number;

  @IsDateString()
  scheduledAt: string;

  @IsOptional()
  @IsInt()
  @Min(2)
  @Max(100)
  maxAttendees?: number;
}
