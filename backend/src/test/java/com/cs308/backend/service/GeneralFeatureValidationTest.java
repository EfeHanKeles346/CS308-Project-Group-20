package com.cs308.backend.service;

import com.cs308.backend.dto.auth.LoginRequest;
import com.cs308.backend.model.Order;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertThrows;

class GeneralFeatureValidationTest {

    @Test
    void rejectsOrderWithoutItems() {
        Order order = new Order();
        order.setUserEmail("customer@example.com");
        OrderService orderService = new OrderService(null, null, null);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> orderService.createOrder(order)
        );

        assertEquals("Order must contain at least one item", exception.getMessage());
    }

    @Test
    void rejectsNegativeProductStock() {
        ProductManagerService productManagerService = new ProductManagerService(null);

        IllegalArgumentException exception = assertThrows(
            IllegalArgumentException.class,
            () -> productManagerService.updateStock("product-1", Map.of("stock", -1))
        );

        assertEquals("stock cannot be negative.", exception.getMessage());
    }

    @Test
    void rejectsLoginWhenFirebaseApiKeyIsMissing() {
        AuthService authService = new AuthService(null, "");
        LoginRequest request = new LoginRequest("customer@example.com", "secret123");

        IllegalStateException exception = assertThrows(
            IllegalStateException.class,
            () -> authService.login(request)
        );

        assertEquals("firebase.web-api-key is missing", exception.getMessage());
    }
}
