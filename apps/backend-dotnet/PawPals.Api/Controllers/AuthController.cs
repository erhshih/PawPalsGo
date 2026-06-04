using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using PawPals.Api.DTOs;
using PawPals.Api.Services;

namespace PawPals.Api.Controllers;

[ApiController]
[Route("auth")]
public class AuthController(AuthService auth) : ControllerBase
{
    [HttpPost("register")]
    public async Task<IActionResult> Register(RegisterDto dto)
    {
        try { return Ok(await auth.Register(dto)); }
        catch (InvalidOperationException ex) when (ex.Message == "EMAIL_TAKEN")
            { return Conflict(new { message = "EMAIL_TAKEN" }); }
    }

    [HttpPost("login")]
    public async Task<IActionResult> Login(LoginDto dto)
    {
        try { return Ok(await auth.Login(dto)); }
        catch (UnauthorizedAccessException) { return Unauthorized(new { message = "INVALID_CREDENTIALS" }); }
    }

    [HttpPost("refresh")]
    [Authorize]
    public async Task<IActionResult> Refresh([FromBody] string refreshToken)
    {
        var userId = User.FindFirst("sub")?.Value!;
        try { return Ok(await auth.Refresh(userId, refreshToken)); }
        catch (UnauthorizedAccessException ex) { return Unauthorized(new { message = ex.Message }); }
    }

    [HttpPost("logout")]
    [Authorize]
    public async Task<IActionResult> Logout()
    {
        await auth.Logout(User.FindFirst("sub")?.Value!);
        return Ok();
    }
}
