package com.cs308.backend;

import com.cs308.backend.model.Address;
import com.cs308.backend.model.Order;
import com.cs308.backend.model.OrderItem;
import org.junit.jupiter.api.Test;

import java.util.List;

import static org.junit.jupiter.api.Assertions.*;

class OrderModelTest {

    @Test
    void setsAndGetsOrderId() {
        Order order = new Order();
        order.setOrderId("ORD-001");
        assertEquals("ORD-001", order.getOrderId());
    }

    @Test
    void setsAndGetsUserEmail() {
        Order order = new Order();
        order.setUserEmail("test@example.com");
        assertEquals("test@example.com", order.getUserEmail());
    }

    @Test
    void setsAndGetsTotalPrice() {
        Order order = new Order();
        order.setTotalPrice(199.99);
        assertEquals(199.99, order.getTotalPrice());
    }

    @Test
    void setsAndGetsStatus() {
        Order order = new Order();
        order.setStatus("PROCESSING");
        assertEquals("PROCESSING", order.getStatus());
    }

    @Test
    void setsAndGetsDeliveryAddress() {
        Order order = new Order();
        Address address = new Address();
        address.setCity("Istanbul");
        order.setDeliveryAddress(address);
        assertEquals("Istanbul", order.getDeliveryAddress().getCity());
    }

    @Test
    void defaultItemsListIsEmpty() {
        Order order = new Order();
        assertNotNull(order.getItems());
        assertTrue(order.getItems().isEmpty());
    }

    @Test
    void setsAndGetsItems() {
        Order order = new Order();
        OrderItem item = new OrderItem("P1", "Laptop", 1, 999.0);
        order.setItems(List.of(item));
        assertEquals(1, order.getItems().size());
    }

    @Test
    void invoiceEmailSentDefaultsFalse() {
        Order order = new Order();
        assertFalse(order.isInvoiceEmailSent());
    }

    @Test
    void setsInvoiceEmailSentTrue() {
        Order order = new Order();
        order.setInvoiceEmailSent(true);
        assertTrue(order.isInvoiceEmailSent());
    }
}
