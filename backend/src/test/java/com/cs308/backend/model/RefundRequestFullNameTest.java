package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestFullNameTest {

    @Test
    void setsAndGetsFullName() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setFullName("Customer Name");

        assertEquals("Customer Name", refundRequest.getFullName());
    }
}
