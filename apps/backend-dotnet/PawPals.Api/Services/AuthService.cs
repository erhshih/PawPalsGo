using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using StackExchange.Redis;
using PawPals.Api.Data;
using PawPals.Api.DTOs;
using PawPals.Api.Models;

namespace PawPals.Api.Services;

public class AuthService(AppDbContext db, IConnectionMultiplexer redis, IConfiguration config)
{
    private readonly IDatabase _redis = redis.GetDatabase();

    public async Task<TokenResponse> Register(RegisterDto dto)
    {
        if (await db.Users.AnyAsync(u => u.Email == dto.Email))
            throw new InvalidOperationException("EMAIL_TAKEN");

        var user = new User
        {
            Email = dto.Email,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(dto.Password),
            Role = dto.Role,
            Gender = dto.Gender,
        };

        await using var tx = await db.Database.BeginTransactionAsync();
        db.Users.Add(user);
        db.Wallets.Add(new Wallet { UserId = user.Id });
        await db.SaveChangesAsync();
        await tx.CommitAsync();

        var tokens = SignTokens(user.Id, user.Role.ToString());
        await SaveRefreshToken(user.Id, tokens.RefreshToken);
        return tokens with { UserId = user.Id };
    }

    public async Task<TokenResponse> Login(LoginDto dto)
    {
        var user = await db.Users.FirstOrDefaultAsync(u => u.Email == dto.Email)
            ?? throw new UnauthorizedAccessException("INVALID_CREDENTIALS");

        if (!BCrypt.Net.BCrypt.Verify(dto.Password, user.PasswordHash))
            throw new UnauthorizedAccessException("INVALID_CREDENTIALS");

        var tokens = SignTokens(user.Id, user.Role.ToString());
        await SaveRefreshToken(user.Id, tokens.RefreshToken);
        return tokens with { UserId = user.Id, Role = user.Role.ToString() };
    }

    public async Task<TokenResponse> Refresh(string userId, string refreshToken)
    {
        var stored = await _redis.StringGetAsync($"refresh:{userId}");
        if (!stored.HasValue) throw new UnauthorizedAccessException("SESSION_EXPIRED");
        if (!BCrypt.Net.BCrypt.Verify(refreshToken, stored!)) throw new UnauthorizedAccessException("INVALID_REFRESH_TOKEN");

        var user = await db.Users.FindAsync(userId) ?? throw new UnauthorizedAccessException();
        var tokens = SignTokens(user.Id, user.Role.ToString());
        await SaveRefreshToken(user.Id, tokens.RefreshToken);
        return tokens;
    }

    public async Task Logout(string userId) =>
        await _redis.KeyDeleteAsync($"refresh:{userId}");

    private TokenResponse SignTokens(string userId, string role)
    {
        var access = CreateToken(userId, role, config["JWT_SECRET"]!, TimeSpan.FromMinutes(15));
        var refresh = CreateToken(userId, role, config["JWT_REFRESH_SECRET"]!, TimeSpan.FromDays(7));
        return new TokenResponse(access, refresh, userId, role);
    }

    private static string CreateToken(string userId, string role, string secret, TimeSpan expires)
    {
        var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(secret));
        var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);
        var token = new JwtSecurityToken(
            claims: [new Claim("sub", userId), new Claim("role", role)],
            expires: DateTime.UtcNow.Add(expires),
            signingCredentials: creds);
        return new JwtSecurityTokenHandler().WriteToken(token);
    }

    private async Task SaveRefreshToken(string userId, string token)
    {
        var hash = BCrypt.Net.BCrypt.HashPassword(token);
        await _redis.StringSetAsync($"refresh:{userId}", hash, TimeSpan.FromDays(7));
    }
}
