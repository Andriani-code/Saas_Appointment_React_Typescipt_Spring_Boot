package com.app.mapper;

import com.app.dto.response.ReviewResponse;
import com.app.entity.Review;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface ReviewMapper {

    @Mapping(target = "id", expression = "java(uuidToString(r.getId()))")
    @Mapping(target = "clientId", expression = "java(uuidToString(r.getClient().getId()))")
    @Mapping(target = "clientFullName", expression = "java(r.getClient().getFirstName() + ' ' + r.getClient().getLastName())")
    @Mapping(target = "specialistId", expression = "java(uuidToString(r.getSpecialist().getId()))")
    @Mapping(target = "reservationId", expression = "java(uuidToString(r.getReservation().getId()))")
    ReviewResponse toResponse(Review r);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
