package com.example.{{javaPackageName}}.dto;

// Matches shared/contracts/openapi.yaml's ExampleResponse schema. Jackson
// serializes a record's components using their declared names, which are
// already camelCase here, so no naming-policy configuration is needed.
public record ExampleResponse(String message, String receivedAt) {
}
