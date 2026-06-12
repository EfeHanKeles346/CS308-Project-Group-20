package com.cs308.backend.controller;

import com.cs308.backend.service.SalesManagerService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertSame;

class SalesManagerControllerApplyDiscountDelegationTest {

    @Test
    void applyDiscountDelegatesProductIdAndDiscountBody() throws Exception {
        FakeSalesManagerService salesManagerService = new FakeSalesManagerService();
        SalesManagerController controller = new SalesManagerController(salesManagerService);
        Map<String, Object> request = Map.of("discountPercent", 20);

        Map<String, Object> response = controller.applyDiscount("product-1", request);

        assertEquals("product-1", salesManagerService.productId);
        assertSame(request, salesManagerService.discountBody);
        assertSame(salesManagerService.discountResponse, response);
    }

    private static class FakeSalesManagerService extends SalesManagerService {
        private String productId;
        private Map<String, Object> discountBody;
        private final Map<String, Object> discountResponse = Map.of("discountPercent", 20);

        FakeSalesManagerService() {
            super(null, null);
        }

        @Override
        public Map<String, Object> applyDiscount(String productId, Map<String, Object> body) {
            this.productId = productId;
            discountBody = body;
            return discountResponse;
        }
    }
}
