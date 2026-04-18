package com.app.mapper;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.entity.Address;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface AddressMapper {

    Address toEntity(AddressRequest request);

    AddressResponse toResponse(Address address);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    void updateEntityFromRequest(AddressRequest request, @MappingTarget Address address);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
