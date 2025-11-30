using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class AdminController : Controller
    {
        [HttpGet]
        public IActionResult Admindashboard()
        {
            return View();
        }
    }
}
