package com.app.mapper;

import com.app.dto.request.ProviderRequest;
import com.app.dto.response.ProviderResponse;
import com.app.entity.Provider;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface ProviderMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "personalAddress", ignore = true)
    @Mapping(target = "serviceAddress", ignore = true)
    @Mapping(target = "isActive", ignore = true)
    @Mapping(target = "isVerified", ignore = true)
    @Mapping(target = "verificationStatus", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Provider toEntity(ProviderRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(provider.getId()))")
    @Mapping(target = "userId", expression = "java(uuidToString(provider.getUser().getId()))")
    @Mapping(target = "email", source = "user.email")
    @Mapping(target = "verificationStatus", expression = "java(provider.getVerificationStatus().name())")
    @Mapping(target = "averageRating", ignore = true)
    ProviderResponse toResponse(Provider provider);

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
    void updateEntityFromRequest(ProviderRequest request, @MappingTarget Provider provider);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
