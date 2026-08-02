package com.app.config;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.autoconfigure.ImportAutoConfiguration;
import org.springframework.boot.autoconfigure.context.ConfigurationPropertiesAutoConfiguration;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.test.context.TestPropertySource;
import software.amazon.awssdk.services.s3.S3Client;

import static org.junit.jupiter.api.Assertions.assertNotNull;

@SpringBootTest(classes = {R2Config.class, R2StorageProperties.class})
@ImportAutoConfiguration(ConfigurationPropertiesAutoConfiguration.class)
@TestPropertySource(properties = {
        "cloudflare.r2.access-key-id=test-access-key",
        "cloudflare.r2.secret-access-key=test-secret-key",
        "cloudflare.r2.endpoint=https://account.r2.cloudflarestorage.com",
        "cloudflare.r2.bucket=springappointment",
        "cloudflare.r2.region=auto",
})
class R2ConfigTest {

    @Autowired
    private S3Client s3Client;

    @Test
    void s3ClientBeanIsCreatedWhenCredentialsAreProvided() {
        assertNotNull(s3Client);
    }
}
