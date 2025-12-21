using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class UsermenuController : Controller
    {
        public async Task<IActionResult> user_menu()
        {
            List<TblMenu> menu;
            using (MessManagmentContext mydb=new MessManagmentContext())
            {
                menu = await mydb.TblMenus.ToListAsync();
            }
            return View(menu);
        }
    }
}
