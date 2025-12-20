using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class UserdashboardController : Controller
    {
        public IActionResult user_dashboard()
        {
            return View();
        }
    }
}
