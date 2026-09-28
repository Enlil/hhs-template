using System.ComponentModel.DataAnnotations;

namespace {{dotnetNamespace}}.Api.Models;

public class ExampleQuery
{
    [StringLength(50, ErrorMessage = "name must be 50 characters or fewer.")]
    public string? Name { get; set; }
}
