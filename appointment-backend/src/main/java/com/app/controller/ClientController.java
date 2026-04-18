package com.app.controller;

import com.app.dto.request.ClientRequest;
import com.app.dto.response.ClientResponse;
import com.app.dto.response.PageResponse;
import com.app.service.ClientService;
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

@RestController
@RequestMapping("/api/v1/clients")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Clients", description = "Client profile management")
public class ClientController {

    private final ClientService clientService;

    @PostMapping
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Create client profile")
    public ResponseEntity<ClientResponse> create(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(clientService.createProfile(request));
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Get my client profile")
    public ResponseEntity<ClientResponse> getMe() {
        return ResponseEntity.ok(clientService.getMyProfile());
    }

    @PutMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Update my client profile")
    public ResponseEntity<ClientResponse> update(@Valid @RequestBody ClientRequest request) {
        return ResponseEntity.ok(clientService.updateProfile(request));
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get client by ID (admin only)")
    public ResponseEntity<ClientResponse> getById(@PathVariable String id) {
        return ResponseEntity.ok(clientService.getById(id));
    }

    @GetMapping
    @PreAuthorize("hasRole('ADMIN')")
    @Operation(summary = "Get all clients (admin only)")
    public ResponseEntity<PageResponse<ClientResponse>> getAll(
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "20") int size) {
        return ResponseEntity.ok(clientService.getAll(PageRequest.of(page, size)));
    }
}
