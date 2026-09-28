import { Injectable } from '@nestjs/common';

// Matches shared/contracts/openapi.yaml's ExampleResponse schema.
export interface ExampleResponse {
  message: string;
  receivedAt: string;
}

@Injectable()
export class ExampleService {
  getExample(name?: string): ExampleResponse {
    const who = name?.trim() || undefined;
    return {
      message: who ? `Hello, ${who}! This is the example API endpoint.` : 'Hello from the example API endpoint',
      receivedAt: new Date().toISOString(),
    };
  }
}
