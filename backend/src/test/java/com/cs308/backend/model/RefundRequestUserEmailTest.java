package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestUserEmailTest {

    @Test
    void setsAndGetsUserEmail() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setUserEmail("customer@example.com");

        assertEquals("customer@example.com", refundRequest.getUserEmail());
    }
}
