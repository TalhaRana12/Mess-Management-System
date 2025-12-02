using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class AddMemberController : Controller
    {
        [HttpGet]
        public IActionResult addmember()
        {
            return View();
        }
    }
}
