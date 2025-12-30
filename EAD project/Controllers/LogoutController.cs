using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EAD_project.Controllers
{
    public class LogoutController : Controller
    {
        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public IActionResult logout()
        {
            HttpContext.Session.Clear();
            Response.Cookies.Delete("jwtToken");
            return RedirectToAction("login", "Login");
        }
    }
}
