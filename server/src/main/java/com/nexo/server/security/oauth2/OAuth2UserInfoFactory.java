package com.nexo.server.security.oauth2;

import com.nexo.server.exceptions.BadRequestException;

import java.util.Map;

public class OAuth2UserInfoFactory {

    public static OAuth2UserInfo getOAuth2UserInfo(String registrationId, Map<String, Object> attributes) {
        if (registrationId.equalsIgnoreCase("google")) {
            return new GoogleOAuth2UserInfo(attributes);
        } else {
            throw new BadRequestException("Login with " + registrationId + " is not supported");
        }
    }
}

