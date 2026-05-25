package com.cs308.backend.controller;

import com.cs308.backend.service.ProductManagerService;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.DeleteMapping;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PatchMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Map;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/product-manager")
@CrossOrigin(origins = "*")
public class ProductManagerController {

    private final ProductManagerService productManagerService;

    public ProductManagerController(ProductManagerService productManagerService) {
        this.productManagerService = productManagerService;
    }

    @GetMapping("/categories")
    public List<Map<String, Object>> getCategories() throws ExecutionException, InterruptedException {
        return productManagerService.getCategories();
    }

    @PostMapping("/categories")
    public Map<String, Object> addCategory(@RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return productManagerService.addCategory(body);
    }

    @DeleteMapping("/categories/{categoryId}")
    public Map<String, Object> removeCategory(@PathVariable String categoryId)
            throws ExecutionException, InterruptedException {
        return productManagerService.removeCategory(categoryId);
    }

    @PatchMapping("/categories/{categoryId}/restore")
    public Map<String, Object> restoreCategory(@PathVariable String categoryId)
            throws ExecutionException, InterruptedException {
        return productManagerService.restoreCategory(categoryId);
    }

    @GetMapping("/products")
    public List<Map<String, Object>> getProducts() throws ExecutionException, InterruptedException {
        return productManagerService.getProducts();
    }

    @PostMapping("/products")
    public Map<String, Object> addProduct(@RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return productManagerService.addProduct(body);
    }

    @DeleteMapping("/products/{productId}")
    public Map<String, Object> archiveProduct(@PathVariable String productId)
            throws ExecutionException, InterruptedException {
        return productManagerService.archiveProduct(productId);
    }

    @PatchMapping("/products/{productId}/restore")
    public Map<String, Object> restoreProduct(@PathVariable String productId)
            throws ExecutionException, InterruptedException {
        return productManagerService.restoreProduct(productId);
    }

    @PatchMapping("/products/{productId}/stock")
    public Map<String, Object> updateStock(@PathVariable String productId, @RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return productManagerService.updateStock(productId, body);
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> getOrders(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to) throws ExecutionException, InterruptedException {
        return productManagerService.getOrders(from, to);
    }

    @PatchMapping("/orders/{orderId}/status")
    public Map<String, Object> updateOrderStatus(@PathVariable String orderId, @RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return productManagerService.updateOrderStatus(orderId, body);
    }

    @GetMapping("/comments")
    public List<Map<String, Object>> getComments() throws ExecutionException, InterruptedException {
        return productManagerService.getComments();
    }

    @PatchMapping("/comments/{productId}/{commentId}")
    public Map<String, Object> decideComment(
            @PathVariable String productId,
            @PathVariable String commentId,
            @RequestBody Map<String, Object> body) throws ExecutionException, InterruptedException {
        return productManagerService.decideComment(productId, commentId, body);
    }
}
