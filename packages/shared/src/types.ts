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
  | 'ESCROW_RELEASE';

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

export const WALLET_PACKAGES = [
  { id: 'pack_30',  jerky: 30,  price: 'NT$ 90'  },
  { id: 'pack_100', jerky: 100, price: 'NT$ 270' },
  { id: 'pack_300', jerky: 300, price: 'NT$ 690' },
] as const;

export type WalletPackageId = typeof WALLET_PACKAGES[number]['id'];
