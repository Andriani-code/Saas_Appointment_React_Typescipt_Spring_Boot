import apiClient from "./apiClient";
import type {
  AuthResponse,
  LoginRequest,
  RegisterRequest,
  ClientResponse,
  ClientRequest,
  ProviderResponse,
  ProviderRequest,
  ProviderServiceResponse,
  ProviderServiceRequest,
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

// ─── Providers ─────────────────────────────────────────────────────────────
export const providerApi = {
  createProfile: (data: ProviderRequest) =>
    apiClient
      .post<ProviderResponse>("/providers", data)
      .then((r) => r.data),
  existsProfile: () =>
    apiClient.get<boolean>("/providers/me/exists").then((r) => r.data),
  getMe: () =>
    apiClient.get<ProviderResponse>("/providers/me").then((r) => r.data),
  updateProfile: (data: ProviderRequest) =>
    apiClient
      .put<ProviderResponse>("/providers/me", data)
      .then((r) => r.data),
  requestVerification: () =>
    apiClient
      .post<ProviderResponse>("/providers/me/verify")
      .then((r) => r.data),
  getById: (id: string) =>
    apiClient.get<ProviderResponse>(`/providers/${id}`).then((r) => r.data),
  getAll: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ProviderResponse>
      >(`/providers?page=${page}&size=${size}`)
      .then((r) => r.data),
  getAllForAdmin: (page = 0, size = 100) =>
    apiClient
      .get<
        PageResponse<ProviderResponse>
      >(`/providers/admin/all?page=${page}&size=${size}`)
      .then((r) => r.data),
  getPendingForAdmin: (page = 0, size = 100) =>
    apiClient
      .get<
        PageResponse<ProviderResponse>
      >(`/providers/admin/pending?page=${page}&size=${size}`)
      .then((r) => r.data),
  getNearby: (lat: number, lng: number, radiusKm = 25, page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ProviderResponse>
      >(`/providers/nearby?lat=${lat}&lng=${lng}&radiusKm=${radiusKm}&page=${page}&size=${size}`)
      .then((r) => r.data),
  approve: (id: string) =>
    apiClient
      .patch<ProviderResponse>(`/providers/${id}/approve`)
      .then((r) => r.data),
  reject: (id: string) =>
    apiClient
      .patch<ProviderResponse>(`/providers/${id}/reject`)
      .then((r) => r.data),
};

// ─── Services ────────────────────────────────────────────────────────────────
export const serviceApi = {
  create: (data: ProviderServiceRequest) =>
    apiClient
      .post<ProviderServiceResponse>("/services", data)
      .then((r) => r.data),
  getById: (id: string) =>
    apiClient
      .get<ProviderServiceResponse>(`/services/${id}`)
      .then((r) => r.data),
  getActiveByProvider: (providerId: string) =>
    apiClient
      .get<ProviderServiceResponse[]>(`/services/provider/${providerId}`)
      .then((r) => r.data),
  update: (id: string, data: ProviderServiceRequest) =>
    apiClient
      .put<ProviderServiceResponse>(`/services/${id}`, data)
      .then((r) => r.data),
  deactivate: (id: string) => apiClient.delete(`/services/${id}`),
};

// ─── Availability ────────────────────────────────────────────────────────────
export const availabilityApi = {
  getMyAvailabilities: () =>
    apiClient
      .get<AvailabilityResponse[]>("/availability/me")
      .then((r) => r.data),
  getByProvider: (providerId: string) =>
    apiClient
      .get<AvailabilityResponse[]>(`/availability/provider/${providerId}`)
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
  getByProviderAndDate: (providerId: string, date: string) =>
    apiClient
      .get<SlotResponse[]>(`/slots/provider/${providerId}?date=${date}`)
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
  getMyAsProvider: (page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReservationResponse>
      >(`/reservations/my/provider?page=${page}&size=${size}`)
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
  getByProvider: (providerId: string, page = 0, size = 20) =>
    apiClient
      .get<
        PageResponse<ReviewResponse>
      >(`/reviews/provider/${providerId}?page=${page}&size=${size}`)
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
