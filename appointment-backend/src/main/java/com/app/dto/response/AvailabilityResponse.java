package com.app.dto.response;

import lombok.Data;

import java.time.LocalDate;
import java.time.LocalTime;

@Data
public class AvailabilityResponse {
    private String id;
    private String providerId;
    private LocalDate date;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer intervalMinutes;
    private Boolean isActive;
}
