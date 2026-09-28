using {{dotnetNamespace}}.Api.Models;
using {{dotnetNamespace}}.Api.Services;
using Microsoft.AspNetCore.Mvc;

namespace {{dotnetNamespace}}.Api.Controllers;

// [ApiController] validates ExampleQuery automatically and returns 400 via
// the InvalidModelStateResponseFactory configured in Program.cs before this
// action ever runs.
[ApiController]
[Route("api/example")]
public class ExampleController(IExampleService exampleService) : ControllerBase
{
    [HttpGet]
    public ActionResult<ExampleResponse> Get([FromQuery] ExampleQuery query)
    {
        return Ok(exampleService.GetExample(query.Name));
    }
}
