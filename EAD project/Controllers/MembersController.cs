using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class MembersController : Controller
    {
        [HttpGet]
        public async Task<IActionResult> members()
        {
            List<TblUser> temp;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // Use await and ToListAsync() to unblock the thread while fetching data
                temp = await mydb.TblUsers.ToListAsync();
            }



            return View(temp);
        }

        [HttpPost]
        public async Task<IActionResult> update_api([FromBody] TblUser updatedUser)
        {
            if (updatedUser == null || updatedUser.UserId == 0)
                return BadRequest("Invalid data received.");

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // Find existing user by primary key
                var existingUser = await mydb.TblUsers
                    .FirstOrDefaultAsync(u => u.UserId == updatedUser.UserId);

                if (existingUser == null)
                    return NotFound("User not found.");

                // Check duplicate username (except for this user)
                bool usernameExists = await mydb.TblUsers
                    .AnyAsync(u => u.Username == updatedUser.Username && u.UserId != updatedUser.UserId);

                if (usernameExists)
                    return Conflict("Username already exists.");

                // Update fields
                existingUser.Name = updatedUser.Name;
                existingUser.PasswordHash = updatedUser.PasswordHash;
                existingUser.Cnic = updatedUser.Cnic;
                existingUser.Department = updatedUser.Department;
                existingUser.Username = updatedUser.Username;
                existingUser.IsActive = updatedUser.IsActive;

                await mydb.SaveChangesAsync();
            }

            return Ok("Member updated successfully.");
        }


        [HttpPost]
        public async Task<IActionResult> delete_api([FromBody] int userId)
        {
            if (userId <= 0)
                return BadRequest("Invalid user ID");

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var user = await mydb.TblUsers.FirstOrDefaultAsync(x => x.UserId == userId);

                if (user == null)
                    return NotFound("User not found");

                mydb.TblUsers.Remove(user);
                await mydb.SaveChangesAsync();
            }

            return Ok("User deleted successfully");
        }


    }
}
