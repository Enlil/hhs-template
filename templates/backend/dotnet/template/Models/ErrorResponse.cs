namespace {{dotnetNamespace}}.Api.Models;

// Matches shared/contracts/openapi.yaml's ErrorResponse schema.
public class ErrorResponse
{
    public int StatusCode { get; set; }
    public string Message { get; set; } = string.Empty;
    public string? Error { get; set; }
}
