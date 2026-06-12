package com.cs308.backend.dto.auth;

import jakarta.validation.Validation;
import jakarta.validation.Validator;
import jakarta.validation.ValidatorFactory;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertTrue;

class RegisterRequestLongFirstNameValidationTest {

    @Test
    void rejectsFirstNameLongerThanFiftyCharacters() {
        try (ValidatorFactory factory = Validation.buildDefaultValidatorFactory()) {
            Validator validator = factory.getValidator();
            String firstName = "abcdefghijklmnopqrstuvwxyzabcdefghijklmnopqrstuvwxy";
            RegisterRequest request = new RegisterRequest(firstName, "User", "user@example.com", "", "secret123");

            boolean hasFirstNameViolation = validator.validate(request).stream()
                .anyMatch(violation -> "firstName".equals(violation.getPropertyPath().toString()));

            assertTrue(hasFirstNameViolation);
        }
    }
}
