using {{dotnetNamespace}}.Api.Models;

namespace {{dotnetNamespace}}.Api.Services;

public class ExampleService : IExampleService
{
    public ExampleResponse GetExample(string? name)
    {
        var who = string.IsNullOrWhiteSpace(name) ? null : name.Trim();

        return new ExampleResponse
        {
            Message = who is not null
                ? $"Hello, {who}! This is the example API endpoint."
                : "Hello from the example API endpoint",
            ReceivedAt = DateTime.UtcNow.ToString("o"),
        };
    }
}
