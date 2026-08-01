package com.app.service.impl;

import com.app.dto.request.LoginRequest;
import com.app.dto.request.RefreshTokenRequest;
import com.app.dto.request.RegisterRequest;
import com.app.dto.response.AuthResponse;
import com.app.entity.Address;
import com.app.entity.Client;
import com.app.entity.Provider;
import com.app.entity.User;
import com.app.entity.enums.AuthProvider;
import com.app.entity.enums.Role;
import com.app.exception.BadRequestException;
import com.app.mapper.AddressMapper;
import com.app.mapper.ClientMapper;
import com.app.mapper.ProviderMapper;
import com.app.repository.ClientRepository;
import com.app.repository.ProviderRepository;
import com.app.repository.UserRepository;
import com.app.security.JwtService;
import com.app.service.AuthService;
import com.app.service.EmailValidationService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@Slf4j
@RequiredArgsConstructor
public class AuthServiceImpl implements AuthService {

    private final UserRepository userRepository;
    private final ClientRepository clientRepository;
    private final ProviderRepository providerRepository;
    private final PasswordEncoder passwordEncoder;
    private final JwtService jwtService;
    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final ClientMapper clientMapper;
    private final ProviderMapper providerMapper;
    private final AddressMapper addressMapper;
    private final EmailValidationService emailValidationService;

    @Override
    @Transactional
    public AuthResponse register(RegisterRequest request) {
        log.info("Registering new user with role {}", request.getRole());
        
        if (request.getRole() == Role.ADMIN) {
            throw new BadRequestException("L'inscription en tant qu'ADMIN n'est pas autorisée via cette API");
        }

        emailValidationService.validateEmailExists(request.getEmail());

        if (userRepository.existsByEmail(request.getEmail())) {
            throw new BadRequestException("Email already registered: " + request.getEmail());
        }

        User user = User.builder()
                .email(request.getEmail())
                .password(passwordEncoder.encode(request.getPassword()))
                .role(request.getRole())
                .provider(AuthProvider.LOCAL)
                .isActive(true)
                .build();

        User savedUser = userRepository.save(user);
        createProfileForRole(savedUser, request);

        UserDetails userDetails = userDetailsService.loadUserByUsername(savedUser.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return buildAuthResponse(accessToken, refreshToken, savedUser);
    }

    @Override
    public AuthResponse login(LoginRequest request) {
        log.info("Authenticating user {}", request.getEmail());
        authenticationManager.authenticate(
                new UsernamePasswordAuthenticationToken(request.getEmail(), request.getPassword())
        );

        User user = userRepository.findByEmail(request.getEmail())
                .orElseThrow(() -> new BadRequestException("User not found"));

        UserDetails userDetails = userDetailsService.loadUserByUsername(user.getEmail());
        String accessToken = jwtService.generateAccessToken(userDetails);
        String refreshToken = jwtService.generateRefreshToken(userDetails);

        return buildAuthResponse(accessToken, refreshToken, user);
    }

    @Override
    public AuthResponse refreshToken(RefreshTokenRequest request) {
        final String token = request.getRefreshToken();
        final String userEmail = jwtService.extractUsername(token);
        log.info("Refreshing token for user {}", userEmail);

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

        return buildAuthResponse(newAccessToken, newRefreshToken, user);
    }

    private AuthResponse buildAuthResponse(String accessToken, String refreshToken, User user) {
        AuthResponse response = AuthResponse.of(accessToken, refreshToken, user.getEmail(), user.getRole().name(), user.getId().toString());
        response.setProfileCompleted(isProfileCompleted(user));
        return response;
    }

    private boolean isProfileCompleted(User user) {
        if (user.getRole() == Role.CLIENT) {
            return clientRepository.findByUserEmail(user.getEmail()).isPresent();
        }
        if (user.getRole() == Role.PROVIDER) {
            return providerRepository.findByUserEmail(user.getEmail()).isPresent();
        }
        return true;
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

        if (user.getRole() == Role.PROVIDER) {
            if (request.getProviderProfile() == null) {
                throw new BadRequestException("Provider profile is required for PROVIDER registration");
            }

            Provider provider = providerMapper.toEntity(request.getProviderProfile());
            provider.setUser(user);

            if (request.getProviderProfile().getPersonalAddress() != null) {
                provider.setPersonalAddress(addressMapper.toEntity(request.getProviderProfile().getPersonalAddress()));
            }
            if (request.getProviderProfile().getServiceAddress() != null) {
                provider.setServiceAddress(addressMapper.toEntity(request.getProviderProfile().getServiceAddress()));
            }

            providerRepository.save(provider);
        }
    }
}
