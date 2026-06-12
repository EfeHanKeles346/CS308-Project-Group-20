package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestReasonTest {

    @Test
    void setsAndGetsReason() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setReason("Damaged package");

        assertEquals("Damaged package", refundRequest.getReason());
    }
}
