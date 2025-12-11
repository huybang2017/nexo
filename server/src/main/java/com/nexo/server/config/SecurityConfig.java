package com.nexo.server.config;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.nexo.server.dto.common.ApiResponse;
import com.nexo.server.security.JwtAuthenticationEntryPoint;
import com.nexo.server.security.JwtAuthenticationFilter;
import com.nexo.server.security.oauth2.CustomOAuth2UserService;
import com.nexo.server.security.oauth2.OAuth2AuthenticationFailureHandler;
import com.nexo.server.security.oauth2.OAuth2AuthenticationSuccessHandler;
import lombok.RequiredArgsConstructor;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.AuthenticationProvider;
import org.springframework.security.authentication.dao.DaoAuthenticationProvider;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.annotation.web.configuration.EnableWebSecurity;
import org.springframework.security.config.annotation.web.configurers.AbstractHttpConfigurer;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;
import org.springframework.web.cors.CorsConfigurationSource;
import org.springframework.web.cors.UrlBasedCorsConfigurationSource;

import jakarta.servlet.http.HttpServletResponse;
import java.util.Arrays;
import java.util.List;

@Configuration
@EnableWebSecurity
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthenticationFilter jwtAuthenticationFilter;
    private final JwtAuthenticationEntryPoint jwtAuthenticationEntryPoint;
    private final UserDetailsService userDetailsService;
    private final CustomOAuth2UserService customOAuth2UserService;
    private final OAuth2AuthenticationSuccessHandler oAuth2SuccessHandler;
    private final OAuth2AuthenticationFailureHandler oAuth2FailureHandler;
    private final ObjectMapper objectMapper;

    @Value("${app.cors.allowed-origins}")
    private String allowedOrigins;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        http
            .cors(cors -> cors.configurationSource(corsConfigurationSource()))
            .csrf(AbstractHttpConfigurer::disable)
            .sessionManagement(session -> 
                session.sessionCreationPolicy(SessionCreationPolicy.IF_REQUIRED)  // Allow session for OAuth2 flow
                    .sessionFixation().migrateSession())
            .exceptionHandling(ex -> ex
                .authenticationEntryPoint(jwtAuthenticationEntryPoint)
                .accessDeniedHandler((request, response, accessDeniedException) -> {
                    // Skip JSON error for OAuth2 and error pages
                    String requestPath = request.getRequestURI();
                    if (requestPath != null && (
                        requestPath.startsWith("/oauth2/") || 
                        requestPath.startsWith("/api/oauth2/") ||
                        requestPath.startsWith("/error")
                    )) {
                        response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                        return;
                    }
                    
                    response.setContentType(MediaType.APPLICATION_JSON_VALUE);
                    response.setStatus(HttpServletResponse.SC_FORBIDDEN);
                    ApiResponse<Void> apiResponse = ApiResponse.error("Access Denied: " + accessDeniedException.getMessage());
                    objectMapper.writeValue(response.getOutputStream(), apiResponse);
                }))
            .authorizeHttpRequests(auth -> auth
                // Public endpoints
                .requestMatchers("/api/auth/**").permitAll()
                .requestMatchers("/api/public/**").permitAll()
                .requestMatchers("/api/password/**").permitAll()
                .requestMatchers("/api/email/verify").permitAll()
                .requestMatchers("/api/payment/webhook/**").permitAll()
                .requestMatchers("/api/payment/mock/**").permitAll()
                .requestMatchers("/api/files/**").permitAll()  // Allow file access (files are protected by UUID paths)
                .requestMatchers("/oauth2/**").permitAll()
                .requestMatchers("/api/oauth2/**").permitAll()  // Allow OAuth2 with /api prefix
                .requestMatchers("/error", "/error/**").permitAll()  // Allow error pages
                .requestMatchers("/swagger-ui/**", "/v3/api-docs/**", "/swagger-ui.html").permitAll()
                .requestMatchers(HttpMethod.OPTIONS, "/**").permitAll()
                
                // Admin endpoints
                .requestMatchers("/api/admin/**").hasRole("ADMIN")
                
                // User endpoints (BORROWER, LENDER, and ADMIN can access)
                .requestMatchers("/api/loans/**").hasAnyRole("BORROWER", "LENDER", "ADMIN")
                .requestMatchers("/api/repayments/**").hasAnyRole("BORROWER", "LENDER", "ADMIN")
                .requestMatchers("/api/investments/**").hasAnyRole("BORROWER", "LENDER")
                .requestMatchers("/api/marketplace/**").hasAnyRole("BORROWER", "LENDER")
                .requestMatchers("/api/credit-score/**").hasAnyRole("BORROWER", "LENDER", "ADMIN")
                .requestMatchers("/api/kyc-score/me/**").hasAnyRole("BORROWER", "LENDER")
                .requestMatchers("/api/kyc-score/admin/**").hasRole("ADMIN")
                
                // Authenticated endpoints
                .anyRequest().authenticated()
            )
            .oauth2Login(oauth2 -> oauth2
                .authorizationEndpoint(auth -> auth
                    .baseUri("/api/oauth2/authorization"))
                .redirectionEndpoint(redirect -> redirect
                    .baseUri("/oauth2/callback/*"))  // Keep original callback URL to match application.yml
                .userInfoEndpoint(userInfo -> userInfo
                    .userService(customOAuth2UserService))
                .successHandler(oAuth2SuccessHandler)
                .failureHandler(oAuth2FailureHandler)
            )
            .authenticationProvider(authenticationProvider())
            .addFilterBefore(jwtAuthenticationFilter, UsernamePasswordAuthenticationFilter.class);

        return http.build();
    }

    @Bean
    public CorsConfigurationSource corsConfigurationSource() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowedOrigins(Arrays.asList(allowedOrigins.split(",")));
        config.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
        config.setAllowedHeaders(List.of("*"));
        config.setExposedHeaders(List.of("X-Request-ID", "Authorization"));
        config.setAllowCredentials(true);
        config.setMaxAge(3600L);

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        return source;
    }

    @Bean
    public AuthenticationProvider authenticationProvider() {
        DaoAuthenticationProvider provider = new DaoAuthenticationProvider();
        provider.setUserDetailsService(userDetailsService);
        provider.setPasswordEncoder(passwordEncoder());
        return provider;
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration config) throws Exception {
        return config.getAuthenticationManager();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder(12);
    }
}

