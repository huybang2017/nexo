package com.nexo.server.services;

import com.nexo.server.exceptions.BadRequestException;
import com.nexo.server.exceptions.BusinessException;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.util.StringUtils;
import org.springframework.web.multipart.MultipartFile;

import jakarta.annotation.PostConstruct;
import java.io.IOException;
import java.io.InputStream;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.nio.file.StandardCopyOption;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Service
@Slf4j
public class FileStorageService {

    @Value("${app.file.upload-dir:uploads}")
    private String uploadDir;

    @Value("${app.file.max-size:52428800}") // 50MB default
    private long maxFileSize;

    private static final List<String> ALLOWED_EXTENSIONS = Arrays.asList(
        "jpg", "jpeg", "png", "pdf", "gif"
    );

    private static final List<String> ALLOWED_CONTENT_TYPES = Arrays.asList(
        "image/jpeg", "image/png", "image/gif", "application/pdf"
    );

    private Path fileStorageLocation;

    @PostConstruct
    public void init() {
        this.fileStorageLocation = Paths.get(uploadDir).toAbsolutePath().normalize();
        try {
            Files.createDirectories(this.fileStorageLocation);
            // Create subdirectories
            Files.createDirectories(this.fileStorageLocation.resolve("kyc"));
            Files.createDirectories(this.fileStorageLocation.resolve("loans"));
            Files.createDirectories(this.fileStorageLocation.resolve("avatars"));
            log.info("File storage initialized at: {}", this.fileStorageLocation);
        } catch (IOException ex) {
            throw new BusinessException("Could not create upload directory: " + ex.getMessage());
        }
    }

    /**
     * Store file and return the stored file path
     */
    public String storeFile(MultipartFile file, String subDirectory) {
        validateFile(file);

        String originalFileName = StringUtils.cleanPath(file.getOriginalFilename());
        String fileExtension = getFileExtension(originalFileName);
        String newFileName = UUID.randomUUID().toString() + "." + fileExtension;

        try {
            Path targetLocation = this.fileStorageLocation.resolve(subDirectory).resolve(newFileName);
            Files.createDirectories(targetLocation.getParent());
            
            try (InputStream inputStream = file.getInputStream()) {
                Files.copy(inputStream, targetLocation, StandardCopyOption.REPLACE_EXISTING);
            }

            log.info("File stored: {}", targetLocation);
            return subDirectory + "/" + newFileName;
        } catch (IOException ex) {
            throw new BusinessException("Could not store file " + originalFileName + ": " + ex.getMessage());
        }
    }

    /**
     * Store KYC document
     */
    public String storeKycDocument(MultipartFile file, Long userId, String documentType) {
        String subDir = "kyc/" + userId;
        return storeFile(file, subDir);
    }

    /**
     * Store loan document
     */
    public String storeLoanDocument(MultipartFile file, Long loanId) {
        String subDir = "loans/" + loanId;
        return storeFile(file, subDir);
    }

    /**
     * Store avatar
     */
    public String storeAvatar(MultipartFile file, Long userId) {
        String subDir = "avatars";
        return storeFile(file, subDir);
    }

    /**
     * Delete file
     */
    public boolean deleteFile(String filePath) {
        try {
            Path targetLocation = this.fileStorageLocation.resolve(filePath);
            return Files.deleteIfExists(targetLocation);
        } catch (IOException ex) {
            log.error("Could not delete file {}: {}", filePath, ex.getMessage());
            return false;
        }
    }

    /**
     * Get file as bytes
     */
    public byte[] getFile(String filePath) {
        try {
            Path targetLocation = this.fileStorageLocation.resolve(filePath);
            if (!Files.exists(targetLocation)) {
                throw new BadRequestException("File not found: " + filePath);
            }
            return Files.readAllBytes(targetLocation);
        } catch (IOException ex) {
            throw new BusinessException("Could not read file: " + ex.getMessage());
        }
    }

    /**
     * Get file path
     */
    public Path getFilePath(String filePath) {
        return this.fileStorageLocation.resolve(filePath);
    }

    /**
     * Get full URL for file
     */
    public String getFileUrl(String filePath) {
        if (filePath == null || filePath.isEmpty()) {
            return null;
        }
        return "/api/files/" + filePath;
    }

    private void validateFile(MultipartFile file) {
        if (file == null || file.isEmpty()) {
            throw new BadRequestException("File is empty");
        }

        if (file.getSize() > maxFileSize) {
            throw new BadRequestException("File size exceeds maximum limit of " + (maxFileSize / 1024 / 1024) + "MB");
        }

        String originalFileName = file.getOriginalFilename();
        if (originalFileName == null || originalFileName.contains("..")) {
            throw new BadRequestException("Invalid file name");
        }

        String extension = getFileExtension(originalFileName).toLowerCase();
        if (!ALLOWED_EXTENSIONS.contains(extension)) {
            throw new BadRequestException("File type not allowed. Allowed types: " + String.join(", ", ALLOWED_EXTENSIONS));
        }

        String contentType = file.getContentType();
        if (contentType == null || !ALLOWED_CONTENT_TYPES.contains(contentType)) {
            throw new BadRequestException("Invalid file content type");
        }
    }

    private String getFileExtension(String fileName) {
        if (fileName == null || !fileName.contains(".")) {
            return "";
        }
        return fileName.substring(fileName.lastIndexOf(".") + 1);
    }
}


