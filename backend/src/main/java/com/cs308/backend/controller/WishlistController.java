package com.cs308.backend.controller;

import com.google.cloud.firestore.DocumentReference;
import com.google.cloud.firestore.DocumentSnapshot;
import com.google.cloud.firestore.Firestore;
import com.google.cloud.firestore.QueryDocumentSnapshot;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Objects;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/wishlist")
@CrossOrigin(origins = "*")
public class WishlistController {

    private final Firestore firestore;

    public WishlistController(Firestore firestore) {
        this.firestore = firestore;
    }

    @GetMapping("/{email}")
    public List<Map<String, Object>> getWishlist(@PathVariable String email)
            throws ExecutionException, InterruptedException {
        validateRegisteredUser(email);

        List<QueryDocumentSnapshot> docs = firestore.collection("wishlists")
            .document(email)
            .collection("items")
            .get()
            .get()
            .getDocuments();

        List<Map<String, Object>> items = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> item = new HashMap<>(doc.getData());
            String productId = Objects.toString(item.get("productId"), doc.getId());
            DocumentSnapshot productSnapshot = firestore.collection("products").document(productId).get().get();

            item.put("productId", productId);
            item.put("wishlistItemId", doc.getId());

            if (productSnapshot.exists() && productSnapshot.getData() != null) {
                item.putAll(productSnapshot.getData());
                item.putIfAbsent("id", productId);
            }

            items.add(item);
        }

        return items;
    }

    @PostMapping("/add")
    public Map<String, Object> addToWishlist(@RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        String email = Objects.toString(body.get("userEmail"), "");
        String productId = Objects.toString(body.get("productId"), "");

        validateRegisteredUser(email);
        validateProduct(productId);

        DocumentReference docRef = firestore.collection("wishlists")
            .document(email)
            .collection("items")
            .document(productId);

        Map<String, Object> item = new HashMap<>();
        item.put("productId", productId);
        item.put("createdAt", System.currentTimeMillis());
        docRef.set(item).get();

        return Map.of("status", "ok", "productId", productId);
    }

    @DeleteMapping("/remove/{productId}")
    public Map<String, Object> removeFromWishlist(
            @PathVariable String productId,
            @RequestParam String email) throws ExecutionException, InterruptedException {
        validateRegisteredUser(email);

        firestore.collection("wishlists")
            .document(email)
            .collection("items")
            .document(productId)
            .delete()
            .get();

        return Map.of("status", "deleted", "productId", productId);
    }

    private void validateRegisteredUser(String email) throws ExecutionException, InterruptedException {
        if (email == null || email.isBlank()) {
            throw new IllegalArgumentException("Only registered users can use wishlist.");
        }

        boolean userExists = !firestore.collection("users")
            .whereEqualTo("email", email)
            .limit(1)
            .get()
            .get()
            .isEmpty();

        if (!userExists) {
            throw new IllegalArgumentException("Only registered users can use wishlist.");
        }
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
}
