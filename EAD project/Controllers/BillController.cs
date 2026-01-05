using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;

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
        private readonly MessManagmentContext _db;

        public BillController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> bill()
        {
            var viewModel = new ViewModel
            {
                user = await _db.TblUsers.ToListAsync(),
                bills = await _db.TblBills.ToListAsync(),
                attendances = await _db.TblAttendances
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

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> SaveBillsApi([FromBody] List<TblBill> billList)
        {
            if (billList == null || billList.Count == 0)
                return BadRequest("No bill data received.");

            try
            {
                var targetMonth = billList.First().Month;
                var targetYear = billList.First().Year;
                var userIds = billList.Select(b => b.UserId).ToList();

                var existingBills = await _db.TblBills
                    .Where(b => b.Month == targetMonth
                             && b.Year == targetYear
                             && userIds.Contains(b.UserId))
                    .ToDictionaryAsync(b => b.UserId);

                foreach (var bill in billList)
                {
                    if (existingBills.TryGetValue(bill.UserId, out var dbBill))
                    {
                        dbBill.TotalTeaWaterAmount = bill.TotalTeaWaterAmount;
                        dbBill.TotalFoodAmount = bill.TotalFoodAmount;
                        dbBill.GrandTotal = bill.GrandTotal;
                    }
                    else
                    {
                        _db.TblBills.Add(new TblBill
                        {
                            UserId = bill.UserId,
                            Month = bill.Month,
                            Year = bill.Year,
                            TotalTeaWaterAmount = bill.TotalTeaWaterAmount,
                            TotalFoodAmount = bill.TotalFoodAmount,
                            GrandTotal = bill.GrandTotal,
                            IsPaid = false,
                            PdfPath = ""
                        });
                    }
                }

                await _db.SaveChangesAsync();
                return Ok("Bills computed and saved successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}
