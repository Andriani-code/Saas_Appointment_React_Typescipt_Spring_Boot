package com.app.service;

import com.app.dto.request.SlotGenerationRequest;
import com.app.dto.response.PageResponse;
import com.app.dto.response.SlotResponse;
import org.springframework.data.domain.Pageable;

import java.time.LocalDate;
import java.util.List;

import com.app.dto.request.SlotRequest;
public interface SlotService {
    SlotResponse createSlot(SlotRequest request);
    void deleteSlot(String slotId);
    List<SlotResponse> generateSlots(SlotGenerationRequest request);
    List<SlotResponse> getAvailableSlotsBySpecialistAndDate(String specialistId, LocalDate date);
    PageResponse<SlotResponse> getSlotsBySpecialistAndDateRange(String specialistId, LocalDate start, LocalDate end, Pageable pageable);
    SlotResponse blockSlot(String slotId);
    SlotResponse unblockSlot(String slotId);
}
