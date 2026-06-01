import { IsArray, IsDateString, IsOptional, IsString, MaxLength, ArrayMaxSize } from 'class-validator';

export class CreatePetDto {
  @IsString()
  name: string;

  @IsString()
  breed: string;

  @IsString()
  @MaxLength(140)
  bio: string;

  @IsArray()
  @IsString({ each: true })
  @ArrayMaxSize(5)
  tags: string[];

  @IsOptional()
  @IsDateString()
  birthDate?: string;
}
