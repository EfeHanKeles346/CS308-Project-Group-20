package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestTimestampsTest {

    @Test
    void setsAndGetsCreatedAtAndDecidedAt() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setCreatedAt(1710000000000L);
        refundRequest.setDecidedAt(1710100000000L);

        assertEquals(1710000000000L, refundRequest.getCreatedAt());
        assertEquals(1710100000000L, refundRequest.getDecidedAt());
    }
}
