package com.cs308.backend.controller;

import com.google.cloud.firestore.*;
import com.google.firebase.cloud.FirestoreClient;
import org.springframework.web.bind.annotation.*;

import java.util.*;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/cart")
@CrossOrigin(origins = "*")
public class CartController {

    // Returns a Firestore instance using the initialized Firebase app
    private Firestore getDb() {
        return FirestoreClient.getFirestore();
    }

    // Get all cart items for a specific user by email
    @GetMapping("/{email}")
    public List<Map<String, Object>> getCart(@PathVariable String email) throws ExecutionException, InterruptedException {
        CollectionReference cartRef = getDb().collection("carts").document(email).collection("items");
        List<QueryDocumentSnapshot> docs = cartRef.get().get().getDocuments();

        List<Map<String, Object>> items = new ArrayList<>();
        for (QueryDocumentSnapshot doc : docs) {
            Map<String, Object> item = doc.getData();
            item.put("id", doc.getId()); // used as dbId on the frontend
            items.add(item);
        }
        return items;
    }

    // Add a product to the cart, or increase its quantity if it already exists
    @PostMapping("/add")
    public Map<String, Object> addToCart(@RequestBody Map<String, Object> body) throws ExecutionException, InterruptedException {
        String email = (String) body.get("userEmail");
        String productId = body.get("productId").toString();
        int quantity = ((Number) body.get("quantity")).intValue();

        DocumentReference docRef = getDb()
            .collection("carts").document(email)
            .collection("items").document(productId);

        DocumentSnapshot existing = docRef.get().get();

        if (existing.exists()) {
            // Item already exists in cart, increment quantity
            int currentQty = ((Number) Objects.requireNonNull(existing.get("quantity"))).intValue();
            docRef.update("quantity", currentQty + quantity).get();
        } else {
            // Item not in cart yet, create a new entry
            Map<String, Object> newItem = new HashMap<>();
            newItem.put("productId", productId);
            newItem.put("quantity", quantity);
            docRef.set(newItem).get();
        }

        return Map.of("status", "ok", "productId", productId);
    }

    // Set a cart item's quantity directly so the frontend can persist +/- changes.
    @PutMapping("/update")
    public Map<String, Object> updateCartItemQuantity(@RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        String email = (String) body.get("userEmail");
        String productId = body.get("productId").toString();
        int quantity = ((Number) body.get("quantity")).intValue();

        DocumentReference docRef = getDb()
            .collection("carts").document(email)
            .collection("items").document(productId);

        if (quantity <= 0) {
            docRef.delete().get();
            return Map.of("status", "deleted", "productId", productId);
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
        getDb().collection("carts").document(email)
               .collection("items").document(productId).delete().get();
        return Map.of("status", "deleted");
    }

    // Remove all items from the user's cart
    @DeleteMapping("/clear/{email}")
    public Map<String, Object> clearCart(@PathVariable String email) throws ExecutionException, InterruptedException {
        CollectionReference cartRef = getDb().collection("carts").document(email).collection("items");
        List<QueryDocumentSnapshot> docs = cartRef.get().get().getDocuments();
        for (QueryDocumentSnapshot doc : docs) {
            doc.getReference().delete().get();
        }
        return Map.of("status", "cleared");
    }
}
