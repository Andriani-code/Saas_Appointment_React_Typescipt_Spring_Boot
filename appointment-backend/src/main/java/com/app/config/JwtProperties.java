package com.app.config;

import com.app.security.JwtSecretProvider;
import lombok.Getter;
import lombok.Setter;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;
import org.springframework.util.StringUtils;

@Component
@ConfigurationProperties(prefix = "jwt")
@Getter
@Setter
public class JwtProperties {
    private String secret;
    private long accessTokenExpiration;
    private long refreshTokenExpiration;

    private final ObjectProvider<JwtSecretProvider> jwtSecretProvider;

    public JwtProperties(ObjectProvider<JwtSecretProvider> jwtSecretProvider) {
        this.jwtSecretProvider = jwtSecretProvider;
    }

    public String resolveSecret() {
        JwtSecretProvider provider = jwtSecretProvider.getIfAvailable();
        if (provider != null) {
            String managedSecret = provider.getJwtSecret();
            if (StringUtils.hasText(managedSecret)) {
                return managedSecret;
            }
        }

        return secret;
    }
}
