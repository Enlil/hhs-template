package com.example.{{javaPackageName}}.controller;

import com.example.{{javaPackageName}}.dto.ExampleResponse;
import com.example.{{javaPackageName}}.service.ExampleService;
import jakarta.validation.constraints.Size;
// #if lombok
import lombok.RequiredArgsConstructor;
// #endif
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RequestParam;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/api/example")
// #if lombok
@RequiredArgsConstructor
// #endif
public class ExampleController {

    private final ExampleService exampleService;
    // #if !lombok

    public ExampleController(ExampleService exampleService) {
        this.exampleService = exampleService;
    }
    // #endif

    // The @Size constraint is checked by Spring MVC itself (no class-level
    // @Validated needed); a violation is turned into a 400 by
    // GlobalExceptionHandler.
    @GetMapping
    public ExampleResponse getExample(
            @RequestParam(required = false)
            @Size(max = 50, message = "name must be 50 characters or fewer")
            String name) {
        return exampleService.getExample(name);
    }
}
