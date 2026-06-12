package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestRefundIdTest {

    @Test
    void setsAndGetsRefundId() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setRefundId("refund-1");

        assertEquals("refund-1", refundRequest.getRefundId());
    }
}
