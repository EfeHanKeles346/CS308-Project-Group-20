package com.cs308.backend.dto.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestBlankLastNameValidationTest {

    @Test
    void rejectsBlankLastName() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            RegisterRequest request = new RegisterRequest("Test", "", "user@example.com", "", "secret123");

            boolean hasLastNameViolation = validator.validate(request).stream()
                .anyMatch(violation -> "lastName".equals(violation.getPropertyPath().toString()));

            assertTrue(hasLastNameViolation);
        }
    }
}
