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
