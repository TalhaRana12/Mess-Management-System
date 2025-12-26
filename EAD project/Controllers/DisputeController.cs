using EAD_project.Models;
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
        [HttpGet]
        public async Task<IActionResult> dispute()
        {
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var allRequests = await mydb.TblRequests
                                            .Include(r => r.User)
                                            .OrderByDescending(r => r.RequestDate)
                                            .ToListAsync();

                var disputedAttendanceIds = allRequests.Select(r => r.AttendanceId).Distinct().ToList();

                var disputedAttendances = await mydb.TblAttendances
                                                .Where(a => disputedAttendanceIds.Contains(a.AttendanceId))
                                                .ToListAsync();

                var viewModel = new DisputeViewModel
                {
                    Requests = allRequests,
                    Attendances = disputedAttendances
                };

                return View(viewModel);
            }
        }

        [HttpPost]
        public async Task<IActionResult> ResolveDispute([FromBody] DisputeResolutionDto data)
        {
            if (data == null) return BadRequest("Invalid Data");

            // CONSTANT: Fixed charge for Tea/Water
            decimal teaWaterCharge = 50.0m;

            try
            {
                using (MessManagmentContext mydb = new MessManagmentContext())
                {
                    var request = await mydb.TblRequests.FirstOrDefaultAsync(r => r.RequestId == data.RequestId);
                    if (request == null) return NotFound("Request not found.");

                    // Update Status
                    request.Status = data.Status;
                    request.AdminMessage = data.AdminMessage;

                    // --- LOGIC: If Approved AND Correction Checked ---
                    if (data.Status == "Approved" && data.ApplyCorrection)
                    {
                        var attendance = await mydb.TblAttendances.FindAsync(request.AttendanceId);

                        if (attendance != null)
                        {
                            // 1. Food becomes Absent (False) - handles both Lunch/Dinner disputes
                            attendance.Food = false;

                            // 2. Tea/Water remains/becomes Present (True)
                            attendance.TeaWater = true;

                            // 3. Price set to 50
                            attendance.FoodPrice = teaWaterCharge;

                            mydb.TblAttendances.Update(attendance);
                        }
                    }

                    mydb.TblRequests.Update(request);
                    await mydb.SaveChangesAsync();

                    return Ok(new { success = true, message = "Dispute resolved. User marked Absent for Food, Present for Tea (Rs. 50)." });
                }
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"Server Error: {ex.Message}");
            }
        }
    }
}