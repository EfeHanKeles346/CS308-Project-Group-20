package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestOrderIdTest {

    @Test
    void setsAndGetsOrderId() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setOrderId("order-1");

        assertEquals("order-1", refundRequest.getOrderId());
    }
}
