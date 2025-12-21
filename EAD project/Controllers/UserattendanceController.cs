using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class UserattendanceController : Controller
    {
        public async Task  <IActionResult> user_attendance()
        {
            List<TblAttendance>? atttendances;
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                atttendances = await  mydb.TblAttendances.ToListAsync();
            }
            return View(atttendances);
        }
    }
}
