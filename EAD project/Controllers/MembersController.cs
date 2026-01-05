using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Text.Json.Serialization; // Required for [JsonPropertyName]

namespace EAD_project.Controllers
{
    public class MembersController : Controller
    {
        private readonly MessManagmentContext _db;

        public MembersController(MessManagmentContext db)
        {
            _db = db;
        }

        // --- HELPER CLASS FOR DELETE REQUEST ---
        // This ensures the JSON { "id": 5 } maps correctly to this C# property
        public class MemberIdRequest
        {
            [JsonPropertyName("id")]
            public int Id { get; set; }
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpGet]
        public async Task<IActionResult> members()
        {
            var temp = await _db.TblUsers.ToListAsync();
            return View(temp);
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> update_api([FromBody] TblUser updatedUser)
        {
            if (updatedUser == null || updatedUser.UserId == 0)
                return BadRequest("Invalid data received.");

            var existingUser = await _db.TblUsers.FirstOrDefaultAsync(u => u.UserId == updatedUser.UserId);
            if (existingUser == null)
                return NotFound("User not found.");

            // Check for duplicate username (excluding self)
            bool usernameExists = await _db.TblUsers.AnyAsync(u => u.Username == updatedUser.Username && u.UserId != updatedUser.UserId);
            if (usernameExists)
                return Conflict("Username already exists.");

            // Update fields
            existingUser.Name = updatedUser.Name;
            existingUser.Cnic = updatedUser.Cnic;
            existingUser.Department = updatedUser.Department;
            existingUser.Username = updatedUser.Username;
            existingUser.IsActive = updatedUser.IsActive;

            // Only update password if a new one is provided
            if (!string.IsNullOrWhiteSpace(updatedUser.PasswordHash))
            {
                existingUser.PasswordHash = updatedUser.PasswordHash;
            }

            await _db.SaveChangesAsync();
            return Ok("Member updated successfully.");
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> delete_api([FromBody] MemberIdRequest request)
        {
            try
            {
                // Validation: Check if request is null or ID is 0
                if (request == null || request.Id <= 0)
                    return BadRequest("Invalid user ID received.");

                var user = await _db.TblUsers.FirstOrDefaultAsync(x => x.UserId == request.Id);
                if (user == null)
                    return NotFound("User not found.");

                // --- SOFT DELETE IMPLEMENTATION ---
                // We do not remove the row from the database. 
                // We mark it as Inactive to preserve bill/attendance history.
                user.IsActive = false;

                await _db.SaveChangesAsync();
                return Ok("User deactivated successfully");
            }
            catch (Exception ex)
            {
                // Return actual error for debugging
                return BadRequest($"Server Error: {ex.Message}");
            }
        }
    }
}