namespace {{dotnetNamespace}}.Api.Models;

// Matches shared/contracts/openapi.yaml's ExampleResponse schema.
public class ExampleResponse
{
    public string Message { get; set; } = string.Empty;
    public string ReceivedAt { get; set; } = string.Empty;
}
