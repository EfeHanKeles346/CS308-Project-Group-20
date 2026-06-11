package com.cs308.backend.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class SalesManagerServiceValidationTest {

    private final SalesManagerService salesManagerService = new SalesManagerService(null, null);

    @Test
    void rejectsPriceThatIsNotGreaterThanZero() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> salesManagerService.updatePrice("product-1", Map.of("price", 0))
        );

        assertEquals("price must be greater than zero", exception.getMessage());
    }

    @Test
    void rejectsDiscountOutsideAllowedRange() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> salesManagerService.applyDiscount("product-1", Map.of("discountPercent", 100))
        );

        assertEquals("discountPercent must be between 1 and 99", exception.getMessage());
    }
}
