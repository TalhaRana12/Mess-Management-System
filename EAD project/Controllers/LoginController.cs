using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.DataProtection;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore.Query.Internal;
using Microsoft.Identity.Client;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;
using Microsoft.AspNetCore.Authorization;
namespace EAD_project.Controllers
{
    public class LoginController : Controller
    {
        private readonly IConfiguration _config;

        public LoginController(IConfiguration config)
        {
            _config = config;
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
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // 1. Fetch user by Credentials ONLY (Remove the Role check here)
                var user = mydb.TblUsers.FirstOrDefault(row => row.Username == name && row.PasswordHash == password);

                // 2. Check if user exists
                if (user != null)
                {
                    if (user.Role == "Admin")
                    {
                        var token = GenerateJwtToken(name);

                        // Save JWT Token in HttpOnly Cookie
                        Response.Cookies.Append("jwtToken", token, new CookieOptions
                        {
                            HttpOnly = true,
                            //Secure = true, // only on https
                            Expires = DateTime.UtcNow.AddMinutes(180)
                        });
                        return RedirectToAction("Admindashboard", "Admin");
                    }
                    else if (user.Role == "Member") // Make sure this string matches exactly what is in your Database
                    {
                        var token = GenerateJwtToken(name);

                        // Save JWT Token in HttpOnly Cookie
                        Response.Cookies.Append("jwtToken", token, new CookieOptions
                        {
                            HttpOnly = true,
                            //Secure = true, // only on https
                            Expires = DateTime.UtcNow.AddMinutes(180)
                        });
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
