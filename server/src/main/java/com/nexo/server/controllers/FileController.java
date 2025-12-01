package com.nexo.server.controllers;

import com.nexo.server.services.FileStorageService;
import io.swagger.v3.oas.annotations.Operation;
import io.swagger.v3.oas.annotations.tags.Tag;
import lombok.RequiredArgsConstructor;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.io.IOException;
import java.net.MalformedURLException;
import java.nio.file.Path;

@RestController
@RequestMapping("/api/files")
@RequiredArgsConstructor
@Tag(name = "File", description = "File serving APIs")
public class FileController {

    private final FileStorageService fileStorageService;

    @GetMapping("/{subDir}/{fileName}")
    @Operation(summary = "Get file by path")
    public ResponseEntity<Resource> getFile(
            @PathVariable String subDir,
            @PathVariable String fileName) throws MalformedURLException {
        String filePath = subDir + "/" + fileName;
        return serveFile(filePath);
    }

    @GetMapping("/{subDir}/{subDir2}/{fileName}")
    @Operation(summary = "Get file by nested path")
    public ResponseEntity<Resource> getNestedFile(
            @PathVariable String subDir,
            @PathVariable String subDir2,
            @PathVariable String fileName) throws MalformedURLException {
        String filePath = subDir + "/" + subDir2 + "/" + fileName;
        return serveFile(filePath);
    }

    private ResponseEntity<Resource> serveFile(String filePath) throws MalformedURLException {
        Path path = fileStorageService.getFilePath(filePath);
        Resource resource = new UrlResource(path.toUri());

        if (!resource.exists()) {
            return ResponseEntity.notFound().build();
        }

        String contentType = "application/octet-stream";
        String fileName = path.getFileName().toString().toLowerCase();

        if (fileName.endsWith(".jpg") || fileName.endsWith(".jpeg")) {
            contentType = "image/jpeg";
        } else if (fileName.endsWith(".png")) {
            contentType = "image/png";
        } else if (fileName.endsWith(".gif")) {
            contentType = "image/gif";
        } else if (fileName.endsWith(".pdf")) {
            contentType = "application/pdf";
        }

        return ResponseEntity.ok()
                .contentType(MediaType.parseMediaType(contentType))
                .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + path.getFileName() + "\"")
                .body(resource);
    }
}


