using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;
using Microsoft.AspNetCore.Authorization;

namespace EAD_project.Controllers
{
    public class DashboardViewModel
    {
        public int TotalMembers { get; set; }
        public int PresentToday { get; set; }
        public int PendingDisputes { get; set; }
        public decimal PendingBillsAmount { get; set; }
        public List<TblMenu> TodaysMenu { get; set; }
        public List<TblRequest> RecentDisputes { get; set; }
    }

    public class AdminController : Controller
    {
        private readonly MessManagmentContext _db;

        public AdminController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpGet]
        public async Task<IActionResult> Admindashboard()
        {
            var today = DateOnly.FromDateTime(DateTime.Now);
            string dayName = DateTime.Now.DayOfWeek.ToString();

            int totalMembers = await _db.TblUsers.CountAsync(u => u.IsActive);
            int presentToday = await _db.TblAttendances.CountAsync(a => a.AttendanceDate == today && (a.Food || a.TeaWater));
            int pendingDisputes = await _db.TblRequests.CountAsync(r => r.Status == "Pending");
            decimal pendingBills = await _db.TblBills.Where(b => !b.IsPaid).SumAsync(b => b.GrandTotal);

            var todaysMenu = await _db.TblMenus.Where(m => m.DayOfWeek == dayName).ToListAsync();

            var recentDisputes = await _db.TblRequests
                .Include(r => r.User)
                .OrderByDescending(r => r.RequestDate)
                .Take(5)
                .ToListAsync();

            var viewModel = new DashboardViewModel
            {
                TotalMembers = totalMembers,
                PresentToday = presentToday,
                PendingDisputes = pendingDisputes,
                PendingBillsAmount = pendingBills,
                TodaysMenu = todaysMenu,
                RecentDisputes = recentDisputes
            };

            return View(viewModel);
        }
    }
}