package com.app.mapper;

import com.app.dto.request.AvailabilityRequest;
import com.app.dto.response.AvailabilityResponse;
import com.app.entity.Availability;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface AvailabilityMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "specialist", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "dayOfWeek", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    @Mapping(target = "intervalMinutes", ignore = true)
    Availability toEntity(AvailabilityRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(availability.getId()))")
    @Mapping(target = "specialistId", expression = "java(uuidToString(availability.getSpecialist().getId()))")
    AvailabilityResponse toResponse(Availability availability);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "specialist", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "dayOfWeek", ignore = true)
    @Mapping(target = "startTime", ignore = true)
    @Mapping(target = "endTime", ignore = true)
    @Mapping(target = "intervalMinutes", ignore = true)
    void updateEntityFromRequest(AvailabilityRequest request, @MappingTarget Availability availability);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
