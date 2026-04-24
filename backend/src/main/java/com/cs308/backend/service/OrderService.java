package com.cs308.backend.service;

import com.cs308.backend.model.Order;
import com.cs308.backend.model.OrderItem;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.slf4j.Logger;
import org.slf4j.LoggerFactory;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class OrderService {

    private static final Logger log = LoggerFactory.getLogger(OrderService.class);

    private final Firestore firestore;
    private final InvoiceService invoiceService;
    private final EmailService emailService;

    public OrderService(Firestore firestore, InvoiceService invoiceService, EmailService emailService) {
        this.firestore = firestore;
        this.invoiceService = invoiceService;
        this.emailService = emailService;
    }

    public Order createOrder(Order order) throws ExecutionException, InterruptedException {
        if (order.getUserEmail() == null || order.getUserEmail().isBlank()) {
            throw new IllegalArgumentException("userEmail is required");
        }
        if (order.getItems() == null || order.getItems().isEmpty()) {
            throw new IllegalArgumentException("Order must contain at least one item");
        }
        if (order.getDeliveryAddress() == null) {
            throw new IllegalArgumentException("deliveryAddress is required");
        }

        double total = 0.0;
        for (OrderItem item : order.getItems()) {
            if (item.getQuantity() <= 0) {
                throw new IllegalArgumentException("Item quantity must be positive");
            }
            total += item.getUnitPrice() * item.getQuantity();
        }

        order.setOrderId(UUID.randomUUID().toString());
        order.setCreatedAt(System.currentTimeMillis());
        order.setStatus("PAID");
        order.setTotalPrice(total);

        decrementStockAtomically(order);

        DocumentReference ref = firestore.collection("orders").document(order.getOrderId());
        ref.set(order).get();

        clearUserCart(order.getUserEmail());
        sendInvoiceEmailSafely(order);

        return order;
    }

    private void sendInvoiceEmailSafely(Order order) {
        try {
            byte[] pdf = invoiceService.buildInvoice(order);
            emailService.sendInvoiceEmail(order, pdf);
        } catch (RuntimeException ex) {
            log.error("Invoice email delivery failed for order {}: {}", order.getOrderId(), ex.getMessage());
        }
    }

    public Order getOrderById(String orderId) throws ExecutionException, InterruptedException {
        if (orderId == null || orderId.isBlank()) {
            throw new IllegalArgumentException("orderId is required");
        }
        DocumentSnapshot snapshot = firestore.collection("orders").document(orderId).get().get();
        if (!snapshot.exists()) {
            return null;
        }
        return snapshot.toObject(Order.class);
    }

    public byte[] getInvoicePdf(String orderId) throws ExecutionException, InterruptedException {
        Order order = getOrderById(orderId);
        if (order == null) return null;
        return invoiceService.buildInvoice(order);
    }

    private void decrementStockAtomically(Order order) throws ExecutionException, InterruptedException {
        Map<String, DocumentReference> productRefs = new HashMap<>();
        for (OrderItem item : order.getItems()) {
            productRefs.computeIfAbsent(item.getProductId(),
                id -> firestore.collection("products").document(id));
        }

        firestore.runTransaction(tx -> {
            Map<String, Integer> currentStock = new HashMap<>();
            for (Map.Entry<String, DocumentReference> entry : productRefs.entrySet()) {
                DocumentSnapshot snap = tx.get(entry.getValue()).get();
                if (!snap.exists()) {
                    throw new IllegalArgumentException("Product not found: " + entry.getKey());
                }
                Object stockObj = snap.get("stock");
                if (!(stockObj instanceof Number stockNum)) {
                    throw new IllegalStateException("Product stock missing: " + entry.getKey());
                }
                currentStock.put(entry.getKey(), stockNum.intValue());
            }

            Map<String, Integer> requested = new HashMap<>();
            for (OrderItem item : order.getItems()) {
                requested.merge(item.getProductId(), item.getQuantity(), Integer::sum);
            }

            for (Map.Entry<String, Integer> entry : requested.entrySet()) {
                int have = currentStock.getOrDefault(entry.getKey(), 0);
                if (have < entry.getValue()) {
                    throw new IllegalStateException(
                        "Insufficient stock for product " + entry.getKey()
                            + " (have " + have + ", need " + entry.getValue() + ")");
                }
            }

            for (Map.Entry<String, Integer> entry : requested.entrySet()) {
                int nextStock = currentStock.get(entry.getKey()) - entry.getValue();
                tx.update(productRefs.get(entry.getKey()), "stock", nextStock);
            }
            return null;
        }).get();
    }

    private void clearUserCart(String email) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore
            .collection("carts").document(email)
            .collection("items").get().get().getDocuments();
        for (QueryDocumentSnapshot doc : docs) {
            doc.getReference().delete().get();
        }
    }

    public List<Order> getOrdersByUserEmail(String email) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore
            .collection("orders")
            .whereEqualTo("userEmail", email)
            .get().get().getDocuments();

        List<Order> orders = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            orders.add(doc.toObject(Order.class));
        }
        return orders;
    }
}
