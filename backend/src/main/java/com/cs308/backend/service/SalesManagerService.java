package com.cs308.backend.service;

import com.cs308.backend.model.RefundRequest;
import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.stereotype.Service;

import java.text.NumberFormat;
import java.time.Instant;
import java.time.LocalDate;
import java.time.ZoneId;
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
public class SalesManagerService {

    private static final NumberFormat MONEY = NumberFormat.getCurrencyInstance(Locale.US);

    private final Firestore firestore;
    private final EmailService emailService;

    public SalesManagerService(Firestore firestore, EmailService emailService) {
        this.firestore = firestore;
        this.emailService = emailService;
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

    public Map<String, Object> updatePrice(String productId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        double price = readPositiveDouble(body.get("price"), "price");
        DocumentSnapshot snapshot = getProductSnapshot(productId);
        Map<String, Object> updates = new HashMap<>();
        updates.put("price", price);
        updates.put("priceDisplay", formatMoney(price));

        Object oldPrice = snapshot.get("oldPrice");
        if (oldPrice instanceof Number oldPriceNumber && oldPriceNumber.doubleValue() > price) {
            updates.put("oldPriceDisplay", formatMoney(oldPriceNumber.doubleValue()));
        } else {
            updates.put("oldPrice", null);
            updates.put("oldPriceDisplay", "");
            updates.put("badge", "");
            updates.put("badgeType", "");
            updates.put("tags", removeTag(snapshot.get("tags"), "sale"));
        }

        firestore.collection("products").document(productId).update(updates).get();
        return getProduct(productId);
    }

    public Map<String, Object> applyDiscount(String productId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        int discountPercent = readDiscount(body.get("discountPercent"));
        DocumentSnapshot snapshot = getProductSnapshot(productId);
        double currentPrice = readNumber(snapshot.get("price"));
        double oldPrice = snapshot.get("oldPrice") instanceof Number oldPriceNumber
            ? oldPriceNumber.doubleValue()
            : currentPrice;
        double newPrice = Math.round(oldPrice * (100 - discountPercent)) / 100.0;

        Map<String, Object> updates = new HashMap<>();
        updates.put("oldPrice", oldPrice);
        updates.put("price", newPrice);
        updates.put("oldPriceDisplay", formatMoney(oldPrice));
        updates.put("priceDisplay", formatMoney(newPrice));
        updates.put("badge", discountPercent + "%");
        updates.put("badgeType", "sale");
        updates.put("tags", addTag(snapshot.get("tags"), "sale"));
        firestore.collection("products").document(productId).update(updates).get();

        String productName = Objects.toString(snapshot.get("name"), "Product");
        notifyWishlistUsers(productId, productName, oldPrice, newPrice, discountPercent);
        return getProduct(productId);
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

    public List<Map<String, Object>> getDailyRevenue(Long from, Long to)
            throws ExecutionException, InterruptedException {
        ZoneId zone = ZoneId.systemDefault();
        Map<LocalDate, Double> totals = new LinkedHashMap<>();
        List<Map<String, Object>> orders = getOrders(from, to);

        for (Map<String, Object> order : orders) {
            String status = Objects.toString(order.get("status"), "");
            if ("CANCELLED".equalsIgnoreCase(status) || "REFUNDED".equalsIgnoreCase(status)) {
                continue;
            }
            long createdAt = readLong(order.get("createdAt"));
            if (createdAt <= 0) continue;
            LocalDate day = Instant.ofEpochMilli(createdAt).atZone(zone).toLocalDate();
            totals.merge(day, readNumber(order.get("totalPrice")), Double::sum);
        }

        return totals.entrySet().stream()
            .sorted(Map.Entry.comparingByKey())
            .map(entry -> {
                Map<String, Object> item = new HashMap<>();
                item.put("date", entry.getKey().toString());
                item.put("revenue", Math.round(entry.getValue() * 100.0) / 100.0);
                return item;
            })
            .toList();
    }

    public List<RefundRequest> getRefundRequests() throws ExecutionException, InterruptedException {
        List<RefundRequest> requests = new ArrayList<>();
        for (QueryDocumentSnapshot document : firestore.collection("refundRequests").get().get().getDocuments()) {
            RefundRequest request = document.toObject(RefundRequest.class);
            if (request.getRefundId() == null || request.getRefundId().isBlank()) {
                request.setRefundId(document.getId());
            }
            requests.add(request);
        }
        requests.sort((first, second) -> Long.compare(second.getCreatedAt(), first.getCreatedAt()));
        return requests;
    }

    public RefundRequest decideRefund(String refundId, Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        DocumentReference ref = firestore.collection("refundRequests").document(refundId);
        DocumentSnapshot snapshot = ref.get().get();
        if (!snapshot.exists()) {
            throw new IllegalArgumentException("Refund request not found: " + refundId);
        }

        RefundRequest request = snapshot.toObject(RefundRequest.class);
        if (request == null) {
            throw new IllegalArgumentException("Refund request not found: " + refundId);
        }

        String decision = Objects.toString(body.get("decision"), "").trim().toUpperCase(Locale.ROOT);
        if (!"ACCEPTED".equals(decision) && !"REJECTED".equals(decision)) {
            throw new IllegalArgumentException("decision must be ACCEPTED or REJECTED");
        }

        String note = Objects.toString(body.get("note"), "").trim();
        long decidedAt = System.currentTimeMillis();
        request.setStatus(decision);
        request.setDecisionNote(note);
        request.setDecidedAt(decidedAt);
        ref.update(Map.of("status", decision, "decisionNote", note, "decidedAt", decidedAt)).get();

        String orderStatus = "ACCEPTED".equals(decision) ? "REFUNDED" : "DELIVERED";
        firestore.collection("orders").document(request.getOrderId()).update("status", orderStatus).get();
        emailService.sendRefundDecisionEmail(request.getUserEmail(), request.getOrderId(), decision, note);
        return request;
    }

    private Map<String, Object> getProduct(String productId) throws ExecutionException, InterruptedException {
        DocumentSnapshot snapshot = getProductSnapshot(productId);
        Map<String, Object> product = new HashMap<>(snapshot.getData());
        product.putIfAbsent("id", snapshot.getId());
        return product;
    }

    private DocumentSnapshot getProductSnapshot(String productId) throws ExecutionException, InterruptedException {
        if (productId == null || productId.isBlank()) {
            throw new IllegalArgumentException("productId is required");
        }
        DocumentSnapshot snapshot = firestore.collection("products").document(productId).get().get();
        if (!snapshot.exists() || snapshot.getData() == null) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
        return snapshot;
    }

    private void notifyWishlistUsers(String productId, String productName, double oldPrice, double newPrice, int discountPercent)
            throws ExecutionException, InterruptedException {
        for (DocumentReference userWishlist : firestore.collection("wishlists").listDocuments()) {
            DocumentSnapshot item = userWishlist.collection("items").document(productId).get().get();
            if (item.exists()) {
                emailService.sendDiscountEmail(userWishlist.getId(), productName, oldPrice, newPrice, discountPercent);
            }
        }
    }

    private double readPositiveDouble(Object value, String field) {
        double number = readNumber(value);
        if (number <= 0) {
            throw new IllegalArgumentException(field + " must be greater than zero");
        }
        return number;
    }

    private int readDiscount(Object value) {
        int discount = (int) Math.round(readNumber(value));
        if (discount <= 0 || discount >= 100) {
            throw new IllegalArgumentException("discountPercent must be between 1 and 99");
        }
        return discount;
    }

    private double readNumber(Object value) {
        if (value instanceof Number number) {
            return number.doubleValue();
        }
        try {
            return Double.parseDouble(Objects.toString(value, "0"));
        } catch (NumberFormatException exception) {
            return 0.0;
        }
    }

    private long readLong(Object value) {
        if (value instanceof Number number) {
            return number.longValue();
        }
        try {
            return Long.parseLong(Objects.toString(value, "0"));
        } catch (NumberFormatException exception) {
            return 0L;
        }
    }

    private String formatMoney(double value) {
        return MONEY.format(value);
    }

    private List<String> addTag(Object tagsValue, String tag) {
        List<String> tags = new ArrayList<>();
        if (tagsValue instanceof List<?> values) {
            for (Object value : values) {
                tags.add(Objects.toString(value, ""));
            }
        }
        if (!tags.contains(tag)) {
            tags.add(tag);
        }
        return tags;
    }

    private List<String> removeTag(Object tagsValue, String tag) {
        List<String> tags = new ArrayList<>();
        if (tagsValue instanceof List<?> values) {
            for (Object value : values) {
                String text = Objects.toString(value, "");
                if (!tag.equals(text)) {
                    tags.add(text);
                }
            }
        }
        return tags;
    }
}
