import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Post,
  Query,
  Req,
  UploadedFile,
  UseGuards,
  UseInterceptors,
} from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { PostsService } from './posts.service';
import { CreatePostDto } from './dto/create-post.dto';
import { CommentDto } from './dto/comment.dto';
import { TipDto } from './dto/tip.dto';
import { JwtAuthGuard } from '../auth/jwt-auth.guard';
import type { RequestUser } from '../auth/jwt.strategy';

@Controller('posts')
@UseGuards(JwtAuthGuard)
export class PostsController {
  constructor(private postsService: PostsService) {}

  @Post()
  create(@Body() dto: CreatePostDto, @Req() req: { user: RequestUser }) {
    return this.postsService.create(req.user.userId, dto);
  }

  @Get('feed')
  getFeed(
    @Req() req: { user: RequestUser },
    @Query('radius') radius = '5',
    @Query('page') page = '1',
    @Query('limit') limit = '20',
  ) {
    return this.postsService.getFeed(req.user.userId, Math.min(parseInt(radius), 50), parseInt(page), parseInt(limit));
  }

  @Get(':postId')
  getOne(@Param('postId') postId: string) {
    return this.postsService.getOne(postId);
  }

  @Delete(':postId')
  delete(@Param('postId') postId: string, @Req() req: { user: RequestUser }) {
    return this.postsService.delete(postId, req.user.userId);
  }

  @Post(':postId/photos')
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
    @Param('postId') postId: string,
    @Req() req: { user: RequestUser },
    @UploadedFile() file: Express.Multer.File,
    @Query('sortOrder') sortOrder = '0',
  ) {
    return this.postsService.addPhoto(postId, req.user.userId, file, parseInt(sortOrder));
  }

  @Post(':postId/like')
  like(@Param('postId') postId: string, @Req() req: { user: RequestUser }) {
    return this.postsService.like(postId, req.user.userId);
  }

  @Delete(':postId/like')
  unlike(@Param('postId') postId: string, @Req() req: { user: RequestUser }) {
    return this.postsService.unlike(postId, req.user.userId);
  }

  @Post(':postId/comments')
  addComment(@Param('postId') postId: string, @Body() dto: CommentDto, @Req() req: { user: RequestUser }) {
    return this.postsService.addComment(postId, req.user.userId, dto.text);
  }

  @Get(':postId/comments')
  getComments(@Param('postId') postId: string, @Query('limit') limit = '20') {
    return this.postsService.getComments(postId, parseInt(limit));
  }

  @Post(':postId/tip')
  tip(@Param('postId') postId: string, @Body() dto: TipDto, @Req() req: { user: RequestUser }) {
    return this.postsService.tip(postId, req.user.userId, dto.amount);
  }

  @Get(':postId/tippers')
  getTippers(@Param('postId') postId: string, @Req() req: { user: RequestUser }) {
    return this.postsService.getTippers(postId, req.user.userId);
  }
}
