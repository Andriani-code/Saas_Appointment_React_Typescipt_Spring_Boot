package com.app.mapper;

import com.app.dto.response.ConversationResponse;
import com.app.entity.Conversation;
import com.app.entity.Specialist;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:44+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ConversationMapperImpl implements ConversationMapper {

    @Override
    public ConversationResponse toResponse(Conversation c) {
        if ( c == null ) {
            return null;
        }

        ConversationResponse conversationResponse = new ConversationResponse();

        conversationResponse.setSpecialistDisplayName( cSpecialistDisplayName( c ) );
        conversationResponse.setCreatedAt( c.getCreatedAt() );
        conversationResponse.setIsActive( c.getIsActive() );

        conversationResponse.setId( uuidToString(c.getId()) );
        conversationResponse.setClientId( uuidToString(c.getClient().getId()) );
        conversationResponse.setClientFullName( c.getClient().getFirstName() + ' ' + c.getClient().getLastName() );
        conversationResponse.setSpecialistId( uuidToString(c.getSpecialist().getId()) );
        conversationResponse.setReservationId( c.getReservation() != null ? uuidToString(c.getReservation().getId()) : null );

        return conversationResponse;
    }

    private String cSpecialistDisplayName(Conversation conversation) {
        if ( conversation == null ) {
            return null;
        }
        Specialist specialist = conversation.getSpecialist();
        if ( specialist == null ) {
            return null;
        }
        String displayName = specialist.getDisplayName();
        if ( displayName == null ) {
            return null;
        }
        return displayName;
    }
}
