using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EAD_project.Controllers
{
    public class UserattendanceController : Controller
    {
        [HttpGet]
        //public async Task<IActionResult> user_attendance()
        //{
        //    string userIdString = User.FindFirstValue(ClaimTypes.NameIdentifier);

        //    // 2. Convert the string ID to an Integer
        //    if (!int.TryParse(userIdString, out int currentUserId))
        //    {
        //        // Handle error if UserID is not found or not a valid number
        //        return RedirectToAction("Login", "Account");
        //    }

        //    List<TblAttendance>? attendances;

        //    using (MessManagmentContext mydb = new MessManagmentContext())
        //    {
        //        // 3. Filter by the converted integer ID
        //        attendances = await mydb.TblAttendances
        //                                .Where(x => x.UserId == currentUserId)
        //                                .ToListAsync();
        //    }

        //    return View(attendances);
        //}
        public async Task<IActionResult> user_attendance()
        {
          int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                 return RedirectToAction("login", "Login");
            }
          int currentUserId = sessionUserId.Value;

            List<TblAttendance>? attendances;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                attendances = await mydb.TblAttendances
                                        .Where(x => x.UserId == currentUserId)
                                        .ToListAsync();
            }

            return View(attendances);
        }
    }
}
