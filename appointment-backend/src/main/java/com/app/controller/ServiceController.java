package com.app.controller;

import com.app.dto.request.SpecialistServiceRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SpecialistServiceResponse;
import com.app.service.SpecialistOfferingService;
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
@Tag(name = "Specialist Services", description = "Services offered by specialists")
public class ServiceController {

    private final SpecialistOfferingService offeringService;

    @PostMapping
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a new service offering")
    public ResponseEntity<SpecialistServiceResponse> create(@Valid @RequestBody SpecialistServiceRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(offeringService.create(request));
    }

    @GetMapping("/{id}")
    @Operation(summary = "Get service by ID")
    public ResponseEntity<SpecialistServiceResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(offeringService.getById(id));
    }

    @GetMapping("/specialist/{specialistId}")
    @Operation(summary = "Get all active services for a specialist")
    public ResponseEntity<List<SpecialistServiceResponse>> getActiveBySpecialist(@PathVariable String specialistId) {
        return ResponseEntity.ok(offeringService.getActiveBySpecialist(specialistId));
    }

    @GetMapping("/specialist/{specialistId}/all")
    @PreAuthorize("hasRole('ADMIN') or hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Get all services for a specialist (paginated, admin/specialist)")
    public ResponseEntity<PageResponse<SpecialistServiceResponse>> getAll(
            @PathVariable String specialistId,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(offeringService.getBySpecialist(specialistId, PageRequest.of(page, size)));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Update a service offering")
    public ResponseEntity<SpecialistServiceResponse> update(
            @PathVariable String id,
            @Valid @RequestBody SpecialistServiceRequest request) {
        return ResponseEntity.ok(offeringService.update(id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('SPECIALIST')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Deactivate a service offering")
    public ResponseEntity<Void> deactivate(@PathVariable String id) {
        offeringService.deactivate(id);
        return ResponseEntity.noContent().build();
    }
}
