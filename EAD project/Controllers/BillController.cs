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
        [HttpPost]
        public async Task<IActionResult> SaveBillsApi([FromBody] List<TblBill> billList)
        {
            if (billList == null || billList.Count == 0)
                return BadRequest("No bill data received.");

            try
            {
                using (var mydb = new MessManagmentContext())
                {
                    // 1. Context: We assume bills are generated for a specific Month and Year
                    var targetMonth = billList.First().Month;
                    var targetYear = billList.First().Year;
                    var userIds = billList.Select(b => b.UserId).ToList();

                    // 2. Fetch existing bills for these users in this specific Month/Year
                    var existingBills = await mydb.TblBills
                        .Where(b => b.Month == targetMonth
                                 && b.Year == targetYear
                                 && userIds.Contains(b.UserId))
                        .ToDictionaryAsync(b => b.UserId);

                    foreach (var bill in billList)
                    {
                        if (existingBills.TryGetValue(bill.UserId, out var dbBill))
                        {
                            // --- UPDATE EXISTING BILL ---
                            dbBill.TotalTeaWaterAmount = bill.TotalTeaWaterAmount;
                            dbBill.TotalFoodAmount = bill.TotalFoodAmount;
                            dbBill.GrandTotal = bill.GrandTotal;
                            // Note: We usually don't overwrite 'IsPaid' during re-computation 
                            // unless you want to reset it. Assuming we keep payment status:
                            // dbBill.IsPaid = bill.IsPaid; 
                        }
                        else
                        {
                            // --- INSERT NEW BILL ---
                            mydb.TblBills.Add(new TblBill
                            {
                                UserId = bill.UserId,
                                Month = bill.Month,
                                Year = bill.Year,
                                TotalTeaWaterAmount = bill.TotalTeaWaterAmount,
                                TotalFoodAmount = bill.TotalFoodAmount,
                                GrandTotal = bill.GrandTotal,
                                IsPaid = false, // Default to unpaid
                                PdfPath = ""    // Optional
                            });
                        }
                    }

                    await mydb.SaveChangesAsync();
                }

                return Ok("Bills computed and saved successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}
