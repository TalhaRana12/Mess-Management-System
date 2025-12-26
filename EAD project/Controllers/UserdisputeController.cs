using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;

namespace EAD_project.Controllers
{
    public class UserDisputeViewModel
    {
        public List<TblRequest> Requests { get; set; }
        public string UserName { get; set; }
        public int UserId { get; set; }
    }

    public class UserdisputeController : Controller
    {
        public async Task<IActionResult> user_dispute()
        {
            // 1. Session Check
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                return RedirectToAction("login", "Login");
            }
            int currentUserId = sessionUserId.Value;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // 2. Fetch User Details (for display)
                var user = await mydb.TblUsers.FindAsync(currentUserId);

                // 3. Fetch ONLY this User's Requests (Pending, Approved, Rejected)
                var userRequests = await mydb.TblRequests
                                             .Include(r => r.Attendance) // Join with Attendance to get Meal Data
                                             .Where(r => r.UserId == currentUserId)
                                             .OrderByDescending(r => r.RequestDate)
                                             .ToListAsync();

                var viewModel = new UserDisputeViewModel
                {
                    Requests = userRequests,
                    UserName = user?.Name ?? "User",
                    UserId = currentUserId
                };

                return View(viewModel);
            }
        }
    }
}