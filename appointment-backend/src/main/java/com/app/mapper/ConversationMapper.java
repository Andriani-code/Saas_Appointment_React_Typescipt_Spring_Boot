package com.app.mapper;

import com.app.dto.response.ConversationResponse;
import com.app.entity.Conversation;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface ConversationMapper {

    @Mapping(target = "id", expression = "java(uuidToString(c.getId()))")
    @Mapping(target = "clientId", expression = "java(uuidToString(c.getClient().getId()))")
    @Mapping(target = "clientFullName", expression = "java(c.getClient().getFirstName() + ' ' + c.getClient().getLastName())")
    @Mapping(target = "providerId", expression = "java(uuidToString(c.getProvider().getId()))")
    @Mapping(target = "providerDisplayName", source = "provider.displayName")
    @Mapping(target = "reservationId", expression = "java(c.getReservation() != null ? uuidToString(c.getReservation().getId()) : null)")
    @Mapping(target = "unreadCount", ignore = true)
    ConversationResponse toResponse(Conversation c);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
