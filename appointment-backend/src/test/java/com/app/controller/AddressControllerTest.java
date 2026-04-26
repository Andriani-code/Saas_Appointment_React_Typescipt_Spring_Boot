package com.app.controller;

import com.app.dto.request.AddressRequest;
import com.app.dto.response.AddressResponse;
import com.app.service.AddressService;
import com.app.security.JwtService;
import com.app.security.CustomUserDetailsService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc;
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest;
import org.springframework.boot.test.mock.mockito.MockBean;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.authority.SimpleGrantedAuthority;
import org.springframework.security.test.context.support.WithMockUser;
import org.springframework.test.web.servlet.MockMvc;

import java.util.List;
import java.util.UUID;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.ArgumentMatchers.anyString;
import static org.mockito.Mockito.when;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.authentication;
import static org.springframework.security.test.web.servlet.request.SecurityMockMvcRequestPostProcessors.csrf;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.*;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.*;

@WebMvcTest(AddressController.class)
@AutoConfigureMockMvc
public class AddressControllerTest {

    @Autowired
    private MockMvc mockMvc;

    @MockBean
    private AddressService addressService;

    @MockBean
    private JwtService jwtService;

    @MockBean
    private CustomUserDetailsService customUserDetailsService;

    private final ObjectMapper mapper = new ObjectMapper();

    @Test
    @WithMockUser(username = "user-123")
    void createAddress_returnsCreated() throws Exception {
        AddressResponse mockResponse = new AddressResponse();
        mockResponse.setId(UUID.randomUUID().toString());
        mockResponse.setCountry("FR");
        mockResponse.setCity("Paris");
        when(addressService.create(anyString(), any(AddressRequest.class))).thenReturn(mockResponse);

        AddressRequest request = new AddressRequest();
        request.setCountry("FR");
        request.setCity("Paris");

        mockMvc.perform(post("/api/v1/addresses")
                        .with(csrf())
                        .with(authentication(new UsernamePasswordAuthenticationToken("user-123", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(request)))
                .andExpect(status().isCreated())
                .andExpect(jsonPath("$.country").value("FR"))
                .andExpect(jsonPath("$.city").value("Paris"));
    }

    @Test
    @WithMockUser(username = "user-123")
    void getByUser_returnsList() throws Exception {
        AddressResponse resp1 = new AddressResponse();
        resp1.setId(UUID.randomUUID().toString());
        resp1.setCountry("FR");
        resp1.setCity("Lyon");
        when(addressService.getByUser(anyString())).thenReturn(List.of(resp1));

        mockMvc.perform(get("/api/v1/addresses/user/user-123")
                        .with(csrf()))
                .andExpect(status().isOk())
                .andExpect(jsonPath("[0].city").value("Lyon"));
    }

    @Test
    @WithMockUser(username = "user-123")
    void updateAddress_returnsOk() throws Exception {
        AddressResponse updated = new AddressResponse();
        updated.setId("addr-1");
        updated.setCountry("DE");
        when(addressService.update(anyString(), anyString(), any(AddressRequest.class))).thenReturn(updated);

        AddressRequest req = new AddressRequest();
        req.setCountry("DE");
        req.setCity("Berlin");

        mockMvc.perform(put("/api/v1/addresses/addr-1")
                        .with(csrf())
                        .with(authentication(new UsernamePasswordAuthenticationToken("user-123", null, List.of(new SimpleGrantedAuthority("ROLE_USER")))))
                        .contentType(MediaType.APPLICATION_JSON)
                        .content(mapper.writeValueAsString(req)))
                .andExpect(status().isOk())
                .andExpect(jsonPath("$.country").value("DE"));
    }

    @Test
    @WithMockUser(username = "admin", roles = {"ADMIN"})
    void deleteAddress_returnsNoContent() throws Exception {
        mockMvc.perform(delete("/api/v1/addresses/addr-1")
                        .with(csrf()))
                .andExpect(status().isNoContent());
    }
}
