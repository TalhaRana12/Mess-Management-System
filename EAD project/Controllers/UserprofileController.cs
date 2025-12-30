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

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // 2. Fetch User Data
                var user = await mydb.TblUsers.FindAsync(sessionUserId);

                if (user == null) return RedirectToAction("login", "Login");

                return View(user); // Pass the TblUser model to the view
            }
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
                using (MessManagmentContext mydb = new MessManagmentContext())
                {
                    var user = await mydb.TblUsers.FindAsync(sessionUserId);

                    if (user == null) return NotFound("User not found.");

                    // 1. Verify Current Password
                    // Note: In a real app, verify the Hash. Here we compare strings based on your schema.
                    if (user.PasswordHash != request.CurrentPassword)
                    {
                        return BadRequest("Incorrect current password.");
                    }

                    // 2. Update Password
                    user.PasswordHash = request.NewPassword;

                    mydb.TblUsers.Update(user);
                    await mydb.SaveChangesAsync();

                    return Ok(new { success = true, message = "Password updated successfully." });
                }
            }
            catch
            {
                return StatusCode(500, "Internal server error.");
            }
        }
    }
}