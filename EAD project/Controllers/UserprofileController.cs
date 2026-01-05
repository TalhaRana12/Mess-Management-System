using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Threading.Tasks;

namespace EAD_project.Controllers
{
    // DTO for Password Change
    public class ChangePasswordDto
    {
        public string CurrentPassword { get; set; }
        public string NewPassword { get; set; }
    }

    public class UserprofileController : Controller
    {
        private readonly MessManagmentContext _db;

        public UserprofileController(MessManagmentContext db)
        {
            _db = db;
        }

        // GET: Show Profile Page
        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> user_profile()
        {
            // 1. Check Session
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                return RedirectToAction("login", "Login");
            }

            // 2. Fetch User Data
            var user = await _db.TblUsers.FindAsync(sessionUserId);

            if (user == null) return RedirectToAction("login", "Login");

            return View(user); // Pass the TblUser model to the view
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        // API: Change Password
        [HttpPost]
        public async Task<IActionResult> UpdatePassword([FromBody] ChangePasswordDto request)
        {
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null) return Unauthorized("Session expired.");

            try
            {
                var user = await _db.TblUsers.FindAsync(sessionUserId);

                if (user == null) return NotFound("User not found.");

                // 1. Verify Current Password
                // Note: In a real app, verify the Hash. Here we compare strings based on your schema.
                if (user.PasswordHash != request.CurrentPassword)
                {
                    return BadRequest("Incorrect current password.");
                }

                // 2. Update Password
                user.PasswordHash = request.NewPassword;

                await _db.SaveChangesAsync();

                return Ok(new { success = true, message = "Password updated successfully." });
            }
            catch
            {
                return StatusCode(500, "Internal server error.");
            }
        }
    }
}