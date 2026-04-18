package com.app.dto.request;

import com.app.entity.enums.DayOfWeek;
import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.LocalTime;

@Data
public class AvailabilityRequest {

    @NotNull(message = "Day of week is required")
    private DayOfWeek dayOfWeek;

    @NotNull(message = "Start time is required")
    private LocalTime startTime;

    @NotNull(message = "End time is required")
    private LocalTime endTime;

    @NotNull(message = "Interval minutes is required")
    @Min(value = 15, message = "Interval must be at least 15 minutes")
    @Max(value = 480, message = "Interval must be at most 480 minutes")
    private Integer intervalMinutes;
}
