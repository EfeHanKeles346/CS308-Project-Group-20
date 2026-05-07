package com.cs308.backend;

import com.cs308.backend.model.OrderItem;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.*;

class OrderItemModelTest {

    @Test
    void allArgsConstructorSetsFields() {
        OrderItem item = new OrderItem("P42", "Headphones", 2, 59.99);
        assertEquals("P42", item.getProductId());
        assertEquals("Headphones", item.getProductName());
        assertEquals(2, item.getQuantity());
        assertEquals(59.99, item.getUnitPrice());
    }

    @Test
    void noArgsConstructorCreatesEmptyItem() {
        OrderItem item = new OrderItem();
        assertNull(item.getProductId());
        assertNull(item.getProductName());
        assertEquals(0, item.getQuantity());
        assertEquals(0.0, item.getUnitPrice());
    }

    @Test
    void setsAndGetsProductId() {
        OrderItem item = new OrderItem();
        item.setProductId("P99");
        assertEquals("P99", item.getProductId());
    }

    @Test
    void setsAndGetsProductName() {
        OrderItem item = new OrderItem();
        item.setProductName("Keyboard");
        assertEquals("Keyboard", item.getProductName());
    }

    @Test
    void setsAndGetsQuantity() {
        OrderItem item = new OrderItem();
        item.setQuantity(5);
        assertEquals(5, item.getQuantity());
    }

    @Test
    void setsAndGetsUnitPrice() {
        OrderItem item = new OrderItem();
        item.setUnitPrice(149.0);
        assertEquals(149.0, item.getUnitPrice());
    }

    @Test
    void totalPriceCalculationIsCorrect() {
        OrderItem item = new OrderItem("P1", "Monitor", 3, 250.0);
        assertEquals(750.0, item.getQuantity() * item.getUnitPrice());
    }
}
