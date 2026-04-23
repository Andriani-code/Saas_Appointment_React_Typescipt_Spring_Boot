package com.app.service.impl;

import com.app.dto.request.LoginRequest;
import com.app.dto.request.RefreshTokenRequest;
import com.app.dto.request.RegisterRequest;
import com.app.dto.response.AuthResponse;
import com.app.entity.Address;
import com.app.entity.Client;
import com.app.entity.Specialist;
import com.app.entity.User;
import com.app.entity.enums.Provider;
import com.app.entity.enums.Role;
import com.app.exception.BadRequestException;
import com.app.mapper.AddressMapper;
import com.app.mapper.ClientMapper;
import com.app.mapper.SpecialistMapper;
import com.app.repository.ClientRepository;
import com.app.repository.SpecialistRepository;
import com.app.repository.UserRepository;
import com.app.security.JwtService;
import com.app.service.AuthService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final SpecialistRepository specialistRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final ClientMapper clientMapper;
    private final SpecialistMapper specialistMapper;
    private final AddressMapper addressMapper;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .provider(Provider.LOCAL)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        createProfileForRole(savedUser, request);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.of(accessToken, refreshToken, savedUser.getEmail(), savedUser.getRole().name());
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.of(accessToken, refreshToken, user.getEmail(), user.getRole().name());
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        final String token = request.getRefreshToken();
        final String userEmail = jwtService.extractUsername(token);

        if (userEmail == null) {
            throw new BadRequestException("Invalid refresh token");
        }

        UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);

        if (!jwtService.isTokenValid(token, userDetails)) {
            throw new BadRequestException("Refresh token is expired or invalid");
        }

        User user = userRepository.findByEmail(userEmail)
                .orElseThrow(() -> new BadRequestException("User not found"));

        String newAccessToken = jwtService.generateAccessToken(userDetails);
        String newRefreshToken = jwtService.generateRefreshToken(userDetails);

        return AuthResponse.of(newAccessToken, newRefreshToken, user.getEmail(), user.getRole().name());
    }

    private void createProfileForRole(User user, RegisterRequest request) {
        if (user.getRole() == Role.CLIENT) {
            if (request.getClientProfile() == null) {
                throw new BadRequestException("Client profile is required for CLIENT registration");
            }

            Client client = clientMapper.toEntity(request.getClientProfile());
            client.setUser(user);

            if (request.getClientProfile().getAddress() != null) {
                Address address = addressMapper.toEntity(request.getClientProfile().getAddress());
                client.setAddress(address);
            }

            clientRepository.save(client);
            return;
        }

        if (user.getRole() == Role.SPECIALIST) {
            if (request.getSpecialistProfile() == null) {
                throw new BadRequestException("Specialist profile is required for SPECIALIST registration");
            }

            Specialist specialist = specialistMapper.toEntity(request.getSpecialistProfile());
            specialist.setUser(user);

            if (request.getSpecialistProfile().getPersonalAddress() != null) {
                specialist.setPersonalAddress(addressMapper.toEntity(request.getSpecialistProfile().getPersonalAddress()));
            }
            if (request.getSpecialistProfile().getServiceAddress() != null) {
                specialist.setServiceAddress(addressMapper.toEntity(request.getSpecialistProfile().getServiceAddress()));
            }

            specialistRepository.save(specialist);
        }
    }
}
