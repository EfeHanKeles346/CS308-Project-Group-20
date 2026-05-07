package com.cs308.backend.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
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
@RequestMapping("/api/products")
@CrossOrigin(origins = "*")
public class ProductController {

    private final Firestore firestore;

    public ProductController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping
    public List<Map<String, Object>> getProducts() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> products = new ArrayList<>();

        for (QueryDocumentSnapshot document : firestore.collection("products").get().get().getDocuments()) {
            Map<String, Object> product = new HashMap<>(document.getData());
            product.putIfAbsent("id", document.getId());
            applyRatingAggregate(product, document.getId());
            products.add(product);
        }

        products.sort(Comparator.comparingInt(product -> Integer.parseInt(product.get("id").toString())));
        return products;
    }

    @GetMapping("/{id}")
    public Map<String, Object> getProductById(@PathVariable String id) throws ExecutionException, InterruptedException {
        var snapshot = firestore.collection("products").document(id).get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Product not found: " + id);
        }

        Map<String, Object> product = snapshot.getData() == null ? null : new HashMap<>(snapshot.getData());
        if (product == null) {
            throw new IllegalArgumentException("Product not found: " + id);
        }

        product.putIfAbsent("id", snapshot.getId());
        applyRatingAggregate(product, snapshot.getId());
        return product;
    }

    private void applyRatingAggregate(Map<String, Object> product, String productId)
            throws ExecutionException, InterruptedException {
        double baseAverage = readDouble(product.get("rating"));
        int baseCount = Math.max(readInt(product.get("reviews")), 0);
        double total = baseAverage * baseCount;
        int count = baseCount;

        for (QueryDocumentSnapshot doc : firestore.collection("productRatings")
            .document(productId)
            .collection("items")
            .get()
            .get()
            .getDocuments()) {
            int rating = readInt(doc.get("rating"));
            if (rating >= 1 && rating <= 5) {
                total += rating;
                count += 1;
            }
        }

        double average = count == 0 ? 0.0 : Math.round((total / count) * 10.0) / 10.0;
        product.put("rating", average);
        product.put("reviews", count);
        product.put("reviewsDisplay", formatReviews(count));
        product.put("stars", buildStars(average));
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

    private int readInt(Object value) {
        if (value instanceof Number number) {
            return number.intValue();
        }

        try {
            return Integer.parseInt(Objects.toString(value, ""));
        } catch (NumberFormatException exception) {
            return 0;
        }
    }

    private String formatReviews(int value) {
        if (value >= 1000) {
            double rounded = Math.round((value / 1000.0) * 10.0) / 10.0;
            return rounded == Math.floor(rounded)
                ? String.format(Locale.US, "%.0fK", rounded)
                : String.format(Locale.US, "%.1fK", rounded);
        }
        return String.valueOf(value);
    }

    private List<Double> buildStars(double rating) {
        List<Double> stars = new ArrayList<>();
        double remaining = rating;

        for (int index = 0; index < 5; index += 1) {
            if (remaining >= 1) {
                stars.add(1.0);
            } else if (remaining >= 0.5) {
                stars.add(0.5);
            } else {
                stars.add(0.0);
            }
            remaining -= 1;
        }

        return stars;
    }
}
