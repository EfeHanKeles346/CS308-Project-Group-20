package com.cs308.backend.service;

import com.fasterxml.jackson.core.type.TypeReference;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.google.cloud.firestore.Firestore;
import org.springframework.boot.ApplicationArguments;
import org.springframework.boot.ApplicationRunner;
import org.springframework.core.io.ClassPathResource;
import org.springframework.stereotype.Service;

import java.io.InputStream;
import java.util.List;
import java.util.Map;

@Service
public class ProductSeedService implements ApplicationRunner {

    private final Firestore firestore;

    public ProductSeedService(Firestore firestore) {
        this.firestore = firestore;
    }

    @Override
    public void run(ApplicationArguments args) throws Exception {
        var existingProducts = firestore.collection("products").limit(1).get().get();
        if (!existingProducts.isEmpty()) {
            return;
        }

        ClassPathResource resource = new ClassPathResource("products-seed.json");
        try (InputStream inputStream = resource.getInputStream()) {
            List<Map<String, Object>> products = new ObjectMapper().readValue(
                inputStream,
                new TypeReference<>() {}
            );

            for (Map<String, Object> product : products) {
                Object id = product.get("id");
                if (id == null) {
                    continue;
                }
                firestore.collection("products").document(id.toString()).set(product).get();
            }
        }
    }
}
