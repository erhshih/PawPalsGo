using System.Text;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using PawPals.Api.Data;
using PawPals.Api.Hubs;
using PawPals.Api.Services;

var builder = WebApplication.CreateBuilder(args);

var dbUrl = Environment.GetEnvironmentVariable("DATABASE_URL")
    ?? builder.Configuration["DATABASE_URL"]
    ?? throw new Exception("DATABASE_URL is required");
var redisUrl = Environment.GetEnvironmentVariable("REDIS_URL")
    ?? builder.Configuration["REDIS_URL"]
    ?? "localhost:6379";
var jwtSecret = Environment.GetEnvironmentVariable("JWT_SECRET")
    ?? builder.Configuration["JWT_SECRET"]
    ?? throw new Exception("JWT_SECRET is required");

builder.Services.AddDbContext<AppDbContext>(opt => opt.UseNpgsql(dbUrl));

builder.Services.AddSingleton<IConnectionMultiplexer>(_ =>
    ConnectionMultiplexer.Connect(redisUrl));

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(opt =>
    {
        opt.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuerSigningKey = true,
            IssuerSigningKey = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtSecret)),
            ValidateIssuer = false,
            ValidateAudience = false,
        };
        opt.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments("/hubs"))
                    ctx.Token = token;
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddAuthorization();
builder.Services.AddControllers();
builder.Services.AddSignalR();
builder.Services.AddCors(opt => opt.AddDefaultPolicy(p =>
    p.AllowAnyOrigin().AllowAnyMethod().AllowAnyHeader()));

builder.Services.AddScoped<AuthService>();
builder.Services.AddScoped<DiscoverService>();

var app = builder.Build();

app.UseCors();
app.UseAuthentication();
app.UseAuthorization();
app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");
app.MapGet("/health", () => "ok");

app.Run();
