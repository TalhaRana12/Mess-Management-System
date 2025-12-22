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
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                // 2. Instantiate 'ViewModelBill', NOT 'ViewModel'
                var viewModel = new ViewModelBill
                {
                    // 3. Use PascalCase property names (User, Bills, Attendances)
                    User = await mydb.TblUsers.ToListAsync(),

                    Bills = await mydb.TblBills.ToListAsync(),

                    Attendances = await mydb.TblAttendances
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

                // Now the type matches what the View expects
                return View(viewModel);
            }
        }
    }
}