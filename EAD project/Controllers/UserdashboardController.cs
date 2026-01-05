using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class UserViewModel
    {
        public TblUser user;
        public List<TblAttendance> attendance;
        public List<TblMenu> menu;
        public List<TblBill> bill;
    }

    public class UserdashboardController : Controller
    {
        private readonly MessManagmentContext _db;

        public UserdashboardController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> user_dashboard()
        {
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
                return RedirectToAction("login", "Login");

            int currentUserId = sessionUserId.Value;

            var userProfile = await _db.TblUsers.FirstOrDefaultAsync(u => u.UserId == currentUserId);
            if (userProfile == null)
                return RedirectToAction("login", "Login");

            var viewModel = new UserViewModel
            {
                user = userProfile,
                attendance = await _db.TblAttendances
                    .Where(a => a.UserId == currentUserId)
                    .OrderByDescending(a => a.AttendanceDate)
                    .ToListAsync(),
                bill = await _db.TblBills
                    .Where(b => b.UserId == currentUserId)
                    .OrderByDescending(b => b.Year).ThenByDescending(b => b.Month)
                    .ToListAsync(),
                menu = await _db.TblMenus.ToListAsync()
            };

            return View(viewModel);
        }
    }
}
