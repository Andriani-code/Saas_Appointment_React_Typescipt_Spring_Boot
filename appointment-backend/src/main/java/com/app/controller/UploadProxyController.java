package com.app.controller;

import com.app.config.R2EnabledCondition;
import com.app.config.R2StorageProperties;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.context.annotation.Conditional;
import org.springframework.http.CacheControl;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.RestController;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;
import software.amazon.awssdk.services.s3.model.S3Exception;

import java.time.Duration;

/**
 * Sert les images stockées dans Cloudflare R2 via /uploads/** afin que le
 * bucket reste privé. Actif uniquement lorsque R2 est configuré ; sinon le
 * ResourceHandler local de WebConfig prend le relais.
 */
@Slf4j
@RestController
@RequiredArgsConstructor
@Conditional(R2EnabledCondition.class)
public class UploadProxyController {

    private final S3Client s3Client;
    private final R2StorageProperties r2Properties;

    @GetMapping("/uploads/{folder}/{filename:.+}")
    public ResponseEntity<byte[]> serve(
            @PathVariable String folder,
            @PathVariable String filename) {
        String key = folder + "/" + filename;
        try {
            var response = s3Client.getObject(
                    GetObjectRequest.builder()
                            .bucket(r2Properties.getBucket())
                            .key(key)
                            .build());
            byte[] bytes = response.readAllBytes();
            String contentType = response.response().contentType();
            MediaType mediaType = contentType != null
                    ? MediaType.parseMediaType(contentType)
                    : MediaType.APPLICATION_OCTET_STREAM;
            return ResponseEntity.ok()
                    .contentType(mediaType)
                    .cacheControl(CacheControl.maxAge(Duration.ofDays(30)).cachePublic())
                    .body(bytes);
        } catch (NoSuchKeyException e) {
            return ResponseEntity.notFound().build();
        } catch (S3Exception e) {
            log.warn("Failed to serve {} from R2 ({}): {}", key, e.statusCode(), e.getMessage());
            return ResponseEntity.status(e.statusCode()).build();
        } catch (Exception e) {
            log.warn("Failed to serve {} from R2: {}", key, e.getMessage());
            return ResponseEntity.internalServerError().build();
        }
    }
}
