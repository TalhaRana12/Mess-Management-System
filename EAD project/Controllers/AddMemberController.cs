using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;


namespace EAD_project.Controllers
{
    public class AddMemberController : Controller
    {
        [HttpGet]
        public IActionResult addmember()
        {
            return View();
        }
        [HttpPost]
        public async Task<IActionResult> adduser_api([FromBody] TblUser data)
        {
            if (data == null)
                return BadRequest("Invalid data");

            using (MessDbContext mydb = new MessDbContext())
            {
                // Check duplicate username
                if (await mydb.TblUsers.AnyAsync(x => x.Username == data.Username))
                    return Conflict("Username already exists");

                TblUser temp = new TblUser()
                {
                    Name = data.Name,
                    Cnic = data.Cnic,
                    Department = data.Department,
                    Username = data.Username,
                    PasswordHash = data.PasswordHash,
                    Role = data.Role,
                    IsActive = true
                };

                await mydb.TblUsers.AddAsync(temp);
                await mydb.SaveChangesAsync();
            }

            return Ok("User added");
        }

    }
}
