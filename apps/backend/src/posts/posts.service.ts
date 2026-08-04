import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  UnprocessableEntityException,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { StorageService } from '../storage/storage.service';
import { CreatePostDto } from './dto/create-post.dto';
import { extname } from 'path';

const MAX_PHOTOS_PER_POST = 5;

// 跟 discover.controller.ts 的 USER_SELECT 同一組欄位：這就是抖內解鎖後，貼文作者看到的「個人介紹」。
const TIPPER_SELECT = {
  id: true, email: true, role: true, gender: true, displayName: true,
  bio: true, interests: true, education: true, zodiac: true,
  jobTitle: true, company: true, school: true, city: true,
  height: true, avatarUrl: true, createdAt: true,
};

const POST_AUTHOR_SELECT = {
  id: true, displayName: true, avatarUrl: true, city: true,
};

function haversineM(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371000;
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * Math.sin(dLon / 2) ** 2;
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

@Injectable()
export class PostsService {
  constructor(private prisma: PrismaService, private storageService: StorageService) {}

  async create(authorId: string, dto: CreatePostDto) {
    if (dto.petId) {
      const pet = await this.prisma.pet.findUnique({ where: { id: dto.petId } });
      if (!pet || pet.ownerId !== authorId) throw new ForbiddenException('PET_NOT_OWNED');
    }
    return this.prisma.post.create({
      data: { authorId, petId: dto.petId, caption: dto.caption },
      include: { photos: true },
    });
  }

  async addPhoto(postId: string, userId: string, file: Express.Multer.File, sortOrder: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId }, include: { photos: true } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    if (post.authorId !== userId) throw new ForbiddenException();
    if (post.photos.length >= MAX_PHOTOS_PER_POST) throw new UnprocessableEntityException('MAX_PHOTOS_REACHED');
    if (!file) throw new BadRequestException('FILE_REQUIRED');

    const key = `posts/${postId}/${Date.now()}${extname(file.originalname)}`;
    const url = await this.storageService.uploadBuffer(file.buffer, key, file.mimetype);
    return this.prisma.postPhoto.create({ data: { postId, url, sortOrder } });
  }

  async delete(postId: string, userId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    if (post.authorId !== userId) throw new ForbiddenException();
    await this.prisma.post.delete({ where: { id: postId } });
    return { ok: true };
  }

  /** 配對前的探索層：只顯示附近使用者的貼文，不是全域動態牆。 */
  async getFeed(userId: string, radiusKm = 5, page = 1, limit = 20) {
    const me = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { latitude: true, longitude: true },
    });
    if (!me?.latitude || !me?.longitude) return [];

    const posts = await this.prisma.post.findMany({
      where: { author: { latitude: { not: null }, longitude: { not: null } } },
      include: {
        author: { select: { ...POST_AUTHOR_SELECT, latitude: true, longitude: true } },
        pet: { select: { id: true, name: true, breed: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { likes: true, comments: true, tips: true } },
      },
      orderBy: { createdAt: 'desc' },
    });

    const radiusM = radiusKm * 1000;
    const withDistance = posts
      .map((p) => ({
        post: p,
        distanceM: haversineM(me.latitude!, me.longitude!, p.author.latitude!, p.author.longitude!),
      }))
      .filter((p) => p.distanceM <= radiusM);

    const offset = (page - 1) * limit;
    return withDistance.slice(offset, offset + limit).map(({ post, distanceM }) => {
      const { author, ...rest } = post;
      const { latitude, longitude, ...authorRest } = author;
      return { ...rest, author: authorRest, distanceM };
    });
  }

  async getOne(postId: string) {
    const post = await this.prisma.post.findUnique({
      where: { id: postId },
      include: {
        author: { select: POST_AUTHOR_SELECT },
        pet: { select: { id: true, name: true, breed: true } },
        photos: { orderBy: { sortOrder: 'asc' } },
        _count: { select: { likes: true, comments: true, tips: true } },
      },
    });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    return post;
  }

  async like(postId: string, userId: string) {
    await this.ensurePostExists(postId);
    await this.prisma.postLike.upsert({
      where: { postId_userId: { postId, userId } },
      create: { postId, userId },
      update: {},
    });
    return { ok: true };
  }

  async unlike(postId: string, userId: string) {
    await this.prisma.postLike.deleteMany({ where: { postId, userId } });
    return { ok: true };
  }

  async addComment(postId: string, userId: string, text: string) {
    await this.ensurePostExists(postId);
    return this.prisma.postComment.create({
      data: { postId, authorId: userId, text },
    });
  }

  async getComments(postId: string, limit = 20) {
    return this.prisma.postComment.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      take: limit,
      include: { author: { select: POST_AUTHOR_SELECT } },
    });
  }

  /**
   * 抖內：肉乾只能花在「打賞貼文」這個定義好的用途，不能任意轉帳給其他使用者。
   * 唯一的額外效果是把贈送者加進 PostTip，讓貼文作者之後能查看贈送者的個人介紹（見 getTippers）。
   */
  async tip(postId: string, senderId: string, amount: number) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    if (post.authorId === senderId) throw new ForbiddenException('CANNOT_TIP_OWN_POST');

    return this.prisma.$transaction(async (tx: Prisma.TransactionClient) => {
      const senderWallet = await tx.wallet.findUnique({ where: { userId: senderId } });
      if (!senderWallet || senderWallet.balance < amount) {
        throw new UnprocessableEntityException('INSUFFICIENT_BALANCE');
      }

      await tx.wallet.update({ where: { userId: senderId }, data: { balance: { decrement: amount } } });
      await tx.wallet.update({ where: { userId: post.authorId }, data: { balance: { increment: amount } } });
      await tx.walletTransaction.createMany({
        data: [
          { userId: senderId, type: 'TIP_SENT', amount, relatedEntityId: postId },
          { userId: post.authorId, type: 'TIP_RECEIVED', amount, relatedEntityId: postId },
        ],
      });
      const tip = await tx.postTip.create({
        data: { postId, senderId, recipientId: post.authorId, amount },
      });
      return { ok: true, tipId: tip.id };
    });
  }

  /** 只有貼文作者可以看到「誰抖內了、他們的個人介紹長怎樣」。 */
  async getTippers(postId: string, requesterId: string) {
    const post = await this.prisma.post.findUnique({ where: { id: postId } });
    if (!post) throw new NotFoundException('POST_NOT_FOUND');
    if (post.authorId !== requesterId) throw new ForbiddenException();

    const tips = await this.prisma.postTip.findMany({
      where: { postId },
      orderBy: { createdAt: 'desc' },
      include: { sender: { select: TIPPER_SELECT } },
    });
    return tips.map((t) => ({ amount: t.amount, tippedAt: t.createdAt, sender: t.sender }));
  }

  private async ensurePostExists(postId: string) {
    const exists = await this.prisma.post.findUnique({ where: { id: postId }, select: { id: true } });
    if (!exists) throw new NotFoundException('POST_NOT_FOUND');
  }
}
