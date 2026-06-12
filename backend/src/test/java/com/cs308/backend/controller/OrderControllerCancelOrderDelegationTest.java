package com.cs308.backend.controller;

import com.cs308.backend.model.Order;
import com.cs308.backend.service.OrderService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class OrderControllerCancelOrderDelegationTest {

    @Test
    void cancelOrderPassesOrderIdAndUserEmail() throws Exception {
        FakeOrderService orderService = new FakeOrderService();
        OrderController controller = new OrderController(orderService);

        Order response = controller.cancelOrder("order-1", Map.of("userEmail", "user@example.com"));

        assertEquals("order-1", orderService.orderId);
        assertEquals("user@example.com", orderService.userEmail);
        assertSame(orderService.cancelResponse, response);
    }

    private static class FakeOrderService extends OrderService {
        private String orderId;
        private String userEmail;
        private final Order cancelResponse = new Order();

        FakeOrderService() {
            super(null, null, null);
        }

        @Override
        public Order cancelOrder(String orderId, String userEmail) {
            this.orderId = orderId;
            this.userEmail = userEmail;
            return cancelResponse;
        }
    }
}
