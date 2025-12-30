using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Microsoft.AspNetCore.Authorization;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Http; // Needed for Session

namespace EAD_project.Controllers
{
    // 1. DTO Class - Moved outside the controller for better accessibility
    public class PaymentRequestDto
    {
        public int BillId { get; set; }
        public int UserId { get; set; }
        public decimal AmountPaid { get; set; }
        public string PaymentMethod { get; set; }
        public string TransactionId { get; set; }
    }

    // 2. View Model Class
    public class ViewModelBill
    {
        public List<TblBill> Bills { get; set; }
        public List<TblUser> User { get; set; }
        public List<TblAttendance> Attendances { get; set; }
    }

    public class Bill_userController : Controller
    {
        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> PayBillApi([FromBody] PaymentRequestDto request)
        {
            // 1. Session Security Check
            int? sessionUserId = HttpContext.Session.GetInt32("uet");

            if (sessionUserId == null)
            {
                return Unauthorized("User session expired. Please login again.");
            }

            if (sessionUserId != request.UserId)
            {
                return BadRequest("Security Alert: Session User does not match Request User.");
            }

            try
            {
                using (MessManagmentContext mydb = new MessManagmentContext())
                {
                    // 2. Find the Bill
                    var bill = await mydb.TblBills
                        .FirstOrDefaultAsync(b => b.BillId == request.BillId);

                    if (bill == null)
                        return NotFound("Bill not found.");

                    if (bill.IsPaid)
                        return BadRequest("This bill has already been paid.");

                    // 3. Update Bill Status
                    bill.IsPaid = true;
                    mydb.TblBills.Update(bill);

                    // 4. Create Payment Record
                    var payment = new TblPayment
                    {
                        BillId = request.BillId,
                        UserId = request.UserId,
                        AmountPaid = request.AmountPaid,
                        PaymentMethod = request.PaymentMethod,
                        TransactionId = request.TransactionId,

                        // Must match DB CHECK constraint
                        Status = "Success",
                        PaidAt = DateTime.Now
                    };

                    await mydb.TblPayments.AddAsync(payment);

                    // 5. Save everything together
                    await mydb.SaveChangesAsync();

                    return Ok(new
                    {
                        success = true,
                        message = "Payment processed successfully.",
                        paidAt = payment.PaidAt
                    });
                }
            }
            catch (DbUpdateException dbEx)
            {
                var innerMessage = dbEx.InnerException?.Message ?? dbEx.Message;
                return StatusCode(500, $"Database Update Error: {innerMessage}");
            }
            catch (Exception ex)
            {
                return StatusCode(500, $"General Error: {ex.Message}");
            }
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> user_bill()
        {
            // 1. Get User ID from Session
            int? sessionUserId = HttpContext.Session.GetInt32("uet");
            if (sessionUserId == null)
            {
                return RedirectToAction("login", "Login");
            }
            int currentUserId = sessionUserId.Value;

            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                var viewModel = new ViewModelBill
                {
                    // 2. Fetch only the logged-in User
                    User = await mydb.TblUsers
                                     .Where(u => u.UserId == currentUserId)
                                     .ToListAsync(),

                    // 3. Fetch only bills belonging to this user
                    Bills = await mydb.TblBills
                                     .Where(b => b.UserId == currentUserId)
                                     .ToListAsync(),

                    // 4. Fetch only attendance records for this user
                    Attendances = await mydb.TblAttendances
                        .Where(a => a.UserId == currentUserId)
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
        }
    }
}