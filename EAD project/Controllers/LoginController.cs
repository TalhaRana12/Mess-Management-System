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
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // 1. Fetch user by Credentials ONLY (Remove the Role check here)
                var user = mydb.TblUsers.FirstOrDefault(row => row.Username == name && row.PasswordHash == password);

                // 2. Check if user exists
                if (user != null)
                {
                    if (user.Role == "Admin")
                    {
                        return RedirectToAction("Admindashboard", "Admin");
                    }
                    else if (user.Role == "Member") // Make sure this string matches exactly what is in your Database
                    {
                        HttpContext.Session.SetInt32("uet", user.UserId);
                        return RedirectToAction("user_dashboard", "Userdashboard");
                    }
                    else
                    {
                        // FIX: Handle cases where Role is neither "Admin" nor "Member"
                        ViewBag.Error = "Unauthorized Role";
                        return View("login");
                    }
                }
                else
                {
                    // Credentials didn't match any user
                    ViewBag.Error = "Invalid Username or Password";
                    return View("login");
                }
            }
        }
    }
}
