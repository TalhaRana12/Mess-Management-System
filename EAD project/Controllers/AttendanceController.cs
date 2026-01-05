using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class AttendanceController : Controller
    {
        private readonly MessManagmentContext _db;

        public AttendanceController(MessManagmentContext db)
        {
            _db = db;
        }

        public class MemberMenuViewModel
        {
            public List<TblMenu> menu;
            public List<TblUser> user;
            public List<TblAttendance> attendances;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> attendance()
        {
            var viewModel = new MemberMenuViewModel
            {
                menu = await _db.TblMenus.ToListAsync(),
                user = await _db.TblUsers.ToListAsync(),
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
        public async Task<IActionResult> save_api([FromBody] List<TblAttendance> attendanceList)
        {
            if (attendanceList == null || attendanceList.Count == 0)
                return BadRequest("No attendance data received.");

            try
            {
                var targetDate = attendanceList.First().AttendanceDate;
                var targetMeal = attendanceList.First().MealType;
                var userIds = attendanceList.Select(a => a.UserId).ToList();

                var existingRecords = await _db.TblAttendances
                    .Where(a => a.AttendanceDate == targetDate
                             && a.MealType == targetMeal
                             && userIds.Contains(a.UserId))
                    .ToDictionaryAsync(a => a.UserId);

                foreach (var record in attendanceList)
                {
                    if (existingRecords.TryGetValue(record.UserId, out var dbRecord))
                    {
                        dbRecord.TeaWater = record.TeaWater;
                        dbRecord.Food = record.Food;
                        dbRecord.FoodPrice = record.FoodPrice;
                    }
                    else
                    {
                        _db.TblAttendances.Add(new TblAttendance
                        {
                            UserId = record.UserId,
                            AttendanceDate = record.AttendanceDate,
                            MealType = record.MealType,
                            TeaWater = record.TeaWater,
                            Food = record.Food,
                            FoodPrice = record.FoodPrice
                        });
                    }
                }

                await _db.SaveChangesAsync();
                return Ok("Attendance saved successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}