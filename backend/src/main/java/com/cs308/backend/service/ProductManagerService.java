package com.cs308.backend.service;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

@Service
public class ProductManagerService {

    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(Locale.US);
    private static final List<String> VALID_ORDER_STATUSES = List.of(
        "PROCESSING",
        "IN_TRANSIT",
        "DELIVERED",
        "CANCELLED",
        "REFUND_REQUESTED",
        "REFUNDED"
    );

    private final Firestore firestore;

    public ProductManagerService(Firestore firestore) {
        this.firestore = firestore;
    }

    public List<Map<String, Object>> getCategories() throws ExecutionException, InterruptedException {
        Map<String, Map<String, Object>> categories = new LinkedHashMap<>();

        for (QueryDocumentSnapshot document : firestore.collection("categories").get().get().getDocuments()) {
            Map<String, Object> category = new HashMap<>(document.getData());
            category.putIfAbsent("id", document.getId());
            category.putIfAbsent("name", titleFromId(document.getId()));
            category.putIfAbsent("active", true);
            categories.put(document.getId(), category);
        }

        for (QueryDocumentSnapshot product : firestore.collection("products").get().get().getDocuments()) {
            String id = Objects.toString(product.get("category"), "").trim();
            if (id.isBlank() || categories.containsKey(id)) continue;
            Map<String, Object> category = new HashMap<>();
            category.put("id", id);
            category.put("name", titleFromId(id));
            category.put("icon", "fa-box");
            category.put("active", true);
            categories.put(id, category);
        }

        return categories.values().stream()
            .sorted(Comparator.comparing(category -> Objects.toString(category.get("name"), "")))
            .toList();
    }

    public Map<String, Object> addCategory(Map<String, Object> body) throws ExecutionException, InterruptedException {
        String name = requireText(body.get("name"), "Category name is required.");
        String id = normalizeId(Objects.toString(body.get("id"), name));
        String icon = Objects.toString(body.get("icon"), "fa-box").trim();

        Map<String, Object> category = new HashMap<>();
        category.put("id", id);
        category.put("name", name);
        category.put("icon", icon.isBlank() ? "fa-box" : icon);
        category.put("active", true);
        category.put("updatedAt", System.currentTimeMillis());
        firestore.collection("categories").document(id).set(category).get();
        return category;
    }

    public Map<String, Object> removeCategory(String categoryId) throws ExecutionException, InterruptedException {
        String id = requireText(categoryId, "Category is required.");
        long now = System.currentTimeMillis();
        firestore.collection("categories").document(id).set(Map.of(
            "id", id,
            "name", titleFromId(id),
            "active", false,
            "updatedAt", now
        ), com.google.cloud.firestore.SetOptions.merge()).get();

        for (QueryDocumentSnapshot product : firestore.collection("products")
            .whereEqualTo("category", id)
            .get()
            .get()
            .getDocuments()) {
            product.getReference().update(Map.of(
                "active", false,
                "status", "CATEGORY_REMOVED",
                "updatedAt", now
            )).get();
        }

        return Map.of("id", id, "active", false);
    }

    public List<Map<String, Object>> getProducts() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> products = new ArrayList<>();
        for (QueryDocumentSnapshot document : firestore.collection("products").get().get().getDocuments()) {
            Map<String, Object> product = new HashMap<>(document.getData());
            product.putIfAbsent("id", document.getId());
            products.add(product);
        }
        products.sort(Comparator.comparing(product -> Objects.toString(product.get("id"), "")));
        return products;
    }

    public Map<String, Object> addProduct(Map<String, Object> body) throws ExecutionException, InterruptedException {
        String brand = requireText(body.get("brand"), "Brand is required.");
        String name = requireText(body.get("name"), "Product name is required.");
        String description = requireText(body.get("description"), "Description is required.");
        String category = requireText(body.get("category"), "Category is required.");
        String img = requireText(body.get("img"), "Image URL is required.");
        int stock = readNonNegativeInt(body.get("stock"), "stock");
        List<String> tags = readTags(body.get("tags"));

        DocumentSnapshot categorySnapshot = firestore.collection("categories").document(category).get().get();
        if (categorySnapshot.exists() && Boolean.FALSE.equals(categorySnapshot.get("active"))) {
            throw new IllegalArgumentException("Category is inactive.");
        }

        String id = nextProductId();
        Map<String, Object> product = new HashMap<>();
        product.put("id", id);
        product.put("productId", id);
        product.put("brand", brand);
        product.put("name", name);
        product.put("description", description);
        product.put("category", category);
        product.put("img", img);
        product.put("stock", stock);
        product.put("tags", tags);
        product.put("badge", Objects.toString(body.get("badge"), "").trim());
        product.put("badgeType", Objects.toString(body.get("badgeType"), "").trim());
        product.put("rating", readNumber(body.get("rating")));
        product.put("reviews", readNonNegativeInt(body.get("reviews"), "reviews"));
        product.put("reviewsDisplay", String.valueOf(readNonNegativeInt(body.get("reviews"), "reviews")));
        product.put("stars", buildStars(readNumber(body.get("rating"))));
        product.put("oldPrice", null);
        product.put("oldPriceDisplay", "");
        product.put("price", null);
        product.put("priceDisplay", "");
        product.put("status", "DRAFT");
        product.put("active", false);
        product.put("createdAt", System.currentTimeMillis());
        product.put("updatedAt", System.currentTimeMillis());

        firestore.collection("products").document(id).set(product).get();
        return product;
    }

    public Map<String, Object> archiveProduct(String productId) throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection("products").document(requireText(productId, "Product is required."));
        DocumentSnapshot snapshot = ref.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
        ref.update(Map.of("active", false, "status", "ARCHIVED", "updatedAt", System.currentTimeMillis())).get();
        Map<String, Object> product = new HashMap<>(snapshot.getData());
        product.put("active", false);
        product.put("status", "ARCHIVED");
        product.putIfAbsent("id", snapshot.getId());
        return product;
    }

    public Map<String, Object> updateStock(String productId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        int stock = readNonNegativeInt(body.get("stock"), "stock");
        DocumentReference ref = firestore.collection("products").document(requireText(productId, "Product is required."));
        DocumentSnapshot snapshot = ref.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
        ref.update(Map.of("stock", stock, "updatedAt", System.currentTimeMillis())).get();
        Map<String, Object> product = new HashMap<>(snapshot.getData());
        product.put("stock", stock);
        product.putIfAbsent("id", snapshot.getId());
        return product;
    }

    public List<Map<String, Object>> getOrders(Long from, Long to)
            throws ExecutionException, InterruptedException {
        List<Map<String, Object>> orders = new ArrayList<>();
        for (QueryDocumentSnapshot document : firestore.collection("orders").get().get().getDocuments()) {
            Map<String, Object> order = new HashMap<>(document.getData());
            order.putIfAbsent("orderId", document.getId());
            long createdAt = readLong(order.get("createdAt"));
            if (from != null && createdAt < from) continue;
            if (to != null && createdAt > to) continue;
            orders.add(order);
        }
        orders.sort((first, second) -> Long.compare(readLong(second.get("createdAt")), readLong(first.get("createdAt"))));
        return orders;
    }

    public Map<String, Object> updateOrderStatus(String orderId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        String status = normalizeStatus(body.get("status"));
        if (!VALID_ORDER_STATUSES.contains(status)) {
            throw new IllegalArgumentException("Unsupported order status.");
        }
        DocumentReference ref = firestore.collection("orders").document(requireText(orderId, "Order is required."));
        DocumentSnapshot snapshot = ref.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Order not found: " + orderId);
        }
        ref.update(Map.of("status", status)).get();
        Map<String, Object> order = new HashMap<>(snapshot.getData());
        order.put("status", status);
        order.putIfAbsent("orderId", snapshot.getId());
        return order;
    }

    public List<Map<String, Object>> getComments() throws ExecutionException, InterruptedException {
        List<Map<String, Object>> comments = new ArrayList<>();
        for (DocumentReference productRef : firestore.collection("productComments").listDocuments()) {
            for (QueryDocumentSnapshot commentDoc : productRef.collection("items").get().get().getDocuments()) {
                Map<String, Object> comment = new HashMap<>(commentDoc.getData());
                comment.put("productId", productRef.getId());
                comment.put("commentId", commentDoc.getId());
                comments.add(comment);
            }
        }
        comments.sort((first, second) -> Long.compare(readLong(second.get("createdAt")), readLong(first.get("createdAt"))));
        return comments;
    }

    public Map<String, Object> decideComment(String productId, String commentId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        String decision = normalizeStatus(body.get("status"));
        if (!"ACCEPTED".equals(decision) && !"REJECTED".equals(decision) && !"PENDING".equals(decision)) {
            throw new IllegalArgumentException("Comment status must be ACCEPTED, REJECTED, or PENDING.");
        }
        DocumentReference ref = firestore.collection("productComments")
            .document(requireText(productId, "Product is required."))
            .collection("items")
            .document(requireText(commentId, "Comment is required."));
        DocumentSnapshot snapshot = ref.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Comment not found.");
        }
        ref.update(Map.of("status", decision, "decidedAt", System.currentTimeMillis())).get();
        Map<String, Object> comment = new HashMap<>(snapshot.getData());
        comment.put("status", decision);
        comment.put("productId", productId);
        comment.put("commentId", commentId);
        return comment;
    }

    private String nextProductId() throws ExecutionException, InterruptedException {
        int max = 0;
        for (QueryDocumentSnapshot document : firestore.collection("products").get().get().getDocuments()) {
            try {
                max = Math.max(max, Integer.parseInt(document.getId()));
            } catch (NumberFormatException ignored) {
                Object id = document.get("id");
                if (id instanceof Number number) max = Math.max(max, number.intValue());
            }
        }
        return String.valueOf(max + 1);
    }

    private String requireText(Object value, String message) {
        String text = Objects.toString(value, "").trim();
        if (text.isBlank()) {
            throw new IllegalArgumentException(message);
        }
        return text;
    }

    private String normalizeId(String value) {
        String id = value.trim().toLowerCase(Locale.ROOT)
            .replaceAll("[^a-z0-9]+", "-")
            .replaceAll("(^-|-$)", "");
        if (id.isBlank()) {
            throw new IllegalArgumentException("Category id is required.");
        }
        return id;
    }

    private String normalizeStatus(Object value) {
        return Objects.toString(value, "").trim().replace('-', '_').replace(' ', '_').toUpperCase(Locale.ROOT);
    }

    private double readNumber(Object value) {
        if (value instanceof Number number) return number.doubleValue();
        try {
            return Double.parseDouble(Objects.toString(value, "0"));
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }

    private int readNonNegativeInt(Object value, String field) {
        int number = (int) Math.round(readNumber(value));
        if (number < 0) {
            throw new IllegalArgumentException(field + " cannot be negative.");
        }
        return number;
    }

    private long readLong(Object value) {
        if (value instanceof Number number) return number.longValue();
        try {
            return Long.parseLong(Objects.toString(value, "0"));
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private List<String> readTags(Object value) {
        List<String> tags = new ArrayList<>();
        if (value instanceof List<?> values) {
            for (Object item : values) {
                String tag = Objects.toString(item, "").trim();
                if (!tag.isBlank()) tags.add(tag);
            }
        } else {
            for (String item : Objects.toString(value, "").split(",")) {
                String tag = item.trim();
                if (!tag.isBlank()) tags.add(tag);
            }
        }
        return tags;
    }

    private List<Double> buildStars(double rating) {
        List<Double> stars = new ArrayList<>();
        double remaining = rating;
        for (int index = 0; index < 5; index += 1) {
            if (remaining >= 1) stars.add(1.0);
            else if (remaining >= 0.5) stars.add(0.5);
            else stars.add(0.0);
            remaining -= 1;
        }
        return stars;
    }

    private String titleFromId(String id) {
        String[] parts = id.replace('-', ' ').replace('_', ' ').split(" ");
        List<String> words = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) continue;
            words.add(part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1));
        }
        return String.join(" ", words);
    }
}
