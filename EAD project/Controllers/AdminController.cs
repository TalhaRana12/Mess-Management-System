using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Linq;
using System.Threading.Tasks;
using System.Collections.Generic;

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
        [HttpGet]
        public async Task<IActionResult> Admindashboard()
        {
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var today = DateOnly.FromDateTime(DateTime.Now);
                string dayName = DateTime.Now.DayOfWeek.ToString();

                // 1. Stats
                int totalMembers = await mydb.TblUsers.CountAsync(u => u.IsActive);
                int presentToday = await mydb.TblAttendances.CountAsync(a => a.AttendanceDate == today && (a.Food || a.TeaWater));
                int pendingDisputes = await mydb.TblRequests.CountAsync(r => r.Status == "Pending");
                decimal pendingBills = await mydb.TblBills.Where(b => !b.IsPaid).SumAsync(b => b.GrandTotal);

                // 2. Menu
                var todaysMenu = await mydb.TblMenus.Where(m => m.DayOfWeek == dayName).ToListAsync();

                // 3. Recent Disputes (Include User is CRITICAL)
                var recentDisputes = await mydb.TblRequests
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
}