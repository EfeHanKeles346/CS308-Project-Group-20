package com.cs308.backend.model;

import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertEquals;

class RefundRequestDecisionNoteTest {

    @Test
    void setsAndGetsDecisionNote() {
        RefundRequest refundRequest = new RefundRequest();

        refundRequest.setDecisionNote("Refund approved");

        assertEquals("Refund approved", refundRequest.getDecisionNote());
    }
}
