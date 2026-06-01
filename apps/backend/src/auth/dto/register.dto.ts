import { IsEmail, IsEnum, IsOptional, IsString, MinLength } from 'class-validator';

export class RegisterDto {
  @IsEmail()
  email: string;

  @IsString()
  @MinLength(8)
  password: string;

  @IsEnum(['OWNER', 'LOVER'])
  role: 'OWNER' | 'LOVER';

  @IsOptional()
  @IsEnum(['MALE', 'FEMALE', 'OTHER'])
  gender?: 'MALE' | 'FEMALE' | 'OTHER';
}
