using System.Text.Json.Serialization;
using System.Threading.RateLimiting;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.HttpOverrides;
using Microsoft.Extensions.Options;
using Microsoft.IdentityModel.Tokens;
using TrustNobody.Api.Endpoints;
using TrustNobody.Api.Infrastructure;
using TrustNobody.Api.Realtime;
using TrustNobody.Application;
using TrustNobody.Application.Abstractions;
using TrustNobody.Infrastructure;
using TrustNobody.Infrastructure.Security;

var builder = WebApplication.CreateBuilder(args);
var config = builder.Configuration;

// ── Katmanlar ──
builder.Services.AddApplication();
builder.Services.AddInfrastructure(config);
builder.Services.AddSingleton<IGameNotifier, SignalRGameNotifier>();
builder.Services.AddHostedService<GamePhaseWorker>();

// ── Web ──
builder.Services.ConfigureHttpJsonOptions(o => o.SerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddSignalR().AddJsonProtocol(o => o.PayloadSerializerOptions.Converters.Add(new JsonStringEnumConverter()));
builder.Services.AddExceptionHandler<DomainExceptionHandler>();
builder.Services.AddProblemDetails();
builder.Services.AddOpenApi();
builder.Services.AddHealthChecks();

// Expo web (ör. http://localhost:8081) farklı origin'den bağlanır. Üretimde nginx aynı origin'den proxy'ler.
// Geliştirmede Expo portu değişebildiği (8081 doluysa 8082...) ve telefonlar LAN IP'siyle geldiği için
// localhost ve yerel ağ adresleri her portta kabul edilir. Üretimde sadece Cors:Origins listesi geçerlidir.
var corsOrigins = config.GetSection("Cors:Origins").Get<string[]>() ?? [];
var isDev = builder.Environment.IsDevelopment();
builder.Services.AddCors(o => o.AddDefaultPolicy(p => p
    .SetIsOriginAllowed(origin => corsOrigins.Contains(origin) || (isDev && CorsRules.IsLocalOrigin(origin)))
    .AllowAnyHeader()
    .AllowAnyMethod()
    .AllowCredentials()));

// Giriş/kayıt denemelerini IP başına dakikada sınırla (kaba kuvvet saldırılarına karşı)
var authPermitPerMinute = config.GetValue("RateLimiting:AuthPermitPerMinute", 10);
builder.Services.AddRateLimiter(o =>
{
    o.RejectionStatusCode = StatusCodes.Status429TooManyRequests;
    o.AddPolicy(RateLimits.Auth, ctx => RateLimitPartition.GetFixedWindowLimiter(
        ctx.Connection.RemoteIpAddress?.ToString() ?? "unknown",
        _ => new FixedWindowRateLimiterOptions { PermitLimit = authPermitPerMinute, Window = TimeSpan.FromMinutes(1) }));
});

// ── Kimlik doğrulama (JWT) ──
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme).AddJwtBearer();
builder.Services.AddOptions<JwtBearerOptions>(JwtBearerDefaults.AuthenticationScheme)
    .Configure<IOptions<JwtOptions>>((o, jwt) =>
    {
        o.MapInboundClaims = false; // "sub" claim'i olduğu gibi kalsın
        o.TokenValidationParameters = new TokenValidationParameters
        {
            ValidIssuer = jwt.Value.Issuer,
            ValidAudience = jwt.Value.Audience,
            IssuerSigningKey = jwt.Value.SigningKey(),
            NameClaimType = "unique_name",
        };
        // SignalR WebSocket bağlantısında token query string ile gelir
        o.Events = new JwtBearerEvents
        {
            OnMessageReceived = ctx =>
            {
                var token = ctx.Request.Query["access_token"];
                if (!string.IsNullOrEmpty(token) && ctx.HttpContext.Request.Path.StartsWithSegments(GameHub.Path))
                    ctx.Token = token;
                return Task.CompletedTask;
            },
        };
    });
builder.Services.AddAuthorization();

builder.Services.Configure<ForwardedHeadersOptions>(o =>
{
    o.ForwardedHeaders = ForwardedHeaders.XForwardedFor | ForwardedHeaders.XForwardedProto;
    o.KnownIPNetworks.Clear();
    o.KnownProxies.Clear();
});

var app = builder.Build();

if (config.GetValue("Database:MigrateOnStartup", true))
    await app.Services.MigrateDatabaseAsync(msg => app.Logger.LogWarning("{Message}", msg));

app.UseForwardedHeaders();
app.UseExceptionHandler();
app.UseCors();
app.UseRateLimiter();
app.UseAuthentication();
app.UseAuthorization();

if (app.Environment.IsDevelopment()) app.MapOpenApi(); // /openapi/v1.json

app.MapHealthChecks("/health");
app.MapAuthEndpoints();
app.MapGameEndpoints();
app.MapHub<GameHub>(GameHub.Path);

app.Run();

public partial class Program; // entegrasyon testleri için
