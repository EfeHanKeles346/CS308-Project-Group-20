package com.cs308.backend.dto.auth;

public record AuthResponse(
    String uid,
    String email,
    String displayName,
    String idToken,
    String refreshToken,
    String message
) {
}
