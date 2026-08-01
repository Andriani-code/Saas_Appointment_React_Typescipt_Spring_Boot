package com.app.service.impl;

import com.app.exception.BadRequestException;
import com.app.service.FileStorageService;
import jakarta.annotation.PostConstruct;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
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

    public FileStorageServiceImpl(@Value("${app.upload.dir:./uploads}") String uploadDir) {
        this.uploadDir = Paths.get(uploadDir).toAbsolutePath().normalize();
    }

    @PostConstruct
    public void init() {
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
        Path targetDir = uploadDir.resolve(safeFolder).normalize();
        if (!targetDir.startsWith(uploadDir)) {
            throw new BadRequestException("Invalid upload folder");
        }

        try {
            Files.createDirectories(targetDir);
        } catch (IOException e) {
            throw new IllegalStateException("Could not create upload directory: " + targetDir, e);
        }

        String extension = getExtension(file.getOriginalFilename());
        String filename = UUID.randomUUID().toString().toLowerCase(Locale.ROOT) + extension;
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

        Path file = uploadDir.resolve(url.substring(URL_PREFIX.length())).normalize();
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
