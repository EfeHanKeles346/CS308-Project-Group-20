package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestStatusTest {

    @Test
    void setsAndGetsStatus() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setStatus("PENDING");

        assertEquals("PENDING", refundRequest.getStatus());
    }
}
