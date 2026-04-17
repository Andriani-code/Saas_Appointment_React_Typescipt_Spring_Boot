package com.app.dto.response;

import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilityResponse {
    private String id;
    private String specialistId;
    private String dayOfWeek;
    private LocalTime startTime;
    private LocalTime endTime;
    private Integer intervalMinutes;
    private Boolean isActive;
}
