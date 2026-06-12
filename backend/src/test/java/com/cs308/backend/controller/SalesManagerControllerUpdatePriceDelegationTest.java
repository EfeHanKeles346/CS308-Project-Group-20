package com.cs308.backend.controller;

import com.cs308.backend.service.SalesManagerService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class SalesManagerControllerUpdatePriceDelegationTest {

    @Test
    void updatePriceDelegatesProductIdAndPriceBody() throws Exception {
        FakeSalesManagerService salesManagerService = new FakeSalesManagerService();
        SalesManagerController controller = new SalesManagerController(salesManagerService);
        Map<String, Object> request = Map.of("price", 999.0);

        Map<String, Object> response = controller.updatePrice("product-1", request);

        assertEquals("product-1", salesManagerService.productId);
        assertSame(request, salesManagerService.priceBody);
        assertSame(salesManagerService.priceResponse, response);
    }

    private static class FakeSalesManagerService extends SalesManagerService {
        private String productId;
        private Map<String, Object> priceBody;
        private final Map<String, Object> priceResponse = Map.of("price", 999.0);

        FakeSalesManagerService() {
            super(null, null);
        }

        @Override
        public Map<String, Object> updatePrice(String productId, Map<String, Object> body) {
            this.productId = productId;
            priceBody = body;
            return priceResponse;
        }
    }
}
