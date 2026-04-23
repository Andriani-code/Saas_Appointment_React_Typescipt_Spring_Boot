import apiClient from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ClientResponse,
  ClientRequest,
  SpecialistResponse,
  SpecialistRequest,
  SpecialistServiceResponse,
  SpecialistServiceRequest,
  AvailabilityResponse,
  SlotResponse,
  ReservationResponse,
  ReservationRequest,
  PaymentResponse,
  ReviewResponse,
  ReviewRequest,
  ConversationResponse,
  MessageResponse,
  PageResponse,
} from "@/types";

// ─── Auth ────────────────────────────────────────────────────────────────────
export const authApi = {
  register: (data: RegisterRequest) =>
    apiClient.post<AuthResponse>("/auth/register", data).then((r) => r.data),
  login: (data: LoginRequest) =>
    apiClient.post<AuthResponse>("/auth/login", data).then((r) => r.data),
  refresh: (refreshToken: string) =>
    apiClient
      .post<AuthResponse>("/auth/refresh", { refreshToken })
      .then((r) => r.data),
};

// ─── Clients ─────────────────────────────────────────────────────────────────
export const clientApi = {
  createProfile: (data: ClientRequest) =>
    apiClient.post<ClientResponse>("/clients", data).then((r) => r.data),
  existsProfile: () => apiClient.get<boolean>("/clients/me/exists").then((r) => r.data),
  getMe: () => apiClient.get<ClientResponse>("/clients/me").then((r) => r.data),
  updateProfile: (data: ClientRequest) =>
    apiClient.put<ClientResponse>("/clients/me", data).then((r) => r.data),
  getAll: (page = 0, size = 20) =>
    apiClient
      .get<PageResponse<ClientResponse>>(`/clients?page=${page}&size=${size}`)
      .then((r) => r.data),
};

// ─── Specialists ─────────────────────────────────────────────────────────────
export const specialistApi = {
  createProfile: (data: SpecialistRequest) =>
    apiClient
      .post<SpecialistResponse>("/specialists", data)
      .then((r) => r.data),
  existsProfile: () =>
    apiClient.get<boolean>("/specialists/me/exists").then((r) => r.data),
  getMe: () =>
    apiClient.get<SpecialistResponse>("/specialists/me").then((r) => r.data),
  updateProfile: (data: SpecialistRequest) =>
    apiClient
      .put<SpecialistResponse>("/specialists/me", data)
      .then((r) => r.data),
  requestVerification: () =>
    apiClient
      .post<SpecialistResponse>("/specialists/me/verify")
      .then((r) => r.data),
  getById: (id: string) =>
    apiClient.get<SpecialistResponse>(`/specialists/${id}`).then((r) => r.data),
  getAll: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<SpecialistResponse>
      >(`/specialists?page=${page}&size=${size}`)
      .then((r) => r.data),
  getNearby: (lat: number, lng: number, radiusKm = 25, page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<SpecialistResponse>
      >(`/specialists/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&page=${page}&size=${size}`)
      .then((r) => r.data),
  approve: (id: string) =>
    apiClient
      .patch<SpecialistResponse>(`/specialists/${id}/approve`)
      .then((r) => r.data),
  reject: (id: string) =>
    apiClient
      .patch<SpecialistResponse>(`/specialists/${id}/reject`)
      .then((r) => r.data),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const serviceApi = {
  create: (data: SpecialistServiceRequest) =>
    apiClient
      .post<SpecialistServiceResponse>("/services", data)
      .then((r) => r.data),
  getById: (id: string) =>
    apiClient
      .get<SpecialistServiceResponse>(`/services/${id}`)
      .then((r) => r.data),
  getActiveBySpecialist: (specialistId: string) =>
    apiClient
      .get<SpecialistServiceResponse[]>(`/services/specialist/${specialistId}`)
      .then((r) => r.data),
  update: (id: string, data: SpecialistServiceRequest) =>
    apiClient
      .put<SpecialistServiceResponse>(`/services/${id}`, data)
      .then((r) => r.data),
  deactivate: (id: string) => apiClient.delete(`/services/${id}`),
};

// ─── Availability ────────────────────────────────────────────────────────────
export const availabilityApi = {
  getMyAvailabilities: () =>
    apiClient
      .get<AvailabilityResponse[]>("/availability/me")
      .then((r) => r.data),
  getBySpecialist: (specialistId: string) =>
    apiClient
      .get<AvailabilityResponse[]>(`/availability/specialist/${specialistId}`)
      .then((r) => r.data),
  create: (data: {
    dayOfWeek: string;
    startTime: string;
    endTime: string;
    intervalMinutes: number;
  }) =>
    apiClient
      .post<AvailabilityResponse>("/availability", data)
      .then((r) => r.data),
  update: (
    id: string,
    data: {
      dayOfWeek: string;
      startTime: string;
      endTime: string;
      intervalMinutes: number;
    },
  ) =>
    apiClient
      .put<AvailabilityResponse>(`/availability/${id}`, data)
      .then((r) => r.data),
  delete: (id: string) => apiClient.delete(`/availability/${id}`),
};

// ─── Slots ───────────────────────────────────────────────────────────────────
export const slotApi = {
  generate: (startDate: string, endDate: string) =>
    apiClient
      .post<SlotResponse[]>("/slots/generate", { startDate, endDate })
      .then((r) => r.data),
  getBySpecialistAndDate: (specialistId: string, date: string) =>
    apiClient
      .get<SlotResponse[]>(`/slots/specialist/${specialistId}?date=${date}`)
      .then((r) => r.data),
  blockSlot: (slotId: string) =>
    apiClient.patch<SlotResponse>(`/slots/${slotId}/block`).then((r) => r.data),
  unblockSlot: (slotId: string) =>
    apiClient
      .patch<SlotResponse>(`/slots/${slotId}/unblock`)
      .then((r) => r.data),
};

// ─── Reservations ─────────────────────────────────────────────────────────────
export const reservationApi = {
  book: (data: ReservationRequest) =>
    apiClient
      .post<ReservationResponse>("/reservations", data)
      .then((r) => r.data),
  getById: (id: string) =>
    apiClient
      .get<ReservationResponse>(`/reservations/${id}`)
      .then((r) => r.data),
  getMyAsClient: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReservationResponse>
      >(`/reservations/my/client?page=${page}&size=${size}`)
      .then((r) => r.data),
  getMyAsSpecialist: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReservationResponse>
      >(`/reservations/my/specialist?page=${page}&size=${size}`)
      .then((r) => r.data),
  confirm: (id: string) =>
    apiClient
      .patch<ReservationResponse>(`/reservations/${id}/confirm`)
      .then((r) => r.data),
  reject: (id: string) =>
    apiClient
      .patch<ReservationResponse>(`/reservations/${id}/reject`)
      .then((r) => r.data),
  cancel: (id: string) =>
    apiClient
      .patch<ReservationResponse>(`/reservations/${id}/cancel`)
      .then((r) => r.data),
  complete: (id: string) =>
    apiClient
      .patch<ReservationResponse>(`/reservations/${id}/complete`)
      .then((r) => r.data),
  noShow: (id: string) =>
    apiClient
      .patch<ReservationResponse>(`/reservations/${id}/no-show`)
      .then((r) => r.data),
};

// ─── Payments ─────────────────────────────────────────────────────────────────
export const paymentApi = {
  createIntent: (reservationId: string) =>
    apiClient
      .post<PaymentResponse>(`/payments/reservation/${reservationId}/intent`)
      .then((r) => r.data),
  getByReservation: (reservationId: string) =>
    apiClient
      .get<PaymentResponse>(`/payments/reservation/${reservationId}`)
      .then((r) => r.data),
};

// ─── Reviews ─────────────────────────────────────────────────────────────────
export const reviewApi = {
  create: (data: ReviewRequest) =>
    apiClient.post<ReviewResponse>("/reviews", data).then((r) => r.data),
  getBySpecialist: (specialistId: string, page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReviewResponse>
      >(`/reviews/specialist/${specialistId}?page=${page}&size=${size}`)
      .then((r) => r.data),
  getMyReviews: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReviewResponse>
      >(`/reviews/my?page=${page}&size=${size}`)
      .then((r) => r.data),
};

// ─── Messaging ───────────────────────────────────────────────────────────────
export const messagingApi = {
  getMyConversations: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ConversationResponse>
      >(`/messages/conversations?page=${page}&size=${size}`)
      .then((r) => r.data),
  getMessages: (conversationId: string, page = 0, size = 50) =>
    apiClient
      .get<
        PageResponse<MessageResponse>
      >(`/messages/conversations/${conversationId}/messages?page=${page}&size=${size}`)
      .then((r) => r.data),
  sendMessage: (conversationId: string, content: string) =>
    apiClient
      .post<MessageResponse>(`/messages/conversations/${conversationId}`, {
        content,
      })
      .then((r) => r.data),
  markAsRead: (conversationId: string) =>
    apiClient.patch(`/messages/conversations/${conversationId}/read`),
};
