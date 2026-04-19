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
import org.springframework.web.bind.annotation.PutMapping;
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
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    private final Firestore firestore;

    public CartController(Firestore firestore) {
        this.firestore = firestore;
    }

    private DocumentSnapshot getProductSnapshot(String productId) throws ExecutionException, InterruptedException {
        DocumentSnapshot productSnapshot = firestore.collection("products").document(productId).get().get();
        if (!productSnapshot.exists()) {
            throw new IllegalArgumentException("Product not found: " + productId);
        }
        return productSnapshot;
    }

    private int getProductStock(String productId) throws ExecutionException, InterruptedException {
        Object stock = getProductSnapshot(productId).get("stock");
        if (!(stock instanceof Number number)) {
            throw new IllegalStateException("Product stock is missing for product: " + productId);
        }
        return number.intValue();
    }

    // Get all cart items for a specific user by email
    @GetMapping("/{email}")
    public List<Map<String, Object>> getCart(@PathVariable String email) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection("carts").document(email).collection("items").get().get().getDocuments();

        List<Map<String, Object>> items = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> item = new HashMap<>(doc.getData());
            String productId = Objects.toString(item.get("productId"), doc.getId());
            DocumentSnapshot productSnapshot = firestore.collection("products").document(productId).get().get();

            item.put("productId", productId);
            item.put("cartItemId", doc.getId());

            if (productSnapshot.exists() && productSnapshot.getData() != null) {
                item.putAll(productSnapshot.getData());
                item.putIfAbsent("id", productId);
            }

            items.add(item);
        }
        return items;
    }

    // Add a product to the cart, or increase its quantity if it already exists
    @PostMapping("/add")
    public Map<String, Object> addToCart(@RequestBody Map<String, Object> body) throws ExecutionException, InterruptedException {
        String email = (String) body.get("userEmail");
        String productId = body.get("productId").toString();
        int quantity = ((Number) body.getOrDefault("quantity", 1)).intValue();
        int stock = getProductStock(productId);

        DocumentReference docRef = firestore
            .collection("carts").document(email)
            .collection("items").document(productId);

        DocumentSnapshot existing = docRef.get().get();
        int nextQuantity = quantity;

        if (existing.exists()) {
            // Item already exists in cart, increment quantity
            int currentQty = ((Number) Objects.requireNonNull(existing.get("quantity"))).intValue();
            nextQuantity = currentQty + quantity;
        }

        if (nextQuantity > stock) {
            throw new IllegalArgumentException("Requested quantity exceeds product stock.");
        }

        if (existing.exists()) {
            docRef.update("quantity", nextQuantity).get();
        } else {
            // Item not in cart yet, create a new entry
            Map<String, Object> newItem = new HashMap<>();
            newItem.put("productId", productId);
            newItem.put("quantity", nextQuantity);
            docRef.set(newItem).get();
        }

        return Map.of("status", "ok", "productId", productId, "quantity", nextQuantity);
    }

    // Set a cart item's quantity directly so the frontend can persist +/- changes.
    @PutMapping("/update")
    public Map<String, Object> updateCartItemQuantity(@RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        String email = (String) body.get("userEmail");
        String productId = body.get("productId").toString();
        int quantity = ((Number) body.get("quantity")).intValue();

        DocumentReference docRef = firestore
            .collection("carts").document(email)
            .collection("items").document(productId);

        if (quantity <= 0) {
            docRef.delete().get();
            return Map.of("status", "deleted", "productId", productId);
        }

        int stock = getProductStock(productId);
        if (quantity > stock) {
            throw new IllegalArgumentException("Requested quantity exceeds product stock.");
        }

        Map<String, Object> item = new HashMap<>();
        item.put("productId", productId);
        item.put("quantity", quantity);
        docRef.set(item).get();

        return Map.of("status", "updated", "productId", productId, "quantity", quantity);
    }

    // Remove a single product from the cart using productId and user email
    @DeleteMapping("/remove/{productId}")
    public Map<String, Object> removeFromCart(
            @PathVariable String productId,
            @RequestParam String email) throws ExecutionException, InterruptedException {
        firestore.collection("carts").document(email)
               .collection("items").document(productId).delete().get();
        return Map.of("status", "deleted");
    }

    // Remove all items from the user's cart
    @DeleteMapping("/clear/{email}")
    public Map<String, Object> clearCart(@PathVariable String email) throws ExecutionException, InterruptedException {
        List<QueryDocumentSnapshot> docs = firestore.collection("carts").document(email).collection("items").get().get().getDocuments();
        for (QueryDocumentSnapshot doc : docs) {
            doc.getReference().delete().get();
        }
        return Map.of("status", "cleared");
    }
}
