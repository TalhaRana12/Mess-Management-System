using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EAD_project.Controllers
{
    public class LoginController : Controller
    {
        private readonly IConfiguration _config;
        private readonly MessManagmentContext _db;

        public LoginController(IConfiguration config, MessManagmentContext db)
        {
            _config = config;
            _db = db;
        }

        [HttpGet]
        public IActionResult login()
        {
            return View();
        }

        private string GenerateJwtToken(string username)
        {
            var jwt = _config.GetSection("Jwt");
            var key = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwt["Key"]));

            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var claims = new[]
            {
                new Claim(ClaimTypes.Name, username)
            };

            var token = new JwtSecurityToken(
                issuer: jwt["Issuer"],
                audience: jwt["Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddMinutes(Convert.ToDouble(jwt["ExpireMinutes"])),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        [HttpPost]
        public IActionResult check(string name, string password)
        {
            // Use DI DbContext (configured in Program.cs) instead of new MessManagmentContext().
            var user = _db.TblUsers.FirstOrDefault(row => row.Username == name && row.PasswordHash == password);

            if (user != null)
            {
                if (user.Role == "Admin")
                {
                    var token = GenerateJwtToken(name);

                    Response.Cookies.Append("jwtToken", token, new CookieOptions
                    {
                        HttpOnly = true,
                        // Secure = true, // enable when site is HTTPS only
                        Expires = DateTime.UtcNow.AddMinutes(180)
                    });

                    return RedirectToAction("Admindashboard", "Admin");
                }

                if (user.Role == "Member")
                {
                    var token = GenerateJwtToken(name);

                    Response.Cookies.Append("jwtToken", token, new CookieOptions
                    {
                        HttpOnly = true,
                        // Secure = true, // enable when site is HTTPS only
                        Expires = DateTime.UtcNow.AddMinutes(180)
                    });

                    HttpContext.Session.SetInt32("uet", user.UserId);
                    return RedirectToAction("user_dashboard", "Userdashboard");
                }

                ViewBag.Error = "Unauthorized Role";
                return View("login");
            }

            ViewBag.Error = "Invalid Username or Password";
            return View("login");
        }
    }
}
