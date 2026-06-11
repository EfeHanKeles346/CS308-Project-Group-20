package com.cs308.backend.service;

import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class ProductManagerServiceValidationTest {

    private final ProductManagerService productManagerService = new ProductManagerService(null);

    @Test
    void rejectsCategoryWithoutName() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productManagerService.addCategory(Map.of("name", " "))
        );

        assertEquals("Category name is required.", exception.getMessage());
    }

    @Test
    void rejectsProductWithoutBrand() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productManagerService.addProduct(Map.of())
        );

        assertEquals("Brand is required.", exception.getMessage());
    }

    @Test
    void rejectsUnsupportedOrderStatus() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productManagerService.updateOrderStatus(
                "order-1",
                Map.of("status", "UNKNOWN")
            )
        );

        assertEquals("Unsupported order status.", exception.getMessage());
    }

    @Test
    void rejectsUnsupportedCommentDecision() {
        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productManagerService.decideComment(
                "product-1",
                "comment-1",
                Map.of("status", "REMOVED")
            )
        );

        assertEquals(
            "Comment status must be ACCEPTED, REJECTED, or PENDING.",
            exception.getMessage()
        );
    }
}
