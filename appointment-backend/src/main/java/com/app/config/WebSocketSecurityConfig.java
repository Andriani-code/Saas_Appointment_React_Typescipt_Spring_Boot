package com.app.config;

import org.springframework.context.annotation.Configuration;
import org.springframework.security.config.annotation.web.socket.EnableWebSocketSecurity;

/**
 * Activates Spring Security for WebSocket STOMP messages.
 *
 * Registers the SecurityContextChannelInterceptor which propagates the
 * Principal set by {@link com.app.security.JwtChannelInterceptor} into the
 * SecurityContextHolder for every inbound STOMP message.
 *
 * Without this, the @MessageMapping handlers run with an empty
 * SecurityContext and SecurityUtils.getCurrentUserEmail() throws,
 * which makes the frontend reconnect forever (error loop).
 */
@Configuration
@EnableWebSocketSecurity
public class WebSocketSecurityConfig {
}