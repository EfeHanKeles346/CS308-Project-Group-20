package com.cs308.backend.controller;

import com.cs308.backend.dto.auth.AuthResponse;
import com.cs308.backend.dto.auth.LoginRequest;
import com.cs308.backend.service.AuthService;
import org.junit.jupiter.api.Test;

import static org.junit.jupiter.api.Assertions.assertSame;

class AuthControllerLoginDelegationTest {

    @Test
    void loginReturnsAuthServiceResponse() {
        FakeAuthService authService = new FakeAuthService();
        AuthController controller = new AuthController(authService);
        LoginRequest request = new LoginRequest("user@example.com", "secret123");

        AuthResponse response = controller.login(request);

        assertSame(request, authService.loginRequest);
        assertSame(authService.loginResponse, response);
    }

    private static class FakeAuthService extends AuthService {
        private LoginRequest loginRequest;
        private final AuthResponse loginResponse = new AuthResponse(
            "uid-1",
            "user@example.com",
            "Test User",
            "customer",
            "token",
            "refresh",
            "Logged in"
        );

        FakeAuthService() {
            super(null, "api-key");
        }

        @Override
        public AuthResponse login(LoginRequest request) {
            loginRequest = request;
            return loginResponse;
        }
    }
}
