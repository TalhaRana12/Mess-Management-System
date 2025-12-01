using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class MembersController : Controller
    {
        [HttpGet]
        public async Task<IActionResult> members()
        {
            List<TblUser> temp;

            using (MessDbContext mydb = new MessDbContext())
            {
                // Use await and ToListAsync() to unblock the thread while fetching data
                temp = await mydb.TblUsers.ToListAsync();
            }

            // These calculations happen in memory, so they remain synchronous
            ViewBag.TotalMembers = temp.Count;
            ViewBag.ActiveMembers = temp.Count(u => u.IsActive == true);
            ViewBag.InactiveMembers = temp.Count(u => u.IsActive == false);
            ViewBag.NewThisMonth = 5;

            return View(temp);
        }
    }
}
