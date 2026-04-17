package com.app.mapper;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.entity.Address;
import javax.annotation.processing.Generated;
import org.springframework.stereotype.Component;

@Generated(
    value = "org.mapstruct.ap.MappingProcessor",
    date = "2026-04-17T18:01:43+0300",
    comments = "version: 1.5.5.Final, compiler: Eclipse JDT (IDE) 3.46.0.v20260407-0427, environment: Java 21.0.10 (Eclipse Adoptium)"
)
@Component
public class AddressMapperImpl implements AddressMapper {

    @Override
    public Address toEntity(AddressRequest request) {
        if ( request == null ) {
            return null;
        }

        Address.AddressBuilder address = Address.builder();

        address.addressLine( request.getAddressLine() );
        address.city( request.getCity() );
        address.country( request.getCountry() );
        address.district( request.getDistrict() );
        address.latitude( request.getLatitude() );
        address.longitude( request.getLongitude() );
        address.region( request.getRegion() );

        return address.build();
    }

    @Override
    public AddressResponse toResponse(Address address) {
        if ( address == null ) {
            return null;
        }

        AddressResponse addressResponse = new AddressResponse();

        addressResponse.setAddressLine( address.getAddressLine() );
        addressResponse.setCity( address.getCity() );
        addressResponse.setCountry( address.getCountry() );
        addressResponse.setDistrict( address.getDistrict() );
        addressResponse.setId( uuidToString( address.getId() ) );
        addressResponse.setLatitude( address.getLatitude() );
        addressResponse.setLongitude( address.getLongitude() );
        addressResponse.setRegion( address.getRegion() );

        return addressResponse;
    }

    @Override
    public void updateEntityFromRequest(AddressRequest request, Address address) {
        if ( request == null ) {
            return;
        }

        if ( request.getAddressLine() != null ) {
            address.setAddressLine( request.getAddressLine() );
        }
        if ( request.getCity() != null ) {
            address.setCity( request.getCity() );
        }
        if ( request.getCountry() != null ) {
            address.setCountry( request.getCountry() );
        }
        if ( request.getDistrict() != null ) {
            address.setDistrict( request.getDistrict() );
        }
        if ( request.getLatitude() != null ) {
            address.setLatitude( request.getLatitude() );
        }
        if ( request.getLongitude() != null ) {
            address.setLongitude( request.getLongitude() );
        }
        if ( request.getRegion() != null ) {
            address.setRegion( request.getRegion() );
        }
    }
}
