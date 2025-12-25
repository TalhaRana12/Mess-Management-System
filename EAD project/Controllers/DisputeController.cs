using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EAD_project.Controllers
{
    // 1. DTO to receive data from JavaScript fetch() call
    public class DisputeResolutionDto
    {
        public int RequestId { get; set; }
        public string Status { get; set; }        // "Approved" or "Rejected"
        public string AdminMessage { get; set; }
        public bool ApplyCorrection { get; set; } // true if admin checks the box
    }

    // 2. ViewModel to pass data to the View
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
                // 1. Fetch All Requests AND Include User Data
                // The .Include(r => r.User) is CRITICAL for getting Name/Email/Dept
                var allRequests = await mydb.TblRequests
                                            .Include(r => r.User)
                                            .OrderByDescending(r => r.RequestDate)
                                            .ToListAsync();

                // 2. Get the list of Attendance IDs involved in these disputes
                var disputedAttendanceIds = allRequests.Select(r => r.AttendanceId).Distinct().ToList();

                // 3. Fetch only the relevant Attendance records
                var disputedAttendances = await mydb.TblAttendances
                                                .Where(a => disputedAttendanceIds.Contains(a.AttendanceId))
                                                .ToListAsync();

                // 4. Create Model
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

            try
            {
                using (MessManagmentContext mydb = new MessManagmentContext())
                {
                    // 1. Find the Request
                    var request = await mydb.TblRequests.FirstOrDefaultAsync(r => r.RequestId == data.RequestId);

                    if (request == null) return NotFound("Request not found in database.");

                    // 2. Update Request Status & Message
                    request.Status = data.Status; // "Approved" or "Rejected"
                    request.AdminMessage = data.AdminMessage;

                    // 3. Apply Logic: If Approved AND Correction Checked
                    if (data.Status == "Approved" && data.ApplyCorrection)
                    {
                        var attendance = await mydb.TblAttendances.FindAsync(request.AttendanceId);

                        if (attendance != null)
                        {
                            // LOGIC: "Correction" means removing the charge.
                            // Set presence/food flags to false and price to 0.
                            attendance.Food = false;
                            attendance.TeaWater = true;
                            attendance.FoodPrice = 0;

                            // Update the attendance record
                            mydb.TblAttendances.Update(attendance);
                        }
                    }

                    // 4. Save Request Update
                    mydb.TblRequests.Update(request);

                    // 5. Commit all changes (Request + Attendance)
                    await mydb.SaveChangesAsync();

                    return Ok(new { success = true, message = "Dispute resolved successfully." });
                }
            }
            catch (Exception ex)
            {
                // Log the error in a real app
                return StatusCode(500, $"Server Error: {ex.Message}");
            }
        }
    }
}