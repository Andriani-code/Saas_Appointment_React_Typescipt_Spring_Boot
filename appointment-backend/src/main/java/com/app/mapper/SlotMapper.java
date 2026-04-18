package com.app.mapper;

import com.app.dto.response.SlotResponse;
import com.app.entity.AvailableSlot;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface SlotMapper {

    @Mapping(target = "id", expression = "java(uuidToString(slot.getId()))")
    @Mapping(target = "specialistId", expression = "java(uuidToString(slot.getSpecialist().getId()))")
    @Mapping(target = "serviceId", expression = "java(slot.getService() != null ? uuidToString(slot.getService().getId()) : null)")
    @Mapping(target = "status", expression = "java(slot.getStatus().name())")
    SlotResponse toResponse(AvailableSlot slot);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
