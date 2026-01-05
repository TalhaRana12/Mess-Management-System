using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Authorization;

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
        private readonly MessManagmentContext _db;

        public UserdisputeController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> user_dispute()
        {
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
                return RedirectToAction("login", "Login");

            int currentUserId = sessionUserId.Value;

            var user = await _db.TblUsers.FindAsync(currentUserId);

            var userRequests = await _db.TblRequests
                .Include(r => r.Attendance)
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