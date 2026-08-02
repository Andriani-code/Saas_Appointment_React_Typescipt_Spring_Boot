package com.app.service.impl;

import com.app.dto.request.SlotRequest;
import com.app.dto.response.SlotResponse;
import com.app.entity.Availability;
import com.app.entity.AvailableSlot;
import com.app.entity.Provider;
import com.app.entity.User;
import com.app.entity.enums.Role;
import com.app.entity.enums.SlotStatus;
import com.app.exception.BadRequestException;
import com.app.exception.ResourceNotFoundException;
import com.app.exception.UnauthorizedException;
import com.app.mapper.SlotMapper;
import com.app.repository.AvailabilityRepository;
import com.app.repository.AvailableSlotRepository;
import com.app.repository.ProviderRepository;
import com.app.util.SecurityUtils;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.ArgumentCaptor;
import org.mockito.Mock;
import org.mockito.MockedStatic;
import org.mockito.junit.jupiter.MockitoExtension;

import java.time.LocalDate;
import java.time.LocalTime;
import java.util.Optional;
import java.util.UUID;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mockStatic;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
class SlotServiceImplTest {

    @Mock
    private AvailableSlotRepository slotRepository;

    @Mock
    private AvailabilityRepository availabilityRepository;

    @Mock
    private ProviderRepository providerRepository;

    @Mock
    private SlotMapper slotMapper;

    private SlotServiceImpl service() {
        return new SlotServiceImpl(slotRepository, availabilityRepository, providerRepository, slotMapper);
    }

    private Provider provider() {
        return Provider.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("provider@example.com").role(Role.PROVIDER).build())
                .firstName("Sam")
                .lastName("Provider")
                .build();
    }

    @Test
    void createSlotRejectsPastDate() {
        SlotServiceImpl service = service();
        SlotRequest request = new SlotRequest();
        request.setDate(LocalDate.now().minusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(9, 30));

        assertThrows(BadRequestException.class, () -> service.createSlot(request));
    }

    @Test
    void createSlotRejectsInvalidTimeRange() {
        SlotServiceImpl service = service();
        SlotRequest request = new SlotRequest();
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(10, 0));
        request.setEndTime(LocalTime.of(10, 0));

        assertThrows(BadRequestException.class, () -> service.createSlot(request));
    }

    @Test
    void createSlotRejectsUnactivatedDate() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        SlotRequest request = new SlotRequest();
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(9, 30));

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(availabilityRepository.findByProviderIdAndDate(provider.getId(), request.getDate()))
                .thenReturn(Optional.empty());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            assertThrows(BadRequestException.class, () -> service.createSlot(request));
        }
    }

    @Test
    void createSlotRejectsDuplicateStartTime() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        SlotRequest request = new SlotRequest();
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(9, 30));

        Availability availability = Availability.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .date(request.getDate())
                .isActive(true)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(availabilityRepository.findByProviderIdAndDate(provider.getId(), request.getDate()))
                .thenReturn(Optional.of(availability));
        when(slotRepository.existsByProviderIdAndDateAndStartTime(provider.getId(), request.getDate(), request.getStartTime()))
                .thenReturn(true);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            assertThrows(BadRequestException.class, () -> service.createSlot(request));
        }
    }

    @Test
    void createSlotSavesAvailableSlot() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        SlotRequest request = new SlotRequest();
        request.setDate(LocalDate.now().plusDays(1));
        request.setStartTime(LocalTime.of(9, 0));
        request.setEndTime(LocalTime.of(9, 30));

        Availability availability = Availability.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .date(request.getDate())
                .isActive(true)
                .build();

        AvailableSlot saved = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .availability(availability)
                .date(request.getDate())
                .startTime(request.getStartTime())
                .endTime(request.getEndTime())
                .status(SlotStatus.AVAILABLE)
                .build();

        SlotResponse response = new SlotResponse();
        response.setId(saved.getId().toString());

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(availabilityRepository.findByProviderIdAndDate(provider.getId(), request.getDate()))
                .thenReturn(Optional.of(availability));
        when(slotRepository.existsByProviderIdAndDateAndStartTime(any(), any(), any())).thenReturn(false);
        when(slotRepository.save(any(AvailableSlot.class))).thenReturn(saved);
        when(slotMapper.toResponse(saved)).thenReturn(response);

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            SlotResponse result = service.createSlot(request);

            assertEquals(saved.getId().toString(), result.getId());

            ArgumentCaptor<AvailableSlot> captor = ArgumentCaptor.forClass(AvailableSlot.class);
            verify(slotRepository).save(captor.capture());
            assertEquals(SlotStatus.AVAILABLE, captor.getValue().getStatus());
            assertEquals(request.getStartTime(), captor.getValue().getStartTime());
        }
    }

    @Test
    void deleteSlotRejectsBookedSlot() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        AvailableSlot booked = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .status(SlotStatus.BOOKED)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(booked.getId())).thenReturn(Optional.of(booked));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            assertThrows(BadRequestException.class, () -> service.deleteSlot(booked.getId().toString()));
        }
    }

    @Test
    void deleteSlotRejectsSlotOwnedByAnotherProvider() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        Provider other = Provider.builder()
                .id(UUID.randomUUID())
                .user(User.builder().email("other@example.com").role(Role.PROVIDER).build())
                .build();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(other)
                .status(SlotStatus.AVAILABLE)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            assertThrows(UnauthorizedException.class, () -> service.deleteSlot(slot.getId().toString()));
        }
    }

    @Test
    void deleteSlotDeletesOwnedAvailableSlot() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .status(SlotStatus.AVAILABLE)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            service.deleteSlot(slot.getId().toString());

            verify(slotRepository).delete(slot);
        }
    }

    @Test
    void blockSlotMarksSlotAsBlocked() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .status(SlotStatus.AVAILABLE)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));
        when(slotRepository.save(any(AvailableSlot.class))).thenReturn(slot);
        when(slotMapper.toResponse(slot)).thenReturn(new SlotResponse());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            service.blockSlot(slot.getId().toString());

            ArgumentCaptor<AvailableSlot> captor = ArgumentCaptor.forClass(AvailableSlot.class);
            verify(slotRepository).save(captor.capture());
            assertEquals(SlotStatus.BLOCKED, captor.getValue().getStatus());
        }
    }

    @Test
    void unblockSlotMarksSlotAsAvailable() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .status(SlotStatus.BLOCKED)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));
        when(slotRepository.save(any(AvailableSlot.class))).thenReturn(slot);
        when(slotMapper.toResponse(slot)).thenReturn(new SlotResponse());

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            service.unblockSlot(slot.getId().toString());

            ArgumentCaptor<AvailableSlot> captor = ArgumentCaptor.forClass(AvailableSlot.class);
            verify(slotRepository).save(captor.capture());
            assertEquals(SlotStatus.AVAILABLE, captor.getValue().getStatus());
        }
    }

    @Test
    void unblockSlotRejectsNonBlockedSlot() {
        SlotServiceImpl service = service();
        Provider provider = provider();

        AvailableSlot slot = AvailableSlot.builder()
                .id(UUID.randomUUID())
                .provider(provider)
                .status(SlotStatus.AVAILABLE)
                .build();

        when(providerRepository.findByUserEmail("provider@example.com")).thenReturn(Optional.of(provider));
        when(slotRepository.findById(slot.getId())).thenReturn(Optional.of(slot));

        try (MockedStatic<SecurityUtils> securityUtils = mockStatic(SecurityUtils.class)) {
            securityUtils.when(SecurityUtils::getCurrentUserEmail).thenReturn("provider@example.com");

            assertThrows(BadRequestException.class, () -> service.unblockSlot(slot.getId().toString()));
        }
    }
}
