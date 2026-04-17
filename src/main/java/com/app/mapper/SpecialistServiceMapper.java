package com.app.mapper;

import com.app.dto.request.SpecialistServiceRequest;
import com.app.dto.response.SpecialistServiceResponse;
import com.app.entity.SpecialistService;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface SpecialistServiceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "specialist", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    SpecialistService toEntity(SpecialistServiceRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(service.getId()))")
    @Mapping(target = "specialistId", expression = "java(uuidToString(service.getSpecialist().getId()))")
    @Mapping(target = "specialistDisplayName", source = "specialist.displayName")
    SpecialistServiceResponse toResponse(SpecialistService service);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "specialist", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(SpecialistServiceRequest request, @MappingTarget SpecialistService service);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
