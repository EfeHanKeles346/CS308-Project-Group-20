package com.cs308.backend.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.nio.charset.StandardCharsets;
import java.util.Base64;
import java.util.HashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/ratings")
@CrossOrigin(origins = "*")
public class ProductRatingController {

    private static final String ORDER_STATUS_DELIVERED = "DELIVERED";

    private final Firestore firestore;

    public ProductRatingController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping("/product/{productId}")
    public Map<String, Object> getRatingSummary(@PathVariable String productId)
            throws ExecutionException, InterruptedException {
        validateProduct(productId);
        return buildRatingSummary(productId);
    }

    @GetMapping("/product/{productId}/user")
    public Map<String, Object> getUserRating(
            @PathVariable String productId,
            @RequestParam String email) throws ExecutionException, InterruptedException {
        validateProduct(productId);

        String userEmail = Objects.toString(email, "").trim();
        if (userEmail.isBlank()) {
            throw new IllegalArgumentException("Please sign in to rate this product.");
        }

        DocumentSnapshot snapshot = firestore.collection("productRatings")
            .document(productId)
            .collection("items")
            .document(ratingDocumentId(userEmail))
            .get()
            .get();

        int rating = snapshot.exists() ? readRating(snapshot.get("rating")) : 0;
        return Map.of(
            "productId", productId,
            "userEmail", userEmail,
            "rating", rating
        );
    }

    @PostMapping("/product/{productId}")
    public Map<String, Object> submitRating(
            @PathVariable String productId,
            @RequestBody Map<String, Object> body) throws ExecutionException, InterruptedException {
        validateProduct(productId);

        String userEmail = Objects.toString(body.get("userEmail"), "").trim();
        String userName = Objects.toString(body.get("userName"), "").trim();
        int rating = readRating(body.get("rating"));

        if (userEmail.isBlank()) {
            throw new IllegalArgumentException("Please sign in to rate this product.");
        }
        if (rating < 1 || rating > 5) {
            throw new IllegalArgumentException("Rating must be between 1 and 5.");
        }
        if (!hasDeliveredPurchase(userEmail, productId)) {
            throw new IllegalArgumentException("You can rate this product after it is delivered.");
        }

        DocumentReference docRef = firestore.collection("productRatings")
            .document(productId)
            .collection("items")
            .document(ratingDocumentId(userEmail));

        long now = System.currentTimeMillis();
        DocumentSnapshot existing = docRef.get().get();
        long createdAt = existing.exists() && existing.get("createdAt") instanceof Number number
            ? number.longValue()
            : now;

        Map<String, Object> ratingDoc = new HashMap<>();
        ratingDoc.put("productId", productId);
        ratingDoc.put("userEmail", userEmail);
        ratingDoc.put("userName", userName.isBlank() ? userEmail : userName);
        ratingDoc.put("rating", rating);
        ratingDoc.put("createdAt", createdAt);
        ratingDoc.put("updatedAt", now);
        docRef.set(ratingDoc).get();

        Map<String, Object> summary = new HashMap<>(buildRatingSummary(productId));
        summary.put("userRating", rating);
        summary.put("message", "Rating saved.");
        return summary;
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

    private Map<String, Object> buildRatingSummary(String productId)
            throws ExecutionException, InterruptedException {
        DocumentSnapshot productSnapshot = firestore.collection("products").document(productId).get().get();
        double baseAverage = readDouble(productSnapshot.get("rating"));
        int baseCount = readRatingCount(productSnapshot.get("reviews"));
        double total = baseAverage * baseCount;
        int count = baseCount;

        List<QueryDocumentSnapshot> docs = firestore.collection("productRatings")
            .document(productId)
            .collection("items")
            .get()
            .get()
            .getDocuments();

        for (QueryDocumentSnapshot doc : docs) {
            Object value = doc.get("rating");
            if (value instanceof Number number) {
                int rating = number.intValue();
                if (rating >= 1 && rating <= 5) {
                    count += 1;
                    total += rating;
                }
            }
        }

        double average = count == 0 ? 0.0 : Math.round((total / count) * 10.0) / 10.0;
        return Map.of(
            "productId", productId,
            "averageRating", average,
            "ratingCount", count,
            "baseAverageRating", baseAverage,
            "baseRatingCount", baseCount
        );
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

    private int readRating(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(Objects.toString(value, ""));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private double readDouble(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }

        try {
            return Double.parseDouble(Objects.toString(value, ""));
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }

    private int readRatingCount(Object value) {
        int count = readRating(value);
        return Math.max(count, 0);
    }

    private String ratingDocumentId(String userEmail) {
        return Base64.getUrlEncoder()
            .withoutPadding()
            .encodeToString(userEmail.toLowerCase(Locale.ROOT).getBytes(StandardCharsets.UTF_8));
    }
}
