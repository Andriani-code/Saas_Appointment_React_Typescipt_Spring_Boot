package com.app.controller;

import com.app.dto.request.ReservationRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ReservationResponse;
import com.app.service.ReservationService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/v1/reservations")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Reservations", description = "Appointment booking and management")
public class ReservationController {

    private final ReservationService reservationService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Book an appointment")
    public ResponseEntity<ReservationResponse> book(@Valid @RequestBody ReservationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(reservationService.book(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get reservation by ID")
    public ResponseEntity<ReservationResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.getById(id));
    }

    @GetMapping("/my/client")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get my reservations as a client")
    public ResponseEntity<PageResponse<ReservationResponse>> getMyAsClient(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(reservationService.getMyReservationsAsClient(PageRequest.of(page, size)));
    }

    @GetMapping("/my/provider")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Get my reservations as a provider")
    public ResponseEntity<PageResponse<ReservationResponse>> getMyAsProvider(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(reservationService.getMyReservationsAsProvider(PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/confirm")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Confirm a reservation")
    public ResponseEntity<ReservationResponse> confirm(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.confirm(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Reject a reservation")
    public ResponseEntity<ReservationResponse> reject(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.reject(id));
    }

    @PatchMapping("/{id}/cancel")
    @Operation(summary = "Cancel a reservation (client or provider)")
    public ResponseEntity<ReservationResponse> cancel(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.cancel(id));
    }

    @PatchMapping("/{id}/complete")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Mark reservation as completed")
    public ResponseEntity<ReservationResponse> complete(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.markCompleted(id));
    }

    @PatchMapping("/{id}/no-show")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Mark reservation as no-show")
    public ResponseEntity<ReservationResponse> noShow(@PathVariable String id) {
        return ResponseEntity.ok(reservationService.markNoShow(id));
    }
}
