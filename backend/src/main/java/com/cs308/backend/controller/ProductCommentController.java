package com.cs308.backend.controller;

import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/comments")
@CrossOrigin(origins = "*")
public class ProductCommentController {

    private static final String STATUS_PENDING = "PENDING";
    private static final String STATUS_ACCEPTED = "ACCEPTED";
    private static final String ORDER_STATUS_DELIVERED = "DELIVERED";

    private final Firestore firestore;

    public ProductCommentController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping("/product/{productId}")
    public List<Map<String, Object>> getAcceptedComments(@PathVariable String productId)
            throws ExecutionException, InterruptedException {
        validateProduct(productId);

        List<QueryDocumentSnapshot> docs = firestore.collection("productComments")
            .document(productId)
            .collection("items")
            .get()
            .get()
            .getDocuments();

        List<Map<String, Object>> comments = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            if (!STATUS_ACCEPTED.equals(normalizeCommentStatus(doc.get("status")))) {
                continue;
            }

            Map<String, Object> comment = new HashMap<>(doc.getData());
            comment.put("commentId", doc.getId());
            comment.put("productId", productId);
            comments.add(comment);
        }

        comments.sort(Comparator.comparingLong(this::createdAt).reversed());
        return comments;
    }

    @PostMapping("/product/{productId}")
    public Map<String, Object> createComment(
            @PathVariable String productId,
            @RequestBody Map<String, Object> body) throws ExecutionException, InterruptedException {
        validateProduct(productId);

        String userEmail = Objects.toString(body.get("userEmail"), "").trim();
        String userName = Objects.toString(body.get("userName"), "").trim();
        String text = Objects.toString(body.get("text"), "").trim();

        if (userEmail.isBlank()) {
            throw new IllegalArgumentException("Please sign in to comment.");
        }
        if (text.isBlank()) {
            throw new IllegalArgumentException("Comment cannot be empty.");
        }
        if (text.length() > 1000) {
            throw new IllegalArgumentException("Comment cannot exceed 1000 characters.");
        }
        if (!hasDeliveredPurchase(userEmail, productId)) {
            throw new IllegalArgumentException("You can comment after this product is delivered.");
        }

        Map<String, Object> comment = new HashMap<>();
        comment.put("productId", productId);
        comment.put("userEmail", userEmail);
        comment.put("userName", userName.isBlank() ? userEmail : userName);
        comment.put("text", text);
        comment.put("status", STATUS_PENDING);
        comment.put("createdAt", System.currentTimeMillis());

        var docRef = firestore.collection("productComments")
            .document(productId)
            .collection("items")
            .document();
        docRef.set(comment).get();

        return Map.of(
            "status", STATUS_PENDING,
            "commentId", docRef.getId(),
            "message", "Comment submitted for review."
        );
    }

    private void validateProduct(String productId) throws ExecutionException, InterruptedException {
        if (productId == null || productId.isBlank()) {
            throw new IllegalArgumentException("Product is required.");
        }

        DocumentSnapshot productSnapshot = firestore.collection("products").document(productId).get().get();
        if (!productSnapshot.exists()) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
    }

    private boolean hasDeliveredPurchase(String userEmail, String productId)
            throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> orders = firestore.collection("orders")
            .whereEqualTo("userEmail", userEmail)
            .get()
            .get()
            .getDocuments();

        for (QueryDocumentSnapshot order : orders) {
            if (!ORDER_STATUS_DELIVERED.equals(normalizeOrderStatus(order.get("status")))) {
                continue;
            }

            Object itemsObject = order.get("items");
            if (!(itemsObject instanceof List<?> items)) {
                continue;
            }

            for (Object itemObject : items) {
                if (!(itemObject instanceof Map<?, ?> item)) {
                    continue;
                }

                String itemProductId = Objects.toString(item.get("productId"), "");
                if (productId.equals(itemProductId)) {
                    return true;
                }
            }
        }

        return false;
    }

    private String normalizeOrderStatus(Object status) {
        String normalized = Objects.toString(status, "")
            .trim()
            .replace('-', '_')
            .replace(' ', '_')
            .toUpperCase(Locale.ROOT);

        if ("SHIPPED".equals(normalized)) {
            return "IN_TRANSIT";
        }

        return normalized;
    }

    private String normalizeCommentStatus(Object status) {
        return Objects.toString(status, "")
            .trim()
            .replace('-', '_')
            .replace(' ', '_')
            .toUpperCase(Locale.ROOT);
    }

    private long createdAt(Map<String, Object> comment) {
        Object value = comment.get("createdAt");
        return value instanceof Number number ? number.longValue() : 0L;
    }
}
