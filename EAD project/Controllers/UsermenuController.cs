using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class UsermenuController : Controller
    {
        private readonly MessManagmentContext _db;

        public UsermenuController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> user_menu()
        {
            var menu = await _db.TblMenus.ToListAsync();
            return View(menu);
        }
    }
}
