using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class AttendanceController : Controller
    {
        public class MemberMenuViewModel
        {
            public List<TblMenu> menu;
            public List<TblUser> user;
        }
        public async Task<IActionResult> attendance()
        {
            using (MessDbContext mydb=new MessDbContext())
            {
                var viewModel = new MemberMenuViewModel
                {
                    menu = await mydb.TblMenus.ToListAsync(),
                    user = await mydb.TblUsers.ToListAsync()
                };
                return View(viewModel);
            }
        }
    }
}
