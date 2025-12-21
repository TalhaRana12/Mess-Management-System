using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System.Security.Claims;

namespace EAD_project.Controllers
{
    public class AttendanceModel
    {
        public List<TblAttendance> attendance;
        public List<TblRequest> request;
    }
    public class UserattendanceController : Controller
    {
        [HttpGet]
        public async Task<IActionResult> user_attendance()
        {
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                return RedirectToAction("login", "Login");
            }
            int currentUserId = sessionUserId.Value;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var viewmodel = new AttendanceModel
                {
                    attendance = await mydb.TblAttendances
                                        .Where(x => x.UserId == currentUserId)
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
                                        .ToListAsync(),

                    request = await mydb.TblRequests
                                        .Where(x => x.UserId == currentUserId)
                                        .Select(r => new TblRequest
                                        {
                                            RequestId = r.RequestId,
                                            AttendanceId = r.AttendanceId,
                                            UserId = r.UserId,
                                            Status = r.Status,
                                            AdminMessage = r.AdminMessage
                                        })
                                        .ToListAsync()
                };
                return View(viewmodel);
            }
        }
        public class VerificationRequestModel
        {
            public int AttendanceId { get; set; }
            public int UserId { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> verify_request_api([FromBody] VerificationRequestModel requestData)
        {
            if (requestData == null || requestData.AttendanceId == 0 || requestData.UserId == 0)
            {
                return BadRequest("Invalid request data.");
            }

            try
            {
                using (var mydb = new MessManagmentContext())
                {
                    // 1. Check if the Attendance record actually exists
                    var attendanceExists = await mydb.TblAttendances
                        .AnyAsync(a => a.AttendanceId == requestData.AttendanceId);

                    if (!attendanceExists)
                        return NotFound("Attendance record not found.");

                    // 2. Check if a request already exists to prevent duplicates
                    var existingRequest = await mydb.TblRequests
                        .AnyAsync(r => r.AttendanceId == requestData.AttendanceId);

                    if (existingRequest)
                        return BadRequest("Verification request already sent.");

                    // 3. Create the new Request object
                    var newRequest = new TblRequest
                    {
                        AttendanceId = requestData.AttendanceId,
                        UserId = requestData.UserId,
                        RequestDate = DateTime.Now,
                        Status = "Pending", // Default status
                        AdminMessage = null
                    };

                    // 4. Save to Database
                    mydb.TblRequests.Add(newRequest);
                    await mydb.SaveChangesAsync();
                }

                return Ok("Verification request sent successfully.");
            }
            catch (Exception ex)
            {
                // Log exception if needed
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}
