package com.cs308.backend.service;

import java.util.HashMap;
import java.util.Map;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.http.MediaType;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestClient;
import org.springframework.web.client.RestClientResponseException;

import com.cs308.backend.dto.auth.AuthResponse;
import com.cs308.backend.dto.auth.LoginRequest;
import com.cs308.backend.dto.auth.RegisterRequest;
import com.google.api.core.ApiFuture;
import com.google.cloud.firestore.Firestore;
import com.google.firebase.auth.FirebaseAuth;
import com.google.firebase.auth.FirebaseAuthException;
import com.google.firebase.auth.UserRecord;
import com.google.firebase.auth.UserRecord.CreateRequest;

@Service
public class AuthService {

    private final Firestore firestore;
    private final RestClient restClient;
    private final String firebaseWebApiKey;

    public AuthService(Firestore firestore, @Value("${firebase.web-api-key}") String firebaseWebApiKey) {
        this.firestore = firestore;
        this.firebaseWebApiKey = firebaseWebApiKey;
        this.restClient = RestClient.builder()
            .baseUrl("https://identitytoolkit.googleapis.com/v1")
            .build();
    }

    public AuthResponse register(RegisterRequest request) {
        try {
            String fullName = (request.firstName() + " " + request.lastName()).trim();

            UserRecord userRecord = FirebaseAuth.getInstance().createUser(
                new CreateRequest()
                    .setEmail(request.email())
                    .setPassword(request.password())
                    .setDisplayName(fullName)
            );

            Map<String, Object> userProfile = new HashMap<>();
            userProfile.put("uid", userRecord.getUid());
            userProfile.put("email", userRecord.getEmail());
            userProfile.put("firstName", request.firstName());
            userProfile.put("lastName", request.lastName());
            userProfile.put("fullName", fullName);
            userProfile.put("phone", request.phone());
            userProfile.put("createdAt", System.currentTimeMillis());

            ApiFuture<com.google.cloud.firestore.WriteResult> writeFuture =
                firestore.collection("users").document(userRecord.getUid()).set(userProfile);
            writeFuture.get();

            LoginResponse loginResponse = signInWithEmailAndPassword(request.email(), request.password());

            return new AuthResponse(
                userRecord.getUid(),
                userRecord.getEmail(),
                userRecord.getDisplayName(),
                loginResponse.idToken(),
                loginResponse.refreshToken(),
                "User registered successfully"
            );
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Firebase registration failed: " + exception.getMessage(), exception);
        } catch (Exception exception) {
            throw new IllegalStateException("Registration failed: " + exception.getMessage(), exception);
        }
    }

    public AuthResponse login(LoginRequest request) {
        LoginResponse loginResponse = signInWithEmailAndPassword(request.email(), request.password());

        try {
            UserRecord userRecord = FirebaseAuth.getInstance().getUser(loginResponse.localId());
            return new AuthResponse(
                userRecord.getUid(),
                userRecord.getEmail(),
                userRecord.getDisplayName(),
                loginResponse.idToken(),
                loginResponse.refreshToken(),
                "Login successful"
            );
        } catch (FirebaseAuthException exception) {
            throw new IllegalStateException("Login succeeded but user lookup failed: " + exception.getMessage(), exception);
        }
    }

    private LoginResponse signInWithEmailAndPassword(String email, String password) {
        if (firebaseWebApiKey == null || firebaseWebApiKey.isBlank()) {
            throw new IllegalStateException("firebase.web-api-key is missing");
        }

        try {
            return restClient.post()
                .uri(uriBuilder -> uriBuilder
                    .path("/accounts:signInWithPassword")
                    .queryParam("key", firebaseWebApiKey)
                    .build())
                .contentType(MediaType.APPLICATION_JSON)
                .body(Map.of(
                    "email", email,
                    "password", password,
                    "returnSecureToken", true
                ))
                .retrieve()
                .body(LoginResponse.class);
        } catch (RestClientResponseException exception) {
            throw new IllegalStateException("Firebase login failed: " + exception.getResponseBodyAsString(), exception);
        }
    }

    private record LoginResponse(
        String localId,
        String email,
        String displayName,
        String idToken,
        String refreshToken
    ) {
    }
}
