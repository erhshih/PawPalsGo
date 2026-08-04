import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PetsService } from './pets.service';
import { CreatePetDto } from './dto/create-pet.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import { RolesGuard } from '../auth/roles.guard';
import { Roles } from '../auth/roles.decorator';
import type { RequestUser } from '../auth/jwt.strategy';

@Controller('pets')
@UseGuards(JwtAuthGuard)
export class PetsController {
  constructor(private petsService: PetsService) {}

  @Post()
  @UseGuards(RolesGuard)
  @Roles('OWNER')
  create(@Body() dto: CreatePetDto, @Req() req: { user: RequestUser }) {
    return this.petsService.create(dto, req.user.userId);
  }

  @Patch(':petId')
  update(@Param('petId') petId: string, @Body() dto: Partial<CreatePetDto>, @Req() req: { user: RequestUser }) {
    return this.petsService.update(petId, dto, req.user.userId);
  }

  @Get(':petId')
  findOne(@Param('petId') petId: string) {
    return this.petsService.findOne(petId);
  }

  @Post(':petId/photos')
  @UseInterceptors(
    FileInterceptor('file', {
      fileFilter: (req, file, cb) => {
        if (!['image/jpeg', 'image/png'].includes(file.mimetype)) return cb(new Error('INVALID_FILE_TYPE'), false);
        cb(null, true);
      },
      limits: { fileSize: 10 * 1024 * 1024 },
    }),
  )
  addPhoto(
    @Param('petId') petId: string,
    @Req() req: { user: RequestUser },
    @UploadedFile() file: Express.Multer.File,
    @Query('kind') kind = 'closeup',
    @Query('sortOrder') sortOrder = '0',
  ) {
    return this.petsService.addPhoto(petId, req.user.userId, file, kind, parseInt(sortOrder));
  }

  @Delete(':petId/photos/:photoId')
  deletePhoto(
    @Param('petId') petId: string,
    @Param('photoId') photoId: string,
    @Req() req: { user: RequestUser },
  ) {
    return this.petsService.deletePhoto(petId, photoId, req.user.userId);
  }
}
