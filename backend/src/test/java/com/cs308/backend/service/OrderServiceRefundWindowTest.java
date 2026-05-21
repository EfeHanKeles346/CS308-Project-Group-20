package com.cs308.backend.service;

import org.junit.jupiter.api.Test;

import java.time.Instant;

import static org.junit.jupiter.api.Assertions.assertFalse;
import static org.junit.jupiter.api.Assertions.assertTrue;

class OrderServiceRefundWindowTest {

    @Test
    void allowsRefundRequestExactlyOneMonthAfterPurchase() {
        long purchaseTime = Instant.parse("2026-01-21T10:00:00Z").toEpochMilli();
        long deadline = Instant.parse("2026-02-21T10:00:00Z").toEpochMilli();

        assertTrue(OrderService.isWithinRefundWindow(purchaseTime, deadline));
    }

    @Test
    void rejectsRefundRequestAfterOneMonthFromPurchase() {
        long purchaseTime = Instant.parse("2026-01-21T10:00:00Z").toEpochMilli();
        long afterDeadline = Instant.parse("2026-02-21T10:00:01Z").toEpochMilli();

        assertFalse(OrderService.isWithinRefundWindow(purchaseTime, afterDeadline));
    }

    @Test
    void handlesShorterCalendarMonths() {
        long purchaseTime = Instant.parse("2026-01-31T10:00:00Z").toEpochMilli();
        long deadline = Instant.parse("2026-02-28T10:00:00Z").toEpochMilli();
        long afterDeadline = Instant.parse("2026-02-28T10:00:01Z").toEpochMilli();

        assertTrue(OrderService.isWithinRefundWindow(purchaseTime, deadline));
        assertFalse(OrderService.isWithinRefundWindow(purchaseTime, afterDeadline));
    }

    @Test
    void rejectsOrdersWithoutPurchaseTime() {
        long now = Instant.now().toEpochMilli();

        assertFalse(OrderService.isWithinRefundWindow(0, now));
    }
}
