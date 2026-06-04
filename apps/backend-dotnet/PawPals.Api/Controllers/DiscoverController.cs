using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.DTOs;
using PawPals.Api.Services;

namespace PawPals.Api.Controllers;

[ApiController]
[Authorize]
public class DiscoverController(DiscoverService discover, AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirst("sub")!.Value;

    [HttpGet("discover")]
    public async Task<IActionResult> FindNearby(
        [FromQuery] double radius = 50,
        [FromQuery] int page = 1,
        [FromQuery] int limit = 20,
        [FromQuery] string? gender = null,
        [FromQuery] string? role = null)
    {
        var genders = gender?.Split(',').Where(g => !string.IsNullOrEmpty(g)).ToArray();
        return Ok(await discover.FindNearby(UserId, radius, page, limit, genders, role));
    }

    [HttpGet("users/me")]
    public async Task<IActionResult> GetMe() =>
        Ok(await db.Users.Where(u => u.Id == UserId).Select(u => new
        {
            u.Id, u.Email, u.Role, u.Gender, u.DisplayName, u.Bio,
            u.Interests, u.Education, u.Zodiac, u.JobTitle, u.Company,
            u.School, u.City, u.Height, u.AvatarUrl, u.CreatedAt
        }).FirstOrDefaultAsync());

    [HttpPatch("users/me")]
    public async Task<IActionResult> UpdateMe(UpdateProfileDto dto)
    {
        var user = await db.Users.FindAsync(UserId);
        if (user == null) return NotFound();
        if (dto.DisplayName != null) user.DisplayName = dto.DisplayName;
        if (dto.Bio != null) user.Bio = dto.Bio;
        if (dto.Gender != null) user.Gender = dto.Gender;
        if (dto.Interests != null) user.Interests = dto.Interests;
        if (dto.Education != null) user.Education = dto.Education;
        if (dto.Zodiac != null) user.Zodiac = dto.Zodiac;
        if (dto.JobTitle != null) user.JobTitle = dto.JobTitle;
        if (dto.Company != null) user.Company = dto.Company;
        if (dto.School != null) user.School = dto.School;
        if (dto.City != null) user.City = dto.City;
        if (dto.Height != null) user.Height = dto.Height;
        await db.SaveChangesAsync();
        return Ok(user);
    }

    [HttpPatch("users/me/location")]
    public async Task<IActionResult> UpdateLocation(UpdateLocationDto dto)
    {
        await discover.UpdateLocation(UserId, dto.Lat, dto.Lng);
        return Ok(new { ok = true });
    }
}
