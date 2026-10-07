package com.example.{{javaPackageName}}.dto;

// Matches shared/contracts/openapi.yaml's ErrorResponse schema.
public record ErrorResponse(int statusCode, String message, String error) {
}
