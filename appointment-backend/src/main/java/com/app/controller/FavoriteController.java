package com.app.controller;

import com.app.dto.response.FavoriteResponse;
import com.app.service.FavoriteService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/v1/favorites")
@RequiredArgsConstructor
@SecurityRequirement(name = "bearerAuth")
@Tag(name = "Favorites", description = "Client favorite providers")
public class FavoriteController {

    private final FavoriteService favoriteService;

    @PostMapping("/{providerId}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Add a provider to my favorites")
    public ResponseEntity<FavoriteResponse> add(@PathVariable String providerId) {
        return ResponseEntity.status(HttpStatus.CREATED).body(favoriteService.add(providerId));
    }

    @DeleteMapping("/{providerId}")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Remove a provider from my favorites")
    public ResponseEntity<Void> remove(@PathVariable String providerId) {
        favoriteService.remove(providerId);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/me")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "List my favorite providers")
    public ResponseEntity<List<FavoriteResponse>> getMyFavorites() {
        return ResponseEntity.ok(favoriteService.getMyFavorites());
    }

    @GetMapping("/{providerId}/status")
    @PreAuthorize("hasRole('CLIENT')")
    @Operation(summary = "Check whether I favorited a provider")
    public ResponseEntity<Boolean> isFavorite(@PathVariable String providerId) {
        return ResponseEntity.ok(favoriteService.isFavorite(providerId));
    }
}
