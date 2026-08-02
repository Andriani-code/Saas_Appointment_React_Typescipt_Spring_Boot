package com.app.service.impl;

import com.app.config.R2StorageProperties;
import com.app.exception.BadRequestException;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.io.TempDir;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.mock.web.MockMultipartFile;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.nio.file.Files;
import java.nio.file.Path;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertThrows;
import static org.junit.jupiter.api.Assertions.assertTrue;
import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.mock;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;

class FileStorageServiceImplTest {

    @TempDir
    Path tempDir;

    private MockMultipartFile imageFile() {
        return new MockMultipartFile(
                "file",
                "photo.png",
                "image/png",
                new byte[]{1, 2, 3, 4}
        );
    }

    @Test
    void storeStoresLocallyWhenR2DisabledAndReturnsUploadUrl() {
        R2StorageProperties properties = new R2StorageProperties();
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, emptyProvider());

        String url = service.store(imageFile(), "services");

        assertTrue(url.startsWith("/uploads/services/"));
        Path stored = tempDir.resolve(url.substring("/uploads/".length()));
        assertTrue(Files.exists(stored));
    }

    @Test
    void storeRejectsNonImageContentType() {
        R2StorageProperties properties = new R2StorageProperties();
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, emptyProvider());

        MockMultipartFile text = new MockMultipartFile("file", "note.txt", "text/plain", "hello".getBytes());

        assertThrows(BadRequestException.class, () -> service.store(text, "misc"));
    }

    @Test
    void deleteRemovesLocalFileWhenR2Disabled() throws Exception {
        R2StorageProperties properties = new R2StorageProperties();
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, emptyProvider());

        String url = service.store(imageFile(), "services");
        Path stored = tempDir.resolve(url.substring("/uploads/".length()));
        assertTrue(Files.exists(stored));

        service.delete(url);

        assertFalse(Files.exists(stored));
    }

    @Test
    void storeUploadsToR2WhenEnabled() {
        R2StorageProperties properties = r2Properties();
        S3Client s3Client = mock(S3Client.class);
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, providerOf(s3Client));

        String url = service.store(imageFile(), "services");

        assertTrue(url.startsWith("/uploads/services/"));
        verify(s3Client).putObject(any(PutObjectRequest.class), any(software.amazon.awssdk.core.sync.RequestBody.class));
        // Aucun fichier écrit sur le disque en mode R2
        assertTrue(Files.exists(tempDir) && !Files.exists(tempDir.resolve("services")));
    }

    @Test
    void deleteSendsDeleteRequestToR2WhenEnabled() {
        R2StorageProperties properties = r2Properties();
        S3Client s3Client = mock(S3Client.class);
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, providerOf(s3Client));

        service.delete("/uploads/services/some-uuid.png");

        verify(s3Client).deleteObject(any(DeleteObjectRequest.class));
    }

    @Test
    void deleteIgnoresNonUploadUrlsEvenWhenR2Enabled() {
        R2StorageProperties properties = r2Properties();
        S3Client s3Client = mock(S3Client.class);
        FileStorageServiceImpl service = new FileStorageServiceImpl(tempDir.toString(), properties, providerOf(s3Client));

        service.delete("https://example.com/avatar.png");
        service.delete(null);

        verify(s3Client, never()).deleteObject(any(DeleteObjectRequest.class));
    }

    private R2StorageProperties r2Properties() {
        R2StorageProperties properties = new R2StorageProperties();
        properties.setAccessKeyId("access-key");
        properties.setSecretAccessKey("secret-key");
        properties.setEndpoint("https://account.r2.cloudflarestorage.com");
        properties.setBucket("springappointment");
        properties.setRegion("auto");
        return properties;
    }

    @SuppressWarnings("unchecked")
    private ObjectProvider<S3Client> emptyProvider() {
        ObjectProvider<S3Client> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(null);
        return provider;
    }

    @SuppressWarnings("unchecked")
    private ObjectProvider<S3Client> providerOf(S3Client client) {
        ObjectProvider<S3Client> provider = mock(ObjectProvider.class);
        when(provider.getIfAvailable()).thenReturn(client);
        return provider;
    }
}
