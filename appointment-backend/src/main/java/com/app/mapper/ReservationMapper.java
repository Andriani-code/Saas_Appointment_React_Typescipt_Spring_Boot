package com.app.mapper;

import com.app.dto.response.ReservationResponse;
import com.app.entity.Reservation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.UUID;

@Mapper(componentModel = "spring", uses = {SlotMapper.class})
public interface ReservationMapper {

    @Mapping(target = "id", expression = "java(uuidToString(r.getId()))")
    @Mapping(target = "clientId", expression = "java(uuidToString(r.getClient().getId()))")
    @Mapping(target = "clientFullName", expression = "java(r.getClient().getFirstName() + ' ' + r.getClient().getLastName())")
    @Mapping(target = "providerId", expression = "java(uuidToString(r.getProvider().getId()))")
    @Mapping(target = "providerDisplayName", source = "provider.displayName")
    @Mapping(target = "serviceId", expression = "java(uuidToString(r.getService().getId()))")
    @Mapping(target = "serviceName", source = "service.name")
    @Mapping(target = "slot", source = "slot")
    @Mapping(target = "status", expression = "java(r.getStatus().name())")
    ReservationResponse toResponse(Reservation r);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
