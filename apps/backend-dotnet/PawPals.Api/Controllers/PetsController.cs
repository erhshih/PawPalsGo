using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using PawPals.Api.Data;
using PawPals.Api.Models;

namespace PawPals.Api.Controllers;

[ApiController]
[Route("pets")]
[Authorize]
public class PetsController(AppDbContext db) : ControllerBase
{
    private string UserId => User.FindFirst("sub")!.Value;

    [HttpGet]
    public async Task<IActionResult> GetMyPets() =>
        Ok(await db.Pets.Where(p => p.OwnerId == UserId).Include(p => p.Photos).ToListAsync());

    [HttpPost]
    public async Task<IActionResult> CreatePet(CreatePetRequest req)
    {
        var pet = new Pet { OwnerId = UserId, Name = req.Name, Breed = req.Breed, Bio = req.Bio, Tags = req.Tags ?? [], BirthDate = req.BirthDate };
        db.Pets.Add(pet);
        await db.SaveChangesAsync();
        return Ok(pet);
    }

    [HttpPatch("{petId}")]
    public async Task<IActionResult> UpdatePet(string petId, CreatePetRequest req)
    {
        var pet = await db.Pets.FirstOrDefaultAsync(p => p.Id == petId && p.OwnerId == UserId);
        if (pet == null) return NotFound();
        pet.Name = req.Name; pet.Breed = req.Breed; pet.Bio = req.Bio;
        if (req.Tags != null) pet.Tags = req.Tags;
        if (req.BirthDate != null) pet.BirthDate = req.BirthDate;
        await db.SaveChangesAsync();
        return Ok(pet);
    }
}

public record CreatePetRequest(string Name, string Breed, string Bio, List<string>? Tags, DateTime? BirthDate);
