using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class AttendanceController : Controller
    {
        public class MemberMenuViewModel
        {
            public List<TblMenu> menu;
            public List<TblUser> user;
            public List<TblAttendance> attendances;
        }

        public async Task<IActionResult> attendance()
        {
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var viewModel = new MemberMenuViewModel
                {
                    menu = await mydb.TblMenus.ToListAsync(),
                    user = await mydb.TblUsers.ToListAsync(),

                    // FIX: We MUST include MealType in the projection now
                    attendances = await mydb.TblAttendances
                        .Select(a => new TblAttendance
                        {
                            AttendanceId = a.AttendanceId,
                            UserId = a.UserId,
                            AttendanceDate = a.AttendanceDate,
                            MealType = a.MealType, // <--- ADDED THIS
                            TeaWater = a.TeaWater,
                            Food = a.Food,
                            FoodPrice = a.FoodPrice
                        })
                        .ToListAsync()
                };
                return View(viewModel);
            }
        }

        [HttpPost]
        public async Task<IActionResult> save_api([FromBody] List<TblAttendance> attendanceList)
        {
            if (attendanceList == null || attendanceList.Count == 0)
                return BadRequest("No attendance data received.");

            try
            {
                using (var mydb = new MessManagmentContext())
                {
                    // 1. Get Context: All records in this batch are for specific Date AND MealType
                    var targetDate = attendanceList.First().AttendanceDate;
                    var targetMeal = attendanceList.First().MealType; // e.g., "Dinner"

                    var userIds = attendanceList.Select(a => a.UserId).ToList();

                    // 2. Fetch existing records matching User + Date + MealType
                    var existingRecords = await mydb.TblAttendances
                        .Where(a => a.AttendanceDate == targetDate
                                 && a.MealType == targetMeal
                                 && userIds.Contains(a.UserId))
                        .ToDictionaryAsync(a => a.UserId);

                    foreach (var record in attendanceList)
                    {
                        if (existingRecords.TryGetValue(record.UserId, out var dbRecord))
                        {
                            // UPDATE
                            dbRecord.TeaWater = record.TeaWater;
                            dbRecord.Food = record.Food;
                            dbRecord.FoodPrice = record.FoodPrice;
                            // MealType doesn't change during update
                        }
                        else
                        {
                            // INSERT
                            mydb.TblAttendances.Add(new TblAttendance
                            {
                                UserId = record.UserId,
                                AttendanceDate = record.AttendanceDate,
                                MealType = record.MealType, // <--- SAVE MEAL TYPE
                                TeaWater = record.TeaWater,
                                Food = record.Food,
                                FoodPrice = record.FoodPrice
                            });
                        }
                    }

                    await mydb.SaveChangesAsync();
                }

                return Ok("Attendance saved successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}