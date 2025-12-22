using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Models
{
    public class UserbillController : Controller
    {
        public IActionResult user_bill()
        {
            return View();
        }
    }
}
