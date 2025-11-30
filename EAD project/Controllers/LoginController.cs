using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class LoginController : Controller
    {
        [HttpGet]
        public IActionResult login()
        {
            return View();
        }
        [HttpPost]
        public IActionResult check(string name, string password)
        {
            using (MessDbContext mydb = new MessDbContext())
            {
                var user = mydb.TblUsers.Where(row => row.Username == name && row.PasswordHash == password && row.Role =="Admin");

                if (user != null)
                {
                    return RedirectToAction("Admindashboard","Admin");
                }
                else
                {
                    return RedirectToAction("login");
                }

            }

        }
    }
}
