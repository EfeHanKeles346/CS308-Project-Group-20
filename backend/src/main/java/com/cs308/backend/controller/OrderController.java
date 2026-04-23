package com.cs308.backend.controller;

import com.cs308.backend.model.Order;
import com.cs308.backend.service.OrderService;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.CrossOrigin;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.Locale;
import java.util.concurrent.ExecutionException;

@RestController
@RequestMapping("/api/orders")
@CrossOrigin(origins = "*")
public class OrderController {

    private final OrderService orderService;

    public OrderController(OrderService orderService) {
        this.orderService = orderService;
    }

    @PostMapping
    public Order createOrder(@RequestBody Order order) throws ExecutionException, InterruptedException {
        return orderService.createOrder(order);
    }

    @GetMapping("/user/{email}")
    public List<Order> getOrdersForUser(@PathVariable String email)
            throws ExecutionException, InterruptedException {
        return orderService.getOrdersByUserEmail(email);
    }

    @GetMapping("/{orderId}/invoice")
    public ResponseEntity<byte[]> downloadInvoice(@PathVariable String orderId)
            throws ExecutionException, InterruptedException {
        byte[] pdf = orderService.getInvoicePdf(orderId);
        if (pdf == null) {
            return ResponseEntity.notFound().build();
        }

        String shortId = orderId.length() <= 10
            ? orderId.toUpperCase(Locale.ROOT)
            : orderId.substring(0, 8).toUpperCase(Locale.ROOT);
        String filename = "invoice-" + shortId + ".pdf";

        return ResponseEntity.ok()
            .contentType(MediaType.APPLICATION_PDF)
            .header(HttpHeaders.CONTENT_DISPOSITION, "inline; filename=\"" + filename + "\"")
            .body(pdf);
    }
}
