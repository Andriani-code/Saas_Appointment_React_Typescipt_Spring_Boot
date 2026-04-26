package com.app.mapper;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.entity.Address;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    Address toEntity(AddressRequest request);

    AddressResponse toResponse(Address address);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    @Mapping(target = "userId", ignore = true)
    void updateEntityFromRequest(AddressRequest request, @MappingTarget Address address);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
