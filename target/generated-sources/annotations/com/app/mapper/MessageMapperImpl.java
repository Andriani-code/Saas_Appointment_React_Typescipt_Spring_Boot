package com.app.mapper;

import com.app.dto.response.MessageResponse;
import com.app.entity.Message;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:44+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class MessageMapperImpl implements MessageMapper {

    @Override
    public MessageResponse toResponse(Message m) {
        if ( m == null ) {
            return null;
        }

        MessageResponse messageResponse = new MessageResponse();

        messageResponse.setContent( m.getContent() );
        messageResponse.setCreatedAt( m.getCreatedAt() );
        messageResponse.setIsRead( m.getIsRead() );

        messageResponse.setId( uuidToString(m.getId()) );
        messageResponse.setConversationId( uuidToString(m.getConversation().getId()) );
        messageResponse.setSenderUserId( uuidToString(m.getSenderUser().getId()) );
        messageResponse.setSenderType( m.getSenderType().name() );

        return messageResponse;
    }
}
