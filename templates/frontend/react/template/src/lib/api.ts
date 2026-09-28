import { API_URL } from './config';

export interface ExampleResponse {
  message: string;
  receivedAt: string;
}

// Matches shared/contracts/openapi.yaml — both the Node and .NET backends
// return this exact shape.
export async function fetchExample(): Promise<ExampleResponse> {
  const response = await fetch(`${API_URL}/example`);

  if (!response.ok) {
    throw new Error(`Request failed with status ${response.status}`);
  }

  return (await response.json()) as ExampleResponse;
}
