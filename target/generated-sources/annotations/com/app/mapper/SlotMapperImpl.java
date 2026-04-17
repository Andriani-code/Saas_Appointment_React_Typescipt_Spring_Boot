package com.app.mapper;

import com.app.dto.response.SlotResponse;
import com.app.entity.AvailableSlot;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:44+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class SlotMapperImpl implements SlotMapper {

    @Override
    public SlotResponse toResponse(AvailableSlot slot) {
        if ( slot == null ) {
            return null;
        }

        SlotResponse slotResponse = new SlotResponse();

        slotResponse.setDate( slot.getDate() );
        slotResponse.setEndTime( slot.getEndTime() );
        slotResponse.setStartTime( slot.getStartTime() );

        slotResponse.setId( uuidToString(slot.getId()) );
        slotResponse.setSpecialistId( uuidToString(slot.getSpecialist().getId()) );
        slotResponse.setServiceId( slot.getService() != null ? uuidToString(slot.getService().getId()) : null );
        slotResponse.setStatus( slot.getStatus().name() );

        return slotResponse;
    }
}
