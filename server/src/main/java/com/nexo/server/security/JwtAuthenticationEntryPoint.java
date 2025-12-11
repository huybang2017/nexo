package com.nexo.server.security;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexo.server.dto.common.ApiResponse;
import jakarta.servlet.http.HttpServletRequest;
import jakarta.servlet.http.HttpServletResponse;
import lombok.extern.slf4j.Slf4j;
import org.springframework.http.MediaType;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.web.AuthenticationEntryPoint;
import org.springframework.stereotype.Component;

import java.io.IOException;

@Component
@Slf4j
public class JwtAuthenticationEntryPoint implements AuthenticationEntryPoint {

    private final ObjectMapper objectMapper = new ObjectMapper();

    @Override
    public void commence(HttpServletRequest request,
                         HttpServletResponse response,
                         AuthenticationException authException) throws IOException {
        // Skip JSON error for OAuth2 callbacks - let Spring Security handle them
        String requestPath = request.getRequestURI();
        if (requestPath != null && (requestPath.startsWith("/oauth2/") || requestPath.startsWith("/api/oauth2/"))) {
            // Let Spring Security handle OAuth2 callbacks
            response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);
            return;
        }

        log.error("Unauthorized error: {}", authException.getMessage());

        response.setContentType(MediaType.APPLICATION_JSON_VALUE);
        response.setStatus(HttpServletResponse.SC_UNAUTHORIZED);

        ApiResponse<Void> apiResponse = ApiResponse.error("Unauthorized: " + authException.getMessage());
        objectMapper.writeValue(response.getOutputStream(), apiResponse);
    }
}

