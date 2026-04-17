package com.app.mapper;

import com.app.dto.response.MessageResponse;
import com.app.entity.Message;
import org.mapstruct.Mapper;
import org.mapstruct.Mapping;

import java.util.UUID;

@Mapper(componentModel = "spring")
public interface MessageMapper {

    @Mapping(target = "id", expression = "java(uuidToString(m.getId()))")
    @Mapping(target = "conversationId", expression = "java(uuidToString(m.getConversation().getId()))")
    @Mapping(target = "senderUserId", expression = "java(uuidToString(m.getSenderUser().getId()))")
    @Mapping(target = "senderType", expression = "java(m.getSenderType().name())")
    MessageResponse toResponse(Message m);

    default String uuidToString(UUID uuid) {
        return uuid == null ? null : uuid.toString();
    }
}
