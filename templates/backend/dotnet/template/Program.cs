using {{dotnetNamespace}}.Api.Middleware;
using {{dotnetNamespace}}.Api.Models;
using {{dotnetNamespace}}.Api.Services;
using Microsoft.AspNetCore.Mvc;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddScoped<IExampleService, ExampleService>();

// Matches the ErrorResponse shape in shared/contracts/openapi.yaml, so
// validation failures look the same as the Node backend's instead of
// ASP.NET Core's default ValidationProblemDetails shape.
builder.Services.Configure<ApiBehaviorOptions>(options =>
{
    options.InvalidModelStateResponseFactory = context =>
    {
        var message = string.Join(' ', context.ModelState.Values.SelectMany(v => v.Errors).Select(e => e.ErrorMessage));
        return new BadRequestObjectResult(new ErrorResponse
        {
            StatusCode = StatusCodes.Status400BadRequest,
            Message = string.IsNullOrWhiteSpace(message) ? "Validation failed." : message,
            Error = "Bad Request",
        });
    };
});

var frontendUrl = builder.Configuration["Cors:FrontendUrl"] ?? "{{frontendUrl}}";
builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy => policy.WithOrigins(frontendUrl).AllowAnyHeader().AllowAnyMethod());
});

var app = builder.Build();

app.UseMiddleware<ExceptionHandlingMiddleware>();

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

app.UseCors("Frontend");
app.MapControllers();

app.Run();
