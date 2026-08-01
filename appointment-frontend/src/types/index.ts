// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'CLIENT' | 'PROVIDER'
export type AuthProvider = 'LOCAL' | 'GOOGLE'

export interface AuthResponse {
  email: string
  role: Role
  profileCompleted?: boolean
  userId?: string
  accessToken?: string
  refreshToken?: string
  tokenType?: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: Role
  clientProfile?: ClientRequest
  providerProfile?: ProviderRequest
}

export interface LoginRequest {
  email: string
  password: string
}

// ─── Address ─────────────────────────────────────────────────────────────────

export interface AddressResponse {
  id: string
  country: string
  region?: string
  city: string
  district?: string
  addressLine?: string
  latitude?: number
  longitude?: number
}

export interface AddressRequest {
  country: string
  region?: string
  city: string
  district?: string
  addressLine?: string
  latitude?: number
  longitude?: number
}

// ─── Client ──────────────────────────────────────────────────────────────────

export interface ClientResponse {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  profilePhoto?: string
  address?: AddressResponse
}

export interface ClientRequest {
  firstName: string
  lastName: string
  phone?: string
  profilePhoto?: string
  address?: AddressRequest
}

// ─── Provider ──────────────────────────────────────────────────────────────

export type VerificationStatus = 'NONE' | 'PENDING' | 'APPROVED' | 'REJECTED'

export interface ProviderResponse {
  id: string
  userId: string
  email: string
  firstName: string
  lastName: string
  phone?: string
  displayName?: string
  profileTitle?: string
  bio?: string
  profilePhoto?: string
  coverPhoto?: string
  category?: string
  isActive: boolean
  isVerified: boolean
  verificationStatus: VerificationStatus
  personalAddress?: AddressResponse
  serviceAddress?: AddressResponse
  averageRating?: number
}

export interface ProviderRequest {
  firstName: string
  lastName: string
  phone?: string
  displayName?: string
  profileTitle?: string
  bio?: string
  profilePhoto?: string
  coverPhoto?: string
  category?: string
  personalAddress?: AddressRequest
  serviceAddress?: AddressRequest
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface ProviderServiceResponse {
  id: string
  providerId: string
  providerDisplayName?: string
  name: string
  description?: string
  photoUrl?: string
  durationMinutes: number
  price: number
  depositEnabled: boolean
  depositAmount?: number
  isActive: boolean
}

export interface ProviderServiceRequest {
  name: string
  description?: string
  photoUrl?: string
  durationMinutes: number
  price: number
  depositEnabled: boolean
  depositAmount?: number
}

// ─── Availability ────────────────────────────────────────────────────────────

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface AvailabilityResponse {
  id: string
  providerId: string
  date: string
  dayOfWeek?: string | null
  startTime?: string | null
  endTime?: string | null
  intervalMinutes?: number | null
  isActive: boolean
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED'

export interface SlotResponse {
  id: string
  providerId: string
  serviceId?: string
  date: string
  startTime: string
  endTime: string
  status: SlotStatus
}

// ─── Reservation ─────────────────────────────────────────────────────────────

export type ReservationStatus = 'PENDING' | 'CONFIRMED' | 'REJECTED' | 'CANCELED' | 'COMPLETED' | 'NO_SHOW'

export interface ReservationResponse {
  id: string
  clientId: string
  clientFullName: string
  providerId: string
  providerDisplayName?: string
  serviceId: string
  serviceName: string
  slot: SlotResponse
  status: ReservationStatus
  clientMessage?: string
  depositRequired: boolean
  depositAmount?: number
  createdAt: string
}

export interface ReservationRequest {
  slotId: string
  serviceId: string
  clientMessage?: string
}

// ─── Payment ─────────────────────────────────────────────────────────────────

export type PaymentStatus = 'PENDING' | 'SUCCESS' | 'FAILED'

export interface PaymentResponse {
  id: string
  reservationId: string
  amount: number
  method: string
  status: PaymentStatus
  stripePaymentIntentId?: string
  clientSecret?: string
  createdAt: string
}

// ─── Review ──────────────────────────────────────────────────────────────────

export interface ReviewResponse {
  id: string
  clientId: string
  clientFullName: string
  providerId: string
  providerDisplayName?: string
  reservationId: string
  rating: number
  comment?: string
  isVisible: boolean
  createdAt: string
}

export interface ReviewRequest {
  reservationId: string
  rating: number
  comment?: string
}

// ─── Favorites ──────────────────────────────────────────────────────────────

export interface FavoriteResponse {
  id: string
  clientId: string
  providerId: string
  providerDisplayName: string
  providerProfileTitle?: string
  providerProfilePhoto?: string
  providerCategory?: string
  providerAverageRating?: number
  createdAt: string
}

// ─── Messaging ───────────────────────────────────────────────────────────────

export type SenderType = 'CLIENT' | 'PROVIDER'

export interface ConversationResponse {
  id: string
  clientId: string
  clientFullName: string
  providerId: string
  providerDisplayName?: string
  lastMessageContent?: string
  reservationId?: string
  isActive: boolean
  unreadCount: number
  createdAt: string
}

export interface MessageResponse {
  id: string
  conversationId: string
  senderUserId: string
  senderType: SenderType
  content: string
  isRead: boolean
  createdAt: string
}

// ─── Pagination ──────────────────────────────────────────────────────────────

export interface PageResponse<T> {
  content: T[]
  page: number
  size: number
  totalElements: number
  totalPages: number
  last: boolean
}

// ─── API Error ───────────────────────────────────────────────────────────────

export interface ApiError {
  status: number
  error: string
  message: string
  timestamp: string
  fieldErrors?: Record<string, string>
}

// ─── Auth Context ─────────────────────────────────────────────────────────────

export interface AuthUser {
  email: string
  role: Role
  profileCompleted?: boolean
  userId?: string
}
