using EAD_project.Models;
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
        public async Task<IActionResult> user_dashboard(int id)
        {
            if (id == 0) return RedirectToAction("login", "Login");

            using (var db = new MessManagmentContext())
            {
                // 1. Fetch User Profile
                var userProfile = await db.TblUsers.FirstOrDefaultAsync(u => u.UserId == id);

                if (userProfile == null) return RedirectToAction("login", "Login");

                // 2. Prepare the ViewModel
                var viewModel = new UserViewModel
                {
                    user = userProfile,

                    // Fetch ONLY this user's attendance
                    attendance = await db.TblAttendances
                                    .Where(a => a.UserId == id)
                                    .OrderByDescending(a => a.AttendanceDate)
                                    .ToListAsync(),

                    // Fetch ONLY this user's bills (Paid and Unpaid)
                    bill = await db.TblBills
                                .Where(b => b.UserId == id)
                                .OrderByDescending(b => b.Year).ThenByDescending(b => b.Month)
                                .ToListAsync(),

                    // Fetch the complete menu
                    menu = await db.TblMenus.ToListAsync()
                };

                // 3. Pass data to View
                return View(viewModel);
            }
        }
    }
}
