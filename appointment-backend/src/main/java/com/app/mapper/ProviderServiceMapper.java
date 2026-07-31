package com.app.mapper;

import com.app.dto.request.ProviderServiceRequest;
import com.app.dto.response.ProviderServiceResponse;
import com.app.entity.ProviderService;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface ProviderServiceMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "provider", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    ProviderService toEntity(ProviderServiceRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(service.getId()))")
    @Mapping(target = "providerId", expression = "java(uuidToString(service.getProvider().getId()))")
    @Mapping(target = "providerDisplayName", source = "provider.displayName")
    ProviderServiceResponse toResponse(ProviderService service);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "provider", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ProviderServiceRequest request, @MappingTarget ProviderService service);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
