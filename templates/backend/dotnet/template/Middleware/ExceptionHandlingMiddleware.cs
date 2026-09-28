using System.Net;
using System.Text.Json;
using {{dotnetNamespace}}.Api.Models;

namespace {{dotnetNamespace}}.Api.Middleware;

public class ExceptionHandlingMiddleware(RequestDelegate next, ILogger<ExceptionHandlingMiddleware> logger)
{
    private static readonly JsonSerializerOptions JsonOptions = new() { PropertyNamingPolicy = JsonNamingPolicy.CamelCase };

    public async Task InvokeAsync(HttpContext context)
    {
        try
        {
            await next(context);
        }
        catch (Exception exception)
        {
            logger.LogError(exception, "Unhandled exception while processing {Path}", context.Request.Path);

            context.Response.ContentType = "application/json";
            context.Response.StatusCode = (int)HttpStatusCode.InternalServerError;

            var error = new ErrorResponse
            {
                StatusCode = context.Response.StatusCode,
                Message = "Internal server error",
            };

            await context.Response.WriteAsync(JsonSerializer.Serialize(error, JsonOptions));
        }
    }
}
