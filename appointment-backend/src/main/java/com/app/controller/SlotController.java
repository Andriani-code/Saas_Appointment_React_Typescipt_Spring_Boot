package com.app.controller;

import com.app.dto.request.SlotGenerationRequest;
import com.app.dto.request.SlotRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SlotResponse;
import com.app.service.SlotService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.security.SecurityRequirement;
import io.swagger.v3.oas.annotations.tags.Tag;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.validation.annotation.Validated;
import org.springframework.data.domain.PageRequest;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;
import java.util.List;

@RestController
@Validated
@RequestMapping("/api/v1/slots")
@RequiredArgsConstructor
@Tag(name = "Slots", description = "Available appointment slots")
public class SlotController {

    private final SlotService slotService;

    @PostMapping
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Create a manual slot for a provider")
    public ResponseEntity<SlotResponse> createSlot(@Valid @RequestBody SlotRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(slotService.createSlot(request));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Delete a manual slot")
    public ResponseEntity<Void> deleteSlot(@PathVariable String id) {
        slotService.deleteSlot(id);
        return ResponseEntity.noContent().build();
    }

    @PostMapping("/generate")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Generate slots from availability for a date range")
    public ResponseEntity<List<SlotResponse>> generateSlots(@Valid @RequestBody SlotGenerationRequest request) {
        return ResponseEntity.status(HttpStatus.CREATED).body(slotService.generateSlots(request));
    }

    @GetMapping("/provider/{providerId}")
    @Operation(summary = "Get available slots for a provider on a date (public)")
    public ResponseEntity<List<SlotResponse>> getByProviderAndDate(
            @PathVariable String providerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate date) {
        return ResponseEntity.ok(slotService.getAvailableSlotsByProviderAndDate(providerId, date));
    }

    @GetMapping("/provider/{providerId}/range")
    @Operation(summary = "Get available slots for a provider within a date range (paginated)")
    public ResponseEntity<PageResponse<SlotResponse>> getByProviderAndRange(
            @PathVariable String providerId,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate start,
            @RequestParam @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate end,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "50") int size) {
        return ResponseEntity.ok(
                slotService.getSlotsByProviderAndDateRange(providerId, start, end, PageRequest.of(page, size)));
    }

    @PatchMapping("/{id}/block")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Block a slot")
    public ResponseEntity<SlotResponse> block(@PathVariable String id) {
        return ResponseEntity.ok(slotService.blockSlot(id));
    }

    @PatchMapping("/{id}/unblock")
    @PreAuthorize("hasRole('PROVIDER')")
    @SecurityRequirement(name = "bearerAuth")
    @Operation(summary = "Unblock a slot")
    public ResponseEntity<SlotResponse> unblock(@PathVariable String id) {
        return ResponseEntity.ok(slotService.unblockSlot(id));
    }
}
