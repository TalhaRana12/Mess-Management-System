using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EAD_project.Controllers
{
    public class DisputeResolutionDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; }        // "Approved" or "Rejected"
        public string AdminMessage { get; set; }
        public bool ApplyCorrection { get; set; }
    }

    public class DisputeViewModel
    {
        public List<TblRequest> Requests { get; set; }
        public List<TblAttendance> Attendances { get; set; }
    }

    public class DisputeController : Controller
    {
        private readonly MessManagmentContext _db;

        public DisputeController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpGet]
        public async Task<IActionResult> dispute()
        {
            var allRequests = await _db.TblRequests
                .Include(r => r.User)
                .OrderByDescending(r => r.RequestDate)
                .ToListAsync();

            var disputedAttendanceIds = allRequests.Select(r => r.AttendanceId).Distinct().ToList();

            var disputedAttendances = await _db.TblAttendances
                .Where(a => disputedAttendanceIds.Contains(a.AttendanceId))
                .ToListAsync();

            var viewModel = new DisputeViewModel
            {
                Requests = allRequests,
                Attendances = disputedAttendances
            };

            return View(viewModel);
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> ResolveDispute([FromBody] DisputeResolutionDto data)
        {
            if (data == null) return BadRequest("Invalid Data");

            decimal teaWaterCharge = 50.0m;

            try
            {
                var request = await _db.TblRequests.FirstOrDefaultAsync(r => r.RequestId == data.RequestId);
                if (request == null) return NotFound("Request not found.");

                request.Status = data.Status;
                request.AdminMessage = data.AdminMessage;

                if (data.Status == "Approved" && data.ApplyCorrection)
                {
                    var attendance = await _db.TblAttendances.FindAsync(request.AttendanceId);
                    if (attendance != null)
                    {
                        attendance.Food = false;
                        attendance.TeaWater = true;
                        attendance.FoodPrice = teaWaterCharge;
                    }
                }

                await _db.SaveChangesAsync();
                return Ok(new { success = true, message = "Dispute resolved. User marked Absent for Food, Present for Tea (Rs. 50)." });
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server Error: {ex.Message}");
            }
        }
    }
}