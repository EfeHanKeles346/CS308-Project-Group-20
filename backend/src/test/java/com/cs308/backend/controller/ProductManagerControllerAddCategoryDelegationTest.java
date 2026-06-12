package com.cs308.backend.controller;

import com.cs308.backend.service.ProductManagerService;
import org.junit.jupiter.api.Test;

import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertSame;

class ProductManagerControllerAddCategoryDelegationTest {

    @Test
    void addCategoryDelegatesToProductManagerService() throws Exception {
        FakeProductManagerService productManagerService = new FakeProductManagerService();
        ProductManagerController controller = new ProductManagerController(productManagerService);
        Map<String, Object> request = Map.of("name", "Phones");

        Map<String, Object> response = controller.addCategory(request);

        assertSame(request, productManagerService.categoryBody);
        assertSame(productManagerService.categoryResponse, response);
    }

    private static class FakeProductManagerService extends ProductManagerService {
        private Map<String, Object> categoryBody;
        private final Map<String, Object> categoryResponse = Map.of("id", "phones");

        FakeProductManagerService() {
            super(null);
        }

        @Override
        public Map<String, Object> addCategory(Map<String, Object> body) {
            categoryBody = body;
            return categoryResponse;
        }
    }
}
