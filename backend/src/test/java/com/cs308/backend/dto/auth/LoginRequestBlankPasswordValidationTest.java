package com.cs308.backend.dto.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginRequestBlankPasswordValidationTest {

    @Test
    void rejectsBlankLoginPassword() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            LoginRequest request = new LoginRequest("customer@example.com", "");

            boolean hasPasswordViolation = validator.validate(request).stream()
                .anyMatch(violation -> "password".equals(violation.getPropertyPath().toString()));

            assertTrue(hasPasswordViolation);
        }
    }
}
