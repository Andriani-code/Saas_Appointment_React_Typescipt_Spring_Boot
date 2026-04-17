package com.app.mapper;

import com.app.dto.response.ReviewResponse;
import com.app.entity.Review;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:44+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class ReviewMapperImpl implements ReviewMapper {

    @Override
    public ReviewResponse toResponse(Review r) {
        if ( r == null ) {
            return null;
        }

        ReviewResponse reviewResponse = new ReviewResponse();

        reviewResponse.setComment( r.getComment() );
        reviewResponse.setCreatedAt( r.getCreatedAt() );
        reviewResponse.setIsVisible( r.getIsVisible() );
        reviewResponse.setRating( r.getRating() );

        reviewResponse.setId( uuidToString(r.getId()) );
        reviewResponse.setClientId( uuidToString(r.getClient().getId()) );
        reviewResponse.setClientFullName( r.getClient().getFirstName() + ' ' + r.getClient().getLastName() );
        reviewResponse.setSpecialistId( uuidToString(r.getSpecialist().getId()) );
        reviewResponse.setReservationId( uuidToString(r.getReservation().getId()) );

        return reviewResponse;
    }
}
