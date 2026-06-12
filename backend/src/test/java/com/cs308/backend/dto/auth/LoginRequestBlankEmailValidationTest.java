package com.cs308.backend.dto.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class LoginRequestBlankEmailValidationTest {

    @Test
    void rejectsBlankLoginEmail() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            LoginRequest request = new LoginRequest("", "secret123");

            boolean hasEmailViolation = validator.validate(request).stream()
                .anyMatch(violation -> "email".equals(violation.getPropertyPath().toString()));

            assertTrue(hasEmailViolation);
        }
    }
}
