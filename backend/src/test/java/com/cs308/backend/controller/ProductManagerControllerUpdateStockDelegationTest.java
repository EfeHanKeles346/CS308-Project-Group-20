package com.cs308.backend.controller;

import com.cs308.backend.service.ProductManagerService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class ProductManagerControllerUpdateStockDelegationTest {

    @Test
    void updateStockDelegatesProductIdAndBody() throws Exception {
        FakeProductManagerService productManagerService = new FakeProductManagerService();
        ProductManagerController controller = new ProductManagerController(productManagerService);
        Map<String, Object> request = Map.of("stock", 15);

        Map<String, Object> response = controller.updateStock("product-1", request);

        assertEquals("product-1", productManagerService.productId);
        assertSame(request, productManagerService.stockBody);
        assertSame(productManagerService.stockResponse, response);
    }

    private static class FakeProductManagerService extends ProductManagerService {
        private String productId;
        private Map<String, Object> stockBody;
        private final Map<String, Object> stockResponse = Map.of("stock", 15);

        FakeProductManagerService() {
            super(null);
        }

        @Override
        public Map<String, Object> updateStock(String productId, Map<String, Object> body) {
            this.productId = productId;
            stockBody = body;
            return stockResponse;
        }
    }
}
