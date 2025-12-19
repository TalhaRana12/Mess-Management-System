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
        }
        public async Task<IActionResult> attendance()
        {
            using (MessDbContext mydb=new MessDbContext())
            {
                var viewModel = new MemberMenuViewModel
                {
                    menu = await mydb.TblMenus.ToListAsync(),
                    user = await mydb.TblUsers.ToListAsync()
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
                using (var mydb = new MessDbContext())
                {
                    // Assume all records are for the same date
                    var targetDate = attendanceList.First().AttendanceDate;

                    // Fetch existing records for these users and this date in ONE query
                    var userIds = attendanceList.Select(a => a.UserId).ToList();
                    var existingRecords = await mydb.TblAttendances
                        .Where(a => a.AttendanceDate == targetDate && userIds.Contains(a.UserId))
                        .ToDictionaryAsync(a => a.UserId); // Use Dictionary for O(1) lookup

                    foreach (var record in attendanceList)
                    {
                        if (existingRecords.TryGetValue(record.UserId, out var dbRecord))
                        {
                            // UPDATE existing record
                            dbRecord.TeaWater = record.TeaWater;
                            dbRecord.Food = record.Food;
                            dbRecord.FoodPrice = record.FoodPrice;
                        }
                        else
                        {
                            // INSERT new record
                            mydb.TblAttendances.Add(new TblAttendance
                            {
                                UserId = record.UserId,
                                AttendanceDate = record.AttendanceDate,
                                TeaWater = record.TeaWater,
                                Food = record.Food,
                                FoodPrice = record.FoodPrice
                            });
                        }
                    }

                    // Commit all changes in one SaveChangesAsync() call
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
