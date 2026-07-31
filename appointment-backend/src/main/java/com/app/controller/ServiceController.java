package com.app.controller;

import com.app.dto.request.ProviderServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.ProviderServiceResponse;
import com.app.service.ProviderOfferingService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.data.domain.PageRequest;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/services")
@RequiredArgsConstructor
@Tag(name = "Provider Services", description = "Services offered by providers")
public class ServiceController {

    private final ProviderOfferingService offeringService;

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new service offering")
    public ResponseEntity<ProviderServiceResponse> create(@Valid @RequestBody ProviderServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offeringService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ResponseEntity<ProviderServiceResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(offeringService.getById(id));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get all active services for a provider")
    public ResponseEntity<List<ProviderServiceResponse>> getActiveByProvider(@PathVariable String providerId) {
        return ResponseEntity.ok(offeringService.getActiveByProvider(providerId));
    }

    @GetMapping("/provider/{providerId}/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get all services for a provider (paginated, admin/provider)")
    public ResponseEntity<PageResponse<ProviderServiceResponse>> getAll(
            @PathVariable String providerId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(offeringService.getByProvider(providerId, PageRequest.of(page, size)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a service offering")
    public ResponseEntity<ProviderServiceResponse> update(
            @PathVariable String id,
            @Valid @RequestBody ProviderServiceRequest request) {
        return ResponseEntity.ok(offeringService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Deactivate a service offering")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        offeringService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
