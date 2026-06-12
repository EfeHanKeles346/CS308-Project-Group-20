package com.cs308.backend.dto.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestShortPasswordValidationTest {

    @Test
    void rejectsRegisterPasswordShorterThanSixCharacters() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            RegisterRequest request = new RegisterRequest("Test", "User", "user@example.com", "", "12345");

            boolean hasPasswordViolation = validator.validate(request).stream()
                .anyMatch(violation -> "password".equals(violation.getPropertyPath().toString()));

            assertTrue(hasPasswordViolation);
        }
    }
}
