using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class AddMemberController : Controller
    {
        private readonly MessManagmentContext _db;

        public AddMemberController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpGet]
        public IActionResult addmember()
        {
            return View();
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> adduser_api([FromBody] TblUser data)
        {
            if (data == null)
                return BadRequest("Invalid data");

            if (await _db.TblUsers.AnyAsync(x => x.Username == data.Username))
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

            await _db.TblUsers.AddAsync(temp);
            await _db.SaveChangesAsync();

            return Ok("User added");
        }
    }
}
