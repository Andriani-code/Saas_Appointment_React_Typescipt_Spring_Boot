package com.app.controller;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.service.AddressService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;
import org.springframework.validation.annotation.Validated;

import java.security.Principal;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/addresses")
@RequiredArgsConstructor
@Tag(name = "Addresses", description = "Gestion des adresses utilisateur")
public class AddressController {

    private final AddressService addressService;

    @PostMapping
    @PreAuthorize("hasAnyRole('CLIENT','PROVIDER','ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Créer une adresse")
    public ResponseEntity<AddressResponse> create(Principal principal, @Valid @RequestBody AddressRequest request) {
        String userId = principal.getName();
        return ResponseEntity.status(HttpStatus.CREATED).body(addressService.create(userId, request));
    }

    @GetMapping("/user/{userId}")
    @PreAuthorize("hasAnyRole('CLIENT','PROVIDER','ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Récupérer les adresses d'un utilisateur")
    public ResponseEntity<List<AddressResponse>> getByUser(@PathVariable String userId) {
        return ResponseEntity.ok(addressService.getByUser(userId));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('CLIENT','PROVIDER','ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Mettre à jour une adresse")
    public ResponseEntity<AddressResponse> update(Principal principal, @PathVariable String id, @Valid @RequestBody AddressRequest request) {
        String userId = principal.getName();
        return ResponseEntity.ok(addressService.update(userId, id, request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Supprimer une adresse")
    public ResponseEntity<Void> delete(@PathVariable String id) {
        addressService.delete(id);
        return ResponseEntity.noContent().build();
    }
}
