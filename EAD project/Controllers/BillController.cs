using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class ViewModel
    {
        public List<TblBill> bills;
        public List<TblUser> user;
        public List<TblAttendance> attendances;
    }
    public class BillController : Controller
    {
       

        public async Task<IActionResult> bill()
        {
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // Use the new 'ViewModel' class structure
                var viewModel = new ViewModel
                {
                    // 1. Fetch Users
                    user = await mydb.TblUsers.ToListAsync(),

                    // 2. Fetch Bills (Since 'menu' is replaced by 'bills' in your model)
                    bills = await mydb.TblBills.ToListAsync(),

                    // 3. Fetch Attendances with Projection (To prevent Object Cycle Error)
                    attendances = await mydb.TblAttendances
                        .Select(a => new TblAttendance
                        {
                            AttendanceId = a.AttendanceId,
                            UserId = a.UserId,
                            AttendanceDate = a.AttendanceDate,
                            MealType = a.MealType, // Ensure this property exists in your Model
                            TeaWater = a.TeaWater,
                            Food = a.Food,
                            FoodPrice = a.FoodPrice
                            // Note: We do NOT include 'User' navigation property here
                        })
                        .ToListAsync()
                };

                return View(viewModel);
            }
        }
    }
}
