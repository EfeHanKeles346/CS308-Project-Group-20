package com.cs308.backend.controller;

import com.cs308.backend.dto.auth.AuthResponse;
import com.cs308.backend.dto.auth.RegisterRequest;
import com.cs308.backend.service.AuthService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;

class AuthControllerRegisterDelegationTest {

    @Test
    void registerReturnsAuthServiceResponse() {
        FakeAuthService authService = new FakeAuthService();
        AuthController controller = new AuthController(authService);
        RegisterRequest request = new RegisterRequest("Test", "User", "user@example.com", "", "secret123");

        AuthResponse response = controller.register(request);

        assertSame(request, authService.registerRequest);
        assertSame(authService.registerResponse, response);
    }

    private static class FakeAuthService extends AuthService {
        private RegisterRequest registerRequest;
        private final AuthResponse registerResponse = new AuthResponse(
            "uid-1",
            "user@example.com",
            "Test User",
            "customer",
            "token",
            "refresh",
            "Registered"
        );

        FakeAuthService() {
            super(null, "api-key");
        }

        @Override
        public AuthResponse register(RegisterRequest request) {
            registerRequest = request;
            return registerResponse;
        }
    }
}
