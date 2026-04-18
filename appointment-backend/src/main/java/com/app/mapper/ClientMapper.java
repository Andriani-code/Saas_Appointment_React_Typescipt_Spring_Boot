package com.app.mapper;

import com.app.dto.request.ClientRequest;
import com.app.dto.response.ClientResponse;
import com.app.entity.Client;
import org.mapstruct.*;

import java.util.UUID;

@Mapper(componentModel = "spring", uses = {AddressMapper.class})
public interface ClientMapper {

    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    Client toEntity(ClientRequest request);

    @Mapping(target = "id", expression = "java(uuidToString(client.getId()))")
    @Mapping(target = "userId", expression = "java(uuidToString(client.getUser().getId()))")
    @Mapping(target = "email", source = "user.email")
    ClientResponse toResponse(Client client);

    @BeanMapping(nullValuePropertyMappingStrategy = NullValuePropertyMappingStrategy.IGNORE)
    @Mapping(target = "id", ignore = true)
    @Mapping(target = "user", ignore = true)
    @Mapping(target = "address", ignore = true)
    @Mapping(target = "createdAt", ignore = true)
    @Mapping(target = "updatedAt", ignore = true)
    void updateEntityFromRequest(ClientRequest request, @MappingTarget Client client);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
