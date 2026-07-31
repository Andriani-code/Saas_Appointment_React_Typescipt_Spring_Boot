package com.app.controller;

import com.app.dto.request.SpecialistRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistResponse;
import com.app.service.SpecialistService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.validation.annotation.Validated;
import org.springframework.web.bind.annotation.*;

@RestController
@Validated
@RequestMapping("/api/v1/specialists")
@RequiredArgsConstructor
@Tag(name = "Specialists", description = "Specialist profile and discovery")
public class SpecialistController {

    private final SpecialistService specialistService;

    @PostMapping
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create specialist profile")
    public ResponseEntity<SpecialistResponse> create(@Valid @RequestBody SpecialistRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(specialistService.createProfile(request));
    }

    @GetMapping("/me/exists")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Check whether my specialist profile exists")
    public ResponseEntity<Boolean> exists() {
        return ResponseEntity.ok(specialistService.hasMyProfile());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current specialist profile")
    public ResponseEntity<SpecialistResponse> getMe() {
        return ResponseEntity.ok(specialistService.getMyProfile());
    }

    @PostMapping("/me/verify")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Request profile verification")
    public ResponseEntity<SpecialistResponse> requestVerification() {
        return ResponseEntity.ok(specialistService.requestVerification());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my specialist profile")
    public ResponseEntity<SpecialistResponse> update(@Valid @RequestBody SpecialistRequest request) {
        return ResponseEntity.ok(specialistService.updateProfile(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get specialist by ID (public)")
    public ResponseEntity<SpecialistResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(specialistService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List all verified specialists (public)")
    public ResponseEntity<PageResponse<SpecialistResponse>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(specialistService.getAll(PageRequest.of(page, size)));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all specialists for admin")
    public ResponseEntity<PageResponse<SpecialistResponse>> getAllForAdmin(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(specialistService.getAllForAdmin(PageRequest.of(page, size)));
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List specialists pending verification")
    public ResponseEntity<PageResponse<SpecialistResponse>> getPending(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(specialistService.getByStatus("PENDING", PageRequest.of(page, size)));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find nearby specialists by geolocation (public)")
    public ResponseEntity<PageResponse<SpecialistResponse>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25.0") double radiusKm,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(specialistService.getNearby(lat, lng, radiusKm, PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Approve specialist verification (admin only)")
    public ResponseEntity<SpecialistResponse> approve(@PathVariable String id) {
        return ResponseEntity.ok(specialistService.approveVerification(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Reject specialist verification (admin only)")
    public ResponseEntity<SpecialistResponse> reject(@PathVariable String id) {
        return ResponseEntity.ok(specialistService.rejectVerification(id));
    }
}
