package com.app.controller;

import com.app.dto.request.ProviderRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderResponse;
import com.app.service.ProviderService;
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
@RequestMapping("/api/v1/providers")
@RequiredArgsConstructor
@Tag(name = "Providers", description = "Provider profile and discovery")
public class ProviderController {

    private final ProviderService providerService;

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create provider profile")
    public ResponseEntity<ProviderResponse> create(@Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(providerService.createProfile(request));
    }

    @GetMapping("/me/exists")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Check whether my provider profile exists")
    public ResponseEntity<Boolean> exists() {
        return ResponseEntity.ok(providerService.hasMyProfile());
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get current provider profile")
    public ResponseEntity<ProviderResponse> getMe() {
        return ResponseEntity.ok(providerService.getMyProfile());
    }

    @PostMapping("/me/verify")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Request profile verification")
    public ResponseEntity<ProviderResponse> requestVerification() {
        return ResponseEntity.ok(providerService.requestVerification());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update my provider profile")
    public ResponseEntity<ProviderResponse> update(@Valid @RequestBody ProviderRequest request) {
        return ResponseEntity.ok(providerService.updateProfile(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get provider by ID (public)")
    public ResponseEntity<ProviderResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(providerService.getById(id));
    }

    @GetMapping
    @Operation(summary = "List all verified providers (public)")
    public ResponseEntity<PageResponse<ProviderResponse>> getAll(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(providerService.getAll(PageRequest.of(page, size)));
    }

    @GetMapping("/admin/all")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List all providers for admin")
    public ResponseEntity<PageResponse<ProviderResponse>> getAllForAdmin(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(providerService.getAllForAdmin(PageRequest.of(page, size)));
    }

    @GetMapping("/admin/pending")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "List providers pending verification")
    public ResponseEntity<PageResponse<ProviderResponse>> getPending(
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(providerService.getByStatus("PENDING", PageRequest.of(page, size)));
    }

    @GetMapping("/nearby")
    @Operation(summary = "Find nearby providers by geolocation (public)")
    public ResponseEntity<PageResponse<ProviderResponse>> getNearby(
            @RequestParam double lat,
            @RequestParam double lng,
            @RequestParam(defaultValue = "25.0") double radiusKm,
            @RequestParam(defaultValue = "0") @Min(0) int page,
            @RequestParam(defaultValue = "20") @Min(1) @Max(100) int size) {
        return ResponseEntity.ok(providerService.getNearby(lat, lng, radiusKm, PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/approve")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Approve provider verification (admin only)")
    public ResponseEntity<ProviderResponse> approve(@PathVariable String id) {
        return ResponseEntity.ok(providerService.approveVerification(id));
    }

    @PatchMapping("/{id}/reject")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Reject provider verification (admin only)")
    public ResponseEntity<ProviderResponse> reject(@PathVariable String id) {
        return ResponseEntity.ok(providerService.rejectVerification(id));
    }
}
