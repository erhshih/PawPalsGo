import {
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreatePetDto } from './dto/create-pet.dto';
import * as fs from 'fs';
import * as path from 'path';

@Injectable()
export class PetsService {
  constructor(private prisma: PrismaService) {}

  async create(dto: CreatePetDto, ownerId: string) {
    return this.prisma.pet.create({
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
        ownerId,
      },
      include: { photos: true },
    });
  }

  async update(petId: string, dto: Partial<CreatePetDto>, userId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('PET_NOT_FOUND');
    if (pet.ownerId !== userId) throw new ForbiddenException();
    return this.prisma.pet.update({
      where: { id: petId },
      data: {
        ...dto,
        birthDate: dto.birthDate ? new Date(dto.birthDate) : undefined,
      },
      include: { photos: true },
    });
  }

  async findOne(petId: string) {
    const pet = await this.prisma.pet.findUnique({
      where: { id: petId },
      include: { photos: { orderBy: { sortOrder: 'asc' } } },
    });
    if (!pet) throw new NotFoundException('PET_NOT_FOUND');
    return pet;
  }

  async addPhoto(petId: string, userId: string, file: Express.Multer.File, kind: string, sortOrder: number) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId }, include: { photos: true } });
    if (!pet) throw new NotFoundException('PET_NOT_FOUND');
    if (pet.ownerId !== userId) throw new ForbiddenException();
    if (pet.photos.length >= 5) throw new UnprocessableEntityException('MAX_PHOTOS_REACHED');

    const url = `/uploads/pets/${petId}/${file.filename}`;
    return this.prisma.photo.create({
      data: { petId, url, kind: kind as any, sortOrder },
    });
  }

  async deletePhoto(petId: string, photoId: string, userId: string) {
    const pet = await this.prisma.pet.findUnique({ where: { id: petId } });
    if (!pet) throw new NotFoundException('PET_NOT_FOUND');
    if (pet.ownerId !== userId) throw new ForbiddenException();

    const photo = await this.prisma.photo.findUnique({ where: { id: photoId } });
    if (!photo) throw new NotFoundException('PHOTO_NOT_FOUND');

    const filePath = path.join(process.cwd(), photo.url);
    if (fs.existsSync(filePath)) fs.unlinkSync(filePath);

    return this.prisma.photo.delete({ where: { id: photoId } });
  }
}
