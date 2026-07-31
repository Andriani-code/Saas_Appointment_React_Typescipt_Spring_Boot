package com.app.controller;

import com.app.dto.request.AvailabilityRequest;
import com.app.dto.response.AvailabilityResponse;
import com.app.service.AvailabilityService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/availability")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Availability", description = "Provider weekly availability schedule")
public class AvailabilityController {

    private final AvailabilityService availabilityService;

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Create availability for a day of week")
    public ResponseEntity<AvailabilityResponse> create(@Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(availabilityService.create(request));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Update availability")
    public ResponseEntity<AvailabilityResponse> update(
            @PathVariable String id,
            @Valid @RequestBody AvailabilityRequest request) {
        return ResponseEntity.ok(availabilityService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Delete availability")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        availabilityService.delete(id);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('PROVIDER')")
    @Operation(summary = "Get my availabilities")
    public ResponseEntity<List<AvailabilityResponse>> getMyAvailabilities() {
        return ResponseEntity.ok(availabilityService.getMyAvailabilities());
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get availabilities for a provider (public)")
    public ResponseEntity<List<AvailabilityResponse>> getByProvider(@PathVariable String providerId) {
        return ResponseEntity.ok(availabilityService.getByProvider(providerId));
    }
}
