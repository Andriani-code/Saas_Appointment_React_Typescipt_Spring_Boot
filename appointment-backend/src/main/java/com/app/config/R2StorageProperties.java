package com.app.config;

import lombok.Getter;
import lombok.Setter;
import org.springframework.boot.context.properties.ConfigurationProperties;
import org.springframework.stereotype.Component;

/**
 * Configuration du stockage Cloudflare R2 (compatible S3).
 * Le stockage R2 n'est activé que si les quatre propriétés sont renseignées.
 */
@Component
@ConfigurationProperties(prefix = "cloudflare.r2")
@Getter
@Setter
public class R2StorageProperties {

    private String accessKeyId = "";
    private String secretAccessKey = "";
    private String endpoint = "";
    private String bucket = "";
    private String region = "auto";

    public boolean isEnabled() {
        return !accessKeyId.isBlank()
                && !secretAccessKey.isBlank()
                && !endpoint.isBlank()
                && !bucket.isBlank();
    }
}
