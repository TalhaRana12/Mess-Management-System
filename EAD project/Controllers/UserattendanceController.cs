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
        private readonly MessManagmentContext _db;

        public UserattendanceController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpGet]
        public async Task<IActionResult> user_attendance()
        {
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
                return RedirectToAction("login", "Login");

            int currentUserId = sessionUserId.Value;

            var viewmodel = new AttendanceModel
            {
                attendance = await _db.TblAttendances
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

                request = await _db.TblRequests
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

        public class VerificationRequestModel
        {
            public int AttendanceId { get; set; }
            public int UserId { get; set; }
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> verify_request_api([FromBody] VerificationRequestModel requestData)
        {
            if (requestData == null || requestData.AttendanceId == 0 || requestData.UserId == 0)
                return BadRequest("Invalid request data.");

            try
            {
                var attendanceExists = await _db.TblAttendances.AnyAsync(a => a.AttendanceId == requestData.AttendanceId);
                if (!attendanceExists)
                    return NotFound("Attendance record not found.");

                var existingRequest = await _db.TblRequests.AnyAsync(r => r.AttendanceId == requestData.AttendanceId);
                if (existingRequest)
                    return BadRequest("Verification request already sent.");

                var newRequest = new TblRequest
                {
                    AttendanceId = requestData.AttendanceId,
                    UserId = requestData.UserId,
                    RequestDate = DateTime.Now,
                    Status = "Pending",
                    AdminMessage = null
                };

                _db.TblRequests.Add(newRequest);
                await _db.SaveChangesAsync();

                return Ok("Verification request sent successfully.");
            }
            catch (Exception ex)
            {
                return StatusCode(500, "Internal Server Error: " + ex.Message);
            }
        }
    }
}
