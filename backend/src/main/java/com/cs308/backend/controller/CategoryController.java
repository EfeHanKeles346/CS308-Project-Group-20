package com.cs308.backend.controller;

import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.Comparator;
import java.util.HashMap;
import java.util.LinkedHashMap;
import java.util.List;
import java.util.Locale;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

/**
 * Public, customer-facing category listing for the storefront.
 *
 * <p>Returns only categories that are active (not hidden by the product manager)
 * and includes the live count of storefront-visible products in each category so
 * the home page carousel can show real numbers instead of hardcoded values.
 */
@RestController
@RequestMapping("/api/categories")
@CrossOrigin(origins = "*")
public class CategoryController {

    private final Firestore firestore;

    public CategoryController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping
    public List<Map<String, Object>> getActiveCategories() throws ExecutionException, InterruptedException {
        // 1) Count storefront-visible products grouped by category id.
        Map<String, Integer> productCounts = new HashMap<>();
        for (QueryDocumentSnapshot product : firestore.collection("products").get().get().getDocuments()) {
            if (!isVisibleOnStorefront(product)) {
                continue;
            }
            String category = Objects.toString(product.get("category"), "").trim();
            if (!category.isBlank()) {
                productCounts.merge(category, 1, Integer::sum);
            }
        }

        // 2) Collect active categories from the categories collection.
        Map<String, Map<String, Object>> categories = new LinkedHashMap<>();
        for (QueryDocumentSnapshot doc : firestore.collection("categories").get().get().getDocuments()) {
            if (Boolean.FALSE.equals(doc.get("active"))) {
                continue;
            }
            String id = doc.getId();
            Map<String, Object> category = new HashMap<>();
            category.put("id", id);
            category.put("name", Objects.toString(doc.get("name"), titleFromId(id)));
            category.put("icon", Objects.toString(doc.get("icon"), "fa-box"));
            category.put("count", productCounts.getOrDefault(id, 0));
            categories.put(id, category);
        }

        // 3) Derive categories that only exist on products (legacy/seed safety).
        for (Map.Entry<String, Integer> entry : productCounts.entrySet()) {
            if (categories.containsKey(entry.getKey())) {
                continue;
            }
            Map<String, Object> category = new HashMap<>();
            category.put("id", entry.getKey());
            category.put("name", titleFromId(entry.getKey()));
            category.put("icon", "fa-box");
            category.put("count", entry.getValue());
            categories.put(entry.getKey(), category);
        }

        return categories.values().stream()
            .sorted(Comparator.comparing(category -> Objects.toString(category.get("name"), "")))
            .toList();
    }

    private boolean isVisibleOnStorefront(QueryDocumentSnapshot product) {
        if (Boolean.FALSE.equals(product.get("active")) || Boolean.TRUE.equals(product.get("deleted"))) {
            return false;
        }
        String status = Objects.toString(product.get("status"), "ACTIVE").trim().toUpperCase(Locale.ROOT);
        if (!status.isBlank() && !"ACTIVE".equals(status)) {
            return false;
        }
        return readDouble(product.get("price")) > 0;
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

    private String titleFromId(String id) {
        String[] parts = id.replace('-', ' ').replace('_', ' ').split(" ");
        List<String> words = new ArrayList<>();
        for (String part : parts) {
            if (part.isBlank()) {
                continue;
            }
            words.add(part.substring(0, 1).toUpperCase(Locale.ROOT) + part.substring(1));
        }
        return String.join(" ", words);
    }
}
