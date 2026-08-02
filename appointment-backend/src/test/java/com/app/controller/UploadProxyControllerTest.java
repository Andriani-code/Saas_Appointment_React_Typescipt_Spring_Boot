package com.app.controller;

import com.app.config.R2StorageProperties;
import org.junit.jupiter.api.Test;
import org.springframework.http.ResponseEntity;
import software.amazon.awssdk.core.ResponseInputStream;
import software.amazon.awssdk.http.AbortableInputStream;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.GetObjectRequest;
import software.amazon.awssdk.services.s3.model.GetObjectResponse;
import software.amazon.awssdk.services.s3.model.NoSuchKeyException;

import java.io.ByteArrayInputStream;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertArrayEquals;
import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.when;

class UploadProxyControllerTest {

    private R2StorageProperties properties() {
        R2StorageProperties properties = new R2StorageProperties();
        properties.setBucket("springappointment");
        return properties;
    }

    @Test
    void serveReturnsImageBytesWithContentType() throws Exception {
        S3Client s3Client = mock(S3Client.class);
        UploadProxyController controller = new UploadProxyController(s3Client, properties());

        GetObjectResponse response = GetObjectResponse.builder()
                .contentType("image/png")
                .build();
        ResponseInputStream<GetObjectResponse> inputStream =
                new ResponseInputStream<>(response, AbortableInputStream.create(
                        new ByteArrayInputStream(new byte[]{1, 2, 3})));

        when(s3Client.getObject(any(GetObjectRequest.class))).thenReturn(inputStream);

        ResponseEntity<byte[]> result = controller.serve("services", "uuid.png");

        assertEquals(200, result.getStatusCode().value());
        assertArrayEquals(new byte[]{1, 2, 3}, result.getBody());
        assertEquals("image/png", result.getHeaders().getContentType().toString());
    }

    @Test
    void serveReturnsNotFoundWhenKeyMissing() {
        S3Client s3Client = mock(S3Client.class);
        UploadProxyController controller = new UploadProxyController(s3Client, properties());

        when(s3Client.getObject(any(GetObjectRequest.class)))
                .thenThrow(NoSuchKeyException.builder().message("not found").build());

        ResponseEntity<byte[]> result = controller.serve("services", "missing.png");

        assertEquals(404, result.getStatusCode().value());
    }

    @Test
    void serveForwardsSdkErrorStatus() {
        S3Client s3Client = mock(S3Client.class);
        UploadProxyController controller = new UploadProxyController(s3Client, properties());

        when(s3Client.getObject(any(GetObjectRequest.class)))
                .thenThrow(software.amazon.awssdk.services.s3.model.S3Exception.builder()
                        .statusCode(500)
                        .message("boom")
                        .build());

        ResponseEntity<byte[]> result = controller.serve("services", "uuid.png");

        assertEquals(500, result.getStatusCode().value());
    }

    @Test
    void serveUsesOctetStreamWhenContentTypeMissing() throws Exception {
        S3Client s3Client = mock(S3Client.class);
        UploadProxyController controller = new UploadProxyController(s3Client, properties());

        GetObjectResponse response = GetObjectResponse.builder().build();
        ResponseInputStream<GetObjectResponse> inputStream =
                new ResponseInputStream<>(response, AbortableInputStream.create(
                        new ByteArrayInputStream(new byte[]{9})));

        when(s3Client.getObject(any(GetObjectRequest.class))).thenReturn(inputStream);

        ResponseEntity<byte[]> result = controller.serve("misc", "file");

        assertEquals("application/octet-stream", result.getHeaders().getContentType().toString());
    }
}
