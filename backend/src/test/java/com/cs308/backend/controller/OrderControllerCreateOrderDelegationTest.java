package com.cs308.backend.controller;

import com.cs308.backend.model.Order;
import com.cs308.backend.service.OrderService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;

class OrderControllerCreateOrderDelegationTest {

    @Test
    void createOrderDelegatesToOrderService() throws Exception {
        FakeOrderService orderService = new FakeOrderService();
        OrderController controller = new OrderController(orderService);
        Order request = new Order();

        Order response = controller.createOrder(request);

        assertSame(request, orderService.createdOrder);
        assertSame(orderService.createdResponse, response);
    }

    private static class FakeOrderService extends OrderService {
        private Order createdOrder;
        private final Order createdResponse = new Order();

        FakeOrderService() {
            super(null, null, null);
        }

        @Override
        public Order createOrder(Order order) {
            createdOrder = order;
            return createdResponse;
        }
    }
}
