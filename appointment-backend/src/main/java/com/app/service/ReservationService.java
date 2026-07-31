package com.app.service;

import com.app.dto.request.ReservationRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReservationResponse;
import org.springframework.data.domain.Pageable;

public interface ReservationService {
    ReservationResponse book(ReservationRequest request);
    ReservationResponse getById(String id);
    PageResponse<ReservationResponse> getMyReservationsAsClient(Pageable pageable);
    PageResponse<ReservationResponse> getMyReservationsAsProvider(Pageable pageable);
    ReservationResponse confirm(String id);
    ReservationResponse reject(String id);
    ReservationResponse cancel(String id);
    ReservationResponse markCompleted(String id);
    ReservationResponse markNoShow(String id);
}
