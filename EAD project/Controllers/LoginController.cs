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
    }
}
