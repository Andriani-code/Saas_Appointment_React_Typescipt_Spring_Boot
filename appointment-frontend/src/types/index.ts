// ─── Auth ────────────────────────────────────────────────────────────────────

export type Role = 'ADMIN' | 'CLIENT' | 'SPECIALIST'
export type Provider = 'LOCAL' | 'GOOGLE'

export interface AuthResponse {
  email: string
  role: Role
  profileCompleted?: boolean
  accessToken?: string
  refreshToken?: string
  tokenType?: string
}

export interface RegisterRequest {
  email: string
  password: string
  role: Role
  clientProfile?: ClientRequest
  specialistProfile?: SpecialistRequest
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

// ─── Specialist ──────────────────────────────────────────────────────────────

export type VerificationStatus = 'PENDING' | 'APPROVED' | 'REJECTED'

export interface SpecialistResponse {
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
  isActive: boolean
  isVerified: boolean
  verificationStatus: VerificationStatus
  personalAddress?: AddressResponse
  serviceAddress?: AddressResponse
  averageRating?: number
}

export interface SpecialistRequest {
  firstName: string
  lastName: string
  phone?: string
  displayName?: string
  profileTitle?: string
  bio?: string
  profilePhoto?: string
  coverPhoto?: string
  personalAddress?: AddressRequest
  serviceAddress?: AddressRequest
}

// ─── Service ─────────────────────────────────────────────────────────────────

export interface SpecialistServiceResponse {
  id: string
  specialistId: string
  specialistDisplayName?: string
  name: string
  description?: string
  durationMinutes: number
  price: number
  depositEnabled: boolean
  depositAmount?: number
  isActive: boolean
}

export interface SpecialistServiceRequest {
  name: string
  description?: string
  durationMinutes: number
  price: number
  depositEnabled: boolean
  depositAmount?: number
}

// ─── Availability ────────────────────────────────────────────────────────────

export type DayOfWeek = 'MONDAY' | 'TUESDAY' | 'WEDNESDAY' | 'THURSDAY' | 'FRIDAY' | 'SATURDAY' | 'SUNDAY'

export interface AvailabilityResponse {
  id: string
  specialistId: string
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  intervalMinutes: number
  isActive: boolean
}

// ─── Slots ───────────────────────────────────────────────────────────────────

export type SlotStatus = 'AVAILABLE' | 'BOOKED' | 'BLOCKED'

export interface SlotResponse {
  id: string
  specialistId: string
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
  specialistId: string
  specialistDisplayName?: string
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
  specialistId: string
  specialistDisplayName?: string
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

// ─── Messaging ───────────────────────────────────────────────────────────────

export type SenderType = 'CLIENT' | 'SPECIALIST'

export interface ConversationResponse {
  id: string
  clientId: string
  clientFullName: string
  specialistId: string
  specialistDisplayName?: string
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
}
