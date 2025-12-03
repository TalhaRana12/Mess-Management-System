using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class MenuController : Controller
    {
        public IActionResult menu()
        {
            return View();
        }
    }
}
