package com.app.mapper;

import com.app.dto.response.ReservationResponse;
import com.app.entity.Reservation;
import com.app.entity.Specialist;
import com.app.entity.SpecialistService;
import javax.annotation.processing.Generated;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:44+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ReservationMapperImpl implements ReservationMapper {

    @Autowired
    private SlotMapper slotMapper;

    @Override
    public ReservationResponse toResponse(Reservation r) {
        if ( r == null ) {
            return null;
        }

        ReservationResponse reservationResponse = new ReservationResponse();

        reservationResponse.setSpecialistDisplayName( rSpecialistDisplayName( r ) );
        reservationResponse.setServiceName( rServiceName( r ) );
        reservationResponse.setSlot( slotMapper.toResponse( r.getSlot() ) );
        reservationResponse.setClientMessage( r.getClientMessage() );
        reservationResponse.setCreatedAt( r.getCreatedAt() );
        reservationResponse.setDepositAmount( r.getDepositAmount() );
        reservationResponse.setDepositRequired( r.getDepositRequired() );

        reservationResponse.setId( uuidToString(r.getId()) );
        reservationResponse.setClientId( uuidToString(r.getClient().getId()) );
        reservationResponse.setClientFullName( r.getClient().getFirstName() + ' ' + r.getClient().getLastName() );
        reservationResponse.setSpecialistId( uuidToString(r.getSpecialist().getId()) );
        reservationResponse.setServiceId( uuidToString(r.getService().getId()) );
        reservationResponse.setStatus( r.getStatus().name() );

        return reservationResponse;
    }

    private String rSpecialistDisplayName(Reservation reservation) {
        if ( reservation == null ) {
            return null;
        }
        Specialist specialist = reservation.getSpecialist();
        if ( specialist == null ) {
            return null;
        }
        String displayName = specialist.getDisplayName();
        if ( displayName == null ) {
            return null;
        }
        return displayName;
    }

    private String rServiceName(Reservation reservation) {
        if ( reservation == null ) {
            return null;
        }
        SpecialistService service = reservation.getService();
        if ( service == null ) {
            return null;
        }
        String name = service.getName();
        if ( name == null ) {
            return null;
        }
        return name;
    }
}
