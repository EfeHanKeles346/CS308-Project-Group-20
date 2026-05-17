package com.cs308.backend.controller;

import com.cs308.backend.model.RefundRequest;
import com.cs308.backend.service.SalesManagerService;
import org.springframework.web.bind.annotation.CrossOrigin;
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
@RequestMapping("/api/sales-manager")
@CrossOrigin(origins = "*")
public class SalesManagerController {

    private final SalesManagerService salesManagerService;

    public SalesManagerController(SalesManagerService salesManagerService) {
        this.salesManagerService = salesManagerService;
    }

    @GetMapping("/products")
    public List<Map<String, Object>> getProducts() throws ExecutionException, InterruptedException {
        return salesManagerService.getProducts();
    }

    @PatchMapping("/products/{productId}/price")
    public Map<String, Object> updatePrice(@PathVariable String productId, @RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return salesManagerService.updatePrice(productId, body);
    }

    @PatchMapping("/products/{productId}/discount")
    public Map<String, Object> applyDiscount(@PathVariable String productId, @RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return salesManagerService.applyDiscount(productId, body);
    }

    @GetMapping("/orders")
    public List<Map<String, Object>> getOrders(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to) throws ExecutionException, InterruptedException {
        return salesManagerService.getOrders(from, to);
    }

    @GetMapping("/revenue")
    public List<Map<String, Object>> getDailyRevenue(
            @RequestParam(required = false) Long from,
            @RequestParam(required = false) Long to) throws ExecutionException, InterruptedException {
        return salesManagerService.getDailyRevenue(from, to);
    }

    @GetMapping("/refunds")
    public List<RefundRequest> getRefundRequests() throws ExecutionException, InterruptedException {
        return salesManagerService.getRefundRequests();
    }

    @PostMapping("/refunds/{refundId}/decision")
    public RefundRequest decideRefund(@PathVariable String refundId, @RequestBody Map<String, Object> body)
            throws ExecutionException, InterruptedException {
        return salesManagerService.decideRefund(refundId, body);
    }
}
