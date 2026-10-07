package com.example.{{javaPackageName}}.service;

import com.example.{{javaPackageName}}.dto.ExampleResponse;
import java.time.Instant;
import org.springframework.stereotype.Service;

@Service
public class ExampleServiceImpl implements ExampleService {

    @Override
    public ExampleResponse getExample(String name) {
        String who = (name == null || name.isBlank()) ? null : name.trim();
        String message = who != null
                ? "Hello, " + who + "! This is the example API endpoint."
                : "Hello from the example API endpoint";
        return new ExampleResponse(message, Instant.now().toString());
    }
}
