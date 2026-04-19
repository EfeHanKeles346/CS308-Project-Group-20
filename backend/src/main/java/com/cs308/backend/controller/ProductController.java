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
import java.util.List;
import java.util.Map;
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
            Map<String, Object> product = document.getData();
            product.putIfAbsent("id", document.getId());
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

        Map<String, Object> product = snapshot.getData();
        if (product == null) {
            throw new IllegalArgumentException("Product not found: " + id);
        }

        product.putIfAbsent("id", snapshot.getId());
        return product;
    }
}
