package com.cs308.backend.dto.auth;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.Size;

public record RegisterRequest(
    @NotBlank @Size(min = 1, max = 50) String firstName,
    @NotBlank @Size(min = 1, max = 50) String lastName,
    @NotBlank @Email String email,
    String phone,
    @NotBlank @Size(min = 6, max = 100) String password
) {
}
