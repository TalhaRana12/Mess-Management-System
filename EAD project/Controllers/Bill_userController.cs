using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EAD_project.Controllers
{
    // 1. Ensure this class matches what the View expects
    public class ViewModelBill
    {
        // Changed fields to Properties with { get; set; }
        public List<TblBill> Bills { get; set; }
        public List<TblUser> User { get; set; }
        public List<TblAttendance> Attendances { get; set; }
    }

    public class Bill_userController : Controller
    {
        public async Task<IActionResult> user_bill()
        {
            // 1. Get User ID from Session
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                return RedirectToAction("login", "Login");
            }
            int currentUserId = sessionUserId.Value;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var viewModel = new ViewModelBill
                {
                    // 2. Fetch only the logged-in User
                    User = await mydb.TblUsers
                                     .Where(u => u.UserId == currentUserId)
                                     .ToListAsync(),

                    // 3. Fetch only bills belonging to this user
                    Bills = await mydb.TblBills
                                     .Where(b => b.UserId == currentUserId)
                                     .ToListAsync(),

                    // 4. Fetch only attendance records for this user
                    Attendances = await mydb.TblAttendances
                        .Where(a => a.UserId == currentUserId) // Filter applied here
                        .Select(a => new TblAttendance
                        {
                            AttendanceId = a.AttendanceId,
                            UserId = a.UserId,
                            AttendanceDate = a.AttendanceDate,
                            MealType = a.MealType,
                            TeaWater = a.TeaWater,
                            Food = a.Food,
                            FoodPrice = a.FoodPrice
                        })
                        .ToListAsync()
                };

                return View(viewModel);
            }
        }
    }
}