using {{dotnetNamespace}}.Api.Models;

namespace {{dotnetNamespace}}.Api.Services;

public interface IExampleService
{
    ExampleResponse GetExample(string? name);
}
