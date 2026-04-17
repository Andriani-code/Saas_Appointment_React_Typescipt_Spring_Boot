package com.app.mapper;

import com.app.dto.request.SpecialistRequest;
import com.app.dto.response.SpecialistResponse;
import com.app.entity.Specialist;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface SpecialistMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "personalAddress", ignore = true)
    @Mapping(target = "serviceAddress", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "verificationStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Specialist toEntity(SpecialistRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(specialist.getId()))")
    @Mapping(target = "userId", expression = "java(uuidToString(specialist.getUser().getId()))")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "verificationStatus", expression = "java(specialist.getVerificationStatus().name())")
    @Mapping(target = "averageRating", ignore = true)
    SpecialistResponse toResponse(Specialist specialist);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "personalAddress", ignore = true)
    @Mapping(target = "serviceAddress", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "verificationStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(SpecialistRequest request, @MappingTarget Specialist specialist);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
