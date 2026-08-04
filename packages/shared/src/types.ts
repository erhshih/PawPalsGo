export type UserRole = 'OWNER' | 'LOVER';

export type Gender = 'MALE' | 'FEMALE' | 'OTHER';

export type SwipeDirection = 'LIKE' | 'PASS' | 'SUPER_LIKE';

export type MeetingStatus =
  | 'SCHEDULED'
  | 'CHECKING_IN'
  | 'COMPLETED'
  | 'CANCELLED_BENIGN'
  | 'CANCELLED_PENALTY';

export type WalletTransactionType =
  | 'TOPUP'
  | 'DEBIT'
  | 'CREDIT'
  | 'ESCROW'
  | 'ESCROW_RELEASE'
  | 'TIP_SENT'
  | 'TIP_RECEIVED'
  | 'REDEMPTION';

export type PhotoKind = 'closeup' | 'owner' | 'bw';

export interface PhotoDto {
  id: string;
  url: string;
  kind: PhotoKind;
  sortOrder: number;
}

export interface PetDto {
  id: string;
  name: string;
  breed: string;
  bio: string;
  tags: string[];
  birthDate?: string;
  photos: PhotoDto[];
  ownerId: string;
}

export interface UserDto {
  id: string;
  email: string;
  role: UserRole;
  gender?: Gender;
  displayName?: string;
  bio?: string;
  interests?: string[];
  education?: string;
  zodiac?: string;
  jobTitle?: string;
  company?: string;
  school?: string;
  city?: string;
  height?: number;
  avatarUrl?: string;
}

export interface MatchDto {
  id: string;
  partner: UserDto & { pets?: PetDto[] };
  lastMessage?: MessageDto;
  unreadCount: number;
  createdAt: string;
}

export interface MessageDto {
  id: string;
  matchId: string;
  senderId: string;
  text: string;
  createdAt: string;
}

export interface MeetingDto {
  id: string;
  matchId: string;
  initiatorId: string;
  scheduledAt: string;
  status: MeetingStatus;
  escrow: number;
}

export interface WalletDto {
  balance: number;
  currency: string;
}

export interface SwipeResultDto {
  matched: boolean;
  matchId?: string;
}

export interface DiscoverResultDto {
  pet?: PetDto;
  user?: UserDto;
  distanceM: number;
}

export interface AuthTokens {
  accessToken: string;
}

// ── 貼文牆 + 抖內 ──
export interface PostAuthorDto {
  id: string;
  displayName?: string;
  avatarUrl?: string;
  city?: string;
}

export interface PostPhotoDto {
  id: string;
  postId: string;
  url: string;
  sortOrder: number;
  createdAt: string;
}

export interface PostDto {
  id: string;
  authorId: string;
  petId?: string;
  caption?: string;
  createdAt: string;
  photos: PostPhotoDto[];
  likeCount: number;
  commentCount: number;
  tipCount: number;
  author?: PostAuthorDto;
  distanceM?: number;
}

export interface PostCommentDto {
  id: string;
  postId: string;
  authorId: string;
  text: string;
  createdAt: string;
}

export const TIP_AMOUNTS = [1, 5, 10, 50] as const;
export type TipAmount = typeof TIP_AMOUNTS[number];

export interface TipperDto {
  amount: number;
  tippedAt: string;
  sender: UserDto;
}

// ── 狗聚 ──
export interface DogMeetupAttendeeDto {
  id: string;
  meetupId: string;
  userId: string;
  petId?: string;
  joinedAt: string;
  user?: PostAuthorDto;
  pet?: { id: string; name: string; breed: string };
}

export interface DogMeetupDto {
  id: string;
  organizerId: string;
  title: string;
  description?: string;
  location: string;
  latitude?: number;
  longitude?: number;
  scheduledAt: string;
  maxAttendees?: number;
  cancelledAt?: string;
  createdAt: string;
  organizer?: PostAuthorDto;
  attendeeCount: number;
  attendees?: DogMeetupAttendeeDto[];
  distanceM?: number;
}

// ── 肉乾兌換 ──
export interface RedemptionRewardDto {
  id: string;
  partnerName: string;
  title: string;
  description?: string;
  imageUrl?: string;
  costJerky: number;
  stock?: number;
  active: boolean;
  createdAt: string;
}

export interface RedemptionDto {
  id: string;
  rewardId: string;
  userId: string;
  code: string;
  redeemedAt: string;
  reward?: RedemptionRewardDto;
}

// ── 檢舉 / 封鎖 ──
export type ReportReason =
  | 'HARASSMENT'
  | 'FAKE_PROFILE'
  | 'INAPPROPRIATE_CONTENT'
  | 'SCAM'
  | 'SPAM'
  | 'OTHER';

export type ReportStatus = 'OPEN' | 'REVIEWED' | 'DISMISSED';

export interface ReportDto {
  id: string;
  reporterId: string;
  targetId: string;
  reason: ReportReason;
  detail?: string;
  postId?: string;
  status: ReportStatus;
  createdAt: string;
}

export interface BlockedUserDto {
  id: string;
  displayName?: string;
  avatarUrl?: string;
}

export interface BlockedEntryDto {
  blockedAt: string;
  user: BlockedUserDto;
}

export const WALLET_PACKAGES = [
  { id: 'pack_30',  jerky: 30,  price: 'NT$ 90'  },
  { id: 'pack_100', jerky: 100, price: 'NT$ 270' },
  { id: 'pack_300', jerky: 300, price: 'NT$ 690' },
] as const;

export type WalletPackageId = typeof WALLET_PACKAGES[number]['id'];
