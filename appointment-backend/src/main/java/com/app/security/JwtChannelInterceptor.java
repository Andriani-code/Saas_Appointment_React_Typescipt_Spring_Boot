package com.app.security;

import io.jsonwebtoken.JwtException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.messaging.Message;
import org.springframework.messaging.MessageChannel;
import org.springframework.messaging.simp.stomp.StompCommand;
import org.springframework.messaging.simp.stomp.StompHeaderAccessor;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.messaging.support.MessageHeaderAccessor;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

import java.util.List;

/**
 * Authenticates STOMP CONNECT frames by extracting the JWT from the
 * "Authorization" header (or "token" header) and loading the user.
 *
 * Without this interceptor, WebSocket sessions are anonymous and the
 * "/user" destinations cannot be resolved, which causes the frontend
 * to keep reconnecting in an error loop.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class JwtChannelInterceptor implements ChannelInterceptor, Ordered {

    private static final String AUTH_HEADER = "Authorization";
    private static final String BEARER_PREFIX = "Bearer ";
    private static final String TOKEN_HEADER = "token";

    private final JwtService jwtService;
    private final CustomUserDetailsService userDetailsService;

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {
        StompHeaderAccessor accessor =
                MessageHeaderAccessor.getAccessor(message, StompHeaderAccessor.class);

        if (accessor == null || !StompCommand.CONNECT.equals(accessor.getCommand())) {
            return message;
        }

        String token = extractToken(accessor);
        if (!StringUtils.hasText(token)) {
            log.warn("STOMP CONNECT without a token — connection will be anonymous");
            return message;
        }

        try {
            String userEmail = jwtService.extractUsername(token);
            if (StringUtils.hasText(userEmail)) {
                UserDetails userDetails = userDetailsService.loadUserByUsername(userEmail);
                if (jwtService.isTokenValid(token, userDetails)) {
                    UsernamePasswordAuthenticationToken authentication =
                            new UsernamePasswordAuthenticationToken(
                                    userDetails,
                                    null,
                                    userDetails.getAuthorities()
                            );
                    accessor.setUser(authentication);
                    log.debug("STOMP authenticated user: {}", userEmail);
                } else {
                    log.warn("STOMP token invalid or expired for user: {}", userEmail);
                }
            }
        } catch (JwtException | IllegalArgumentException ex) {
            log.warn("STOMP JWT parsing failed: {}", ex.getMessage());
        } catch (Exception ex) {
            log.warn("STOMP authentication failed: {}", ex.getMessage());
        }

        return message;
    }

    private String extractToken(StompHeaderAccessor accessor) {
        // 1) Standard "Authorization: Bearer <jwt>"
        List<String> authHeaders = accessor.getNativeHeader(AUTH_HEADER);
        if (authHeaders != null && !authHeaders.isEmpty()) {
            String value = authHeaders.get(0);
            if (StringUtils.hasText(value) && value.startsWith(BEARER_PREFIX)) {
                return value.substring(BEARER_PREFIX.length()).trim();
            }
            return value;
        }

        // 2) "token" header fallback
        List<String> tokenHeaders = accessor.getNativeHeader(TOKEN_HEADER);
        if (tokenHeaders != null && !tokenHeaders.isEmpty()) {
            return tokenHeaders.get(0);
        }

        return null;
    }

    /**
     * Must run before Spring Security's SecurityContextChannelInterceptor so the
     * Principal we set on the CONNECT frame is available when the session is
     * created. Without this, @MessageMapping handlers get an empty
     * SecurityContext -> SecurityUtils.getCurrentUserEmail() throws -> the
     * frontend reconnects forever (error loop).
     */
    @Override
    public int getOrder() {
        return Ordered.HIGHEST_PRECEDENCE;
    }
}
