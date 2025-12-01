package com.nexo.server.config;

import jakarta.servlet.FilterChain;
import jakarta.servlet.ServletException;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;
import org.springframework.web.filter.OncePerRequestFilter;
import org.springframework.web.util.ContentCachingRequestWrapper;
import org.springframework.web.util.ContentCachingResponseWrapper;

import java.io.IOException;
import java.nio.charset.StandardCharsets;
import java.util.Arrays;
import java.util.List;
import java.util.UUID;

@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
@Slf4j
public class LoggingFilter extends OncePerRequestFilter {

    private static final List<String> EXCLUDED_PATHS = Arrays.asList(
        "/actuator",
        "/api/files",
        "/swagger",
        "/v3/api-docs"
    );

    private static final List<String> SENSITIVE_HEADERS = Arrays.asList(
        "authorization",
        "cookie",
        "x-auth-token"
    );

    private static final int MAX_PAYLOAD_LENGTH = 1000;

    @Override
    protected void doFilterInternal(HttpServletRequest request, HttpServletResponse response, 
            FilterChain filterChain) throws ServletException, IOException {

        // Skip logging for excluded paths
        String path = request.getRequestURI();
        if (EXCLUDED_PATHS.stream().anyMatch(path::startsWith)) {
            filterChain.doFilter(request, response);
            return;
        }

        // Generate request ID for tracing
        String requestId = UUID.randomUUID().toString().substring(0, 8);

        // Wrap request and response for content caching
        ContentCachingRequestWrapper wrappedRequest = new ContentCachingRequestWrapper(request);
        ContentCachingResponseWrapper wrappedResponse = new ContentCachingResponseWrapper(response);

        long startTime = System.currentTimeMillis();

        try {
            // Log request
            logRequest(requestId, wrappedRequest);

            // Process request
            filterChain.doFilter(wrappedRequest, wrappedResponse);

        } finally {
            // Log response
            long duration = System.currentTimeMillis() - startTime;
            logResponse(requestId, wrappedRequest, wrappedResponse, duration);

            // Copy content to response
            wrappedResponse.copyBodyToResponse();
        }
    }

    private void logRequest(String requestId, ContentCachingRequestWrapper request) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== REQUEST [").append(requestId).append("] ===\n");
        sb.append("Method: ").append(request.getMethod()).append("\n");
        sb.append("URI: ").append(request.getRequestURI());
        
        if (request.getQueryString() != null) {
            sb.append("?").append(request.getQueryString());
        }
        sb.append("\n");

        sb.append("Remote: ").append(request.getRemoteAddr()).append("\n");
        sb.append("User-Agent: ").append(request.getHeader("User-Agent")).append("\n");

        log.info(sb.toString());
    }

    private void logResponse(String requestId, ContentCachingRequestWrapper request,
            ContentCachingResponseWrapper response, long duration) {
        StringBuilder sb = new StringBuilder();
        sb.append("\n=== RESPONSE [").append(requestId).append("] ===\n");
        sb.append("Status: ").append(response.getStatus()).append("\n");
        sb.append("Duration: ").append(duration).append("ms\n");

        // Log response body for error responses
        if (response.getStatus() >= 400) {
            byte[] content = response.getContentAsByteArray();
            if (content.length > 0) {
                String body = new String(content, StandardCharsets.UTF_8);
                if (body.length() > MAX_PAYLOAD_LENGTH) {
                    body = body.substring(0, MAX_PAYLOAD_LENGTH) + "...[truncated]";
                }
                sb.append("Body: ").append(body).append("\n");
            }
        }

        // Color-code log level based on status
        if (response.getStatus() >= 500) {
            log.error(sb.toString());
        } else if (response.getStatus() >= 400) {
            log.warn(sb.toString());
        } else {
            log.info(sb.toString());
        }
    }
}


