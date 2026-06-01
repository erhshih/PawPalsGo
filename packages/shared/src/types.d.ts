export type UserRole = 'OWNER' | 'LOVER';
export type SwipeDirection = 'LIKE' | 'PASS' | 'SUPER_LIKE';
export type MeetingStatus = 'SCHEDULED' | 'CHECKING_IN' | 'COMPLETED' | 'CANCELLED_BENIGN' | 'CANCELLED_PENALTY';
export type WalletTransactionType = 'TOPUP' | 'DEBIT' | 'CREDIT' | 'ESCROW' | 'ESCROW_RELEASE';
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
}
export interface MatchDto {
    id: string;
    partner: UserDto & {
        pets?: PetDto[];
    };
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
export declare const WALLET_PACKAGES: readonly [{
    readonly id: "pack_30";
    readonly jerky: 30;
    readonly price: "NT$ 90";
}, {
    readonly id: "pack_100";
    readonly jerky: 100;
    readonly price: "NT$ 270";
}, {
    readonly id: "pack_300";
    readonly jerky: 300;
    readonly price: "NT$ 690";
}];
export type WalletPackageId = typeof WALLET_PACKAGES[number]['id'];
