package com.app.config;

import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.messaging.Message;
import org.springframework.messaging.simp.SimpMessageType;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.authorization.AuthorizationManager;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;
import org.springframework.security.messaging.access.intercept.MessageMatcherDelegatingAuthorizationManager;

/**
 * Activates Spring Security for WebSocket STOMP messages.
 *
 * The default rules of @EnableWebSocketSecurity require an authenticated user
 * on EVERY inbound frame, including the STOMP CONNECT. But JwtChannelInterceptor
 * authenticates the connection while processing that CONNECT frame, so a strict
 * default denies it before the user can be set, leaving the session anonymous
 * and making the frontend reconnect in an error loop.
 *
 * We therefore permit the handshake/control frames and only require an
 * authenticated session for SUBSCRIBE and SEND. The Principal set on the
 * CONNECT frame is stored on the STOMP session and reused for the subsequent
 * frames; SecurityContextChannelInterceptor (activated by this annotation)
 * propagates it to the SecurityContextHolder so @MessageMapping handlers see
 * an authenticated user.
 *
 * CSRF is disabled for WebSockets: the application authenticates with a Bearer
 * JWT carried in the STOMP CONNECT frame (no cookies), so the default
 * XorCsrfChannelInterceptor would reject every connection with a
 * MissingCsrfTokenException. Spring Security looks up a ChannelInterceptor bean
 * named "csrfChannelInterceptor" and uses it instead of the CSRF one; we provide
 * a no-op interceptor so CONNECT frames are not required to carry a CSRF token.
 */
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {

    @Bean(name = "csrfChannelInterceptor")
    public ChannelInterceptor csrfChannelInterceptor() {
        return new ChannelInterceptor() {
        };
    }

    @Bean
    public AuthorizationManager<Message<?>> messageAuthorizationManager(
            MessageMatcherDelegatingAuthorizationManager.Builder messages) {
        messages
                .simpTypeMatchers(
                        SimpMessageType.CONNECT,
                        SimpMessageType.CONNECT_ACK,
                        SimpMessageType.HEARTBEAT,
                        SimpMessageType.UNSUBSCRIBE,
                        SimpMessageType.DISCONNECT,
                        SimpMessageType.DISCONNECT_ACK
                ).permitAll()
                .simpTypeMatchers(SimpMessageType.SUBSCRIBE, SimpMessageType.MESSAGE)
                        .authenticated()
                .anyMessage().authenticated();
        return messages.build();
    }
}
