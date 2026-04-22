package com.cs308.backend.service;

import com.cs308.backend.model.Order;
import com.cs308.backend.model.OrderItem;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Service;

import java.util.ArrayList;
import java.util.List;
import java.util.UUID;
import java.util.concurrent.ExecutionException;

@Service
public class OrderService {

    private final Firestore firestore;

    public OrderService(Firestore firestore) {
        this.firestore = firestore;
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

        DocumentReference ref = firestore.collection("orders").document(order.getOrderId());
        ref.set(order).get();

        clearUserCart(order.getUserEmail());

        return order;
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
