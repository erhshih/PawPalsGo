using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.Models;

namespace PawPals.Api.Services;

public class DiscoverService(AppDbContext db)
{
    private static double HaversineM(double lat1, double lon1, double lat2, double lon2)
    {
        const double R = 6371000;
        var dLat = (lat2 - lat1) * Math.PI / 180;
        var dLon = (lon2 - lon1) * Math.PI / 180;
        var a = Math.Sin(dLat / 2) * Math.Sin(dLat / 2) +
                Math.Cos(lat1 * Math.PI / 180) * Math.Cos(lat2 * Math.PI / 180) *
                Math.Sin(dLon / 2) * Math.Sin(dLon / 2);
        return R * 2 * Math.Atan2(Math.Sqrt(a), Math.Sqrt(1 - a));
    }

    public async Task UpdateLocation(string userId, double lat, double lng)
    {
        await db.Users.Where(u => u.Id == userId)
            .ExecuteUpdateAsync(s => s
                .SetProperty(u => u.Latitude, lat)
                .SetProperty(u => u.Longitude, lng));
    }

    public async Task<List<object>> FindNearby(
        string userId, double radius = 50, int page = 1, int limit = 20,
        string[]? genderFilter = null, string? roleFilter = null)
    {
        var me = await db.Users.Where(u => u.Id == userId)
            .Select(u => new { u.Latitude, u.Longitude })
            .FirstOrDefaultAsync();

        if (me?.Latitude == null || me.Longitude == null) return [];

        var passExpiry = TimeSpan.FromMinutes(
            int.TryParse(Environment.GetEnvironmentVariable("PASS_EXPIRY_MINUTES"), out var m) ? m : 1);
        var expiryCutoff = DateTime.UtcNow - passExpiry;

        var swipedIds = await db.Swipes
            .Where(s => s.SwiperId == userId &&
                (s.Direction != SwipeDirection.PASS || s.CreatedAt > expiryCutoff))
            .Select(s => s.TargetId)
            .ToListAsync();

        var query = db.Users
            .Where(u => u.Id != userId && !swipedIds.Contains(u.Id)
                && u.Latitude != null && u.Longitude != null);

        if (genderFilter?.Length > 0)
        {
            var genders = genderFilter.Select(g => Enum.Parse<Gender>(g)).ToList();
            query = query.Where(u => u.Gender != null && genders.Contains(u.Gender.Value));
        }
        if (roleFilter != null && Enum.TryParse<UserRole>(roleFilter, out var role))
            query = query.Where(u => u.Role == role);

        var candidates = await query.Select(u => new
        {
            u.Id, u.Email, u.Role, u.Gender, u.DisplayName, u.Bio,
            u.Interests, u.Education, u.Zodiac, u.JobTitle, u.Company,
            u.School, u.City, u.Height, u.AvatarUrl, u.Latitude, u.Longitude,
            u.Pets
        }).ToListAsync();

        var radiusM = radius * 1000;
        return candidates
            .Select(u => new { user = u, distanceM = HaversineM(me.Latitude!.Value, me.Longitude!.Value, u.Latitude!.Value, u.Longitude!.Value) })
            .Where(x => x.distanceM <= radiusM)
            .OrderBy(x => x.distanceM)
            .Skip((page - 1) * limit).Take(limit)
            .Select(x => (object)new
            {
                user = new { x.user.Id, x.user.Email, x.user.Role, x.user.Gender, x.user.DisplayName, x.user.Bio, x.user.Interests, x.user.Education, x.user.Zodiac, x.user.JobTitle, x.user.Company, x.user.School, x.user.City, x.user.Height, x.user.AvatarUrl, x.user.Pets },
                x.distanceM
            }).ToList();
    }
}
