package com.app.service.impl;

import com.app.config.R2StorageProperties;
import com.app.exception.BadRequestException;
import com.app.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;
import software.amazon.awssdk.core.sync.RequestBody;
import software.amazon.awssdk.services.s3.S3Client;
import software.amazon.awssdk.services.s3.model.DeleteObjectRequest;
import software.amazon.awssdk.services.s3.model.PutObjectRequest;

import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.Locale;
import java.util.Set;
import java.util.UUID;

@Slf4j
@Service
public class FileStorageServiceImpl implements FileStorageService {

    private static final long MAX_FILE_SIZE = 5 * 1024 * 1024;
    private static final Set<String> ALLOWED_CONTENT_TYPES = Set.of(
            "image/jpeg", "image/png", "image/webp", "image/gif", "image/bmp", "image/avif"
    );
    private static final Set<String> ALLOWED_EXTENSIONS = Set.of(
            "jpg", "jpeg", "png", "webp", "gif", "bmp", "avif"
    );
    private static final String URL_PREFIX = "/uploads/";

    private final Path uploadDir;
    private final R2StorageProperties r2Properties;
    private final S3Client s3Client;

    public FileStorageServiceImpl(
            @Value("${app.upload.dir:./uploads}") String uploadDir,
            R2StorageProperties r2Properties,
            ObjectProvider<S3Client> s3ClientProvider) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
        this.r2Properties = r2Properties;
        this.s3Client = r2Properties.isEnabled() ? s3ClientProvider.getIfAvailable() : null;
    }

    @PostConstruct
    public void init() {
        if (r2Properties.isEnabled()) {
            log.info("Storage R2 activé (bucket: {}, endpoint: {})", r2Properties.getBucket(), r2Properties.getEndpoint());
            return;
        }
        try {
            Files.createDirectories(uploadDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + uploadDir, e);
        }
    }

    @Override
    public String store(MultipartFile file, String folder) {
        validate(file);

        String safeFolder = sanitizeFolder(folder);
        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString().toLowerCase(Locale.ROOT) + extension;
        String key = safeFolder + "/" + filename;

        if (r2Properties.isEnabled() && s3Client != null) {
            storeToR2(file, key);
            log.debug("Stored file in R2: {}", key);
            return URL_PREFIX + key;
        }

        Path targetDir = uploadDir.resolve(safeFolder).normalize();
        if (!targetDir.startsWith(uploadDir)) {
            throw new BadRequestException("Invalid upload folder");
        }

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + targetDir, e);
        }

        Path target = targetDir.resolve(filename);

        try {
            file.transferTo(target);
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file: " + filename, e);
        }

        log.debug("Stored file: {}", target);
        return URL_PREFIX + safeFolder + "/" + filename;
    }

    @Override
    public void delete(String url) {
        if (url == null || url.isBlank() || !url.startsWith(URL_PREFIX)) {
            return;
        }

        String key = url.substring(URL_PREFIX.length());

        if (r2Properties.isEnabled() && s3Client != null) {
            try {
                s3Client.deleteObject(DeleteObjectRequest.builder()
                        .bucket(r2Properties.getBucket())
                        .key(key)
                        .build());
                log.debug("Deleted file from R2: {}", key);
            } catch (Exception e) {
                log.warn("Could not delete file {}: {}", key, e.getMessage());
            }
            return;
        }

        Path file = uploadDir.resolve(key).normalize();
        if (!file.startsWith(uploadDir)) {
            return;
        }

        try {
            Files.deleteIfExists(file);
            log.debug("Deleted file: {}", file);
        } catch (IOException e) {
            log.warn("Could not delete file {}: {}", file, e.getMessage());
        }
    }

    private void storeToR2(MultipartFile file, String key) {
        try (InputStream inputStream = file.getInputStream()) {
            s3Client.putObject(
                    PutObjectRequest.builder()
                            .bucket(r2Properties.getBucket())
                            .key(key)
                            .contentType(file.getContentType())
                            .build(),
                    RequestBody.fromInputStream(inputStream, file.getSize())
            );
        } catch (IOException e) {
            throw new IllegalStateException("Failed to store file in R2: " + key, e);
        }
    }

    private void validate(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is required");
        }
        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Only image files are allowed (jpeg, png, webp, gif, bmp, avif)");
        }
        if (file.getSize() > MAX_FILE_SIZE) {
            throw new BadRequestException("File size must not exceed 5MB");
        }
    }

    private String getExtension(String originalFilename) {
        if (originalFilename == null || originalFilename.isBlank()) {
            return "";
        }
        int dotIndex = originalFilename.lastIndexOf('.');
        if (dotIndex < 0 || dotIndex == originalFilename.length() - 1) {
            return "";
        }
        String extension = originalFilename.substring(dotIndex + 1).toLowerCase(Locale.ROOT);
        return ALLOWED_EXTENSIONS.contains(extension) ? "." + extension : "";
    }

    private String sanitizeFolder(String folder) {
        if (folder == null || folder.isBlank()) {
            return "misc";
        }
        String sanitized = folder.replaceAll("[^a-zA-Z0-9_-]", "");
        return sanitized.isBlank() ? "misc" : sanitized.toLowerCase(Locale.ROOT);
    }
}
