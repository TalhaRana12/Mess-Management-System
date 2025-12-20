using EAD_project.Models;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
namespace EAD_project.Controllers
{
    public class MenuController : Controller
    {
        public async Task<IActionResult> menu()
        {
            List<TblMenu> temp;
            using (MessManagmentContext mydb = new MessManagmentContext())
            {
                temp = await mydb.TblMenus.ToListAsync();
            }

            return View(temp);
        }
        [HttpPost]
        public async Task<IActionResult> SaveMenu_api([FromBody] List<TblMenu> menuItems)
        {
            if (menuItems == null || !menuItems.Any())
                return BadRequest("Menu data is empty");

            string day = menuItems.First().DayOfWeek;

            using (MessManagmentContext mydb = new MessManagmentContext())
            using (var transaction = await mydb.Database.BeginTransactionAsync())
            {
                try
                {
                    // 1️⃣ Delete existing menu for that day
                    var existingMenu = mydb.TblMenus
                        .Where(m => m.DayOfWeek == day);

                    mydb.TblMenus.RemoveRange(existingMenu);
                    await mydb.SaveChangesAsync();

                    // 2️⃣ Insert updated menu
                    foreach (var item in menuItems)
                    {
                        mydb.TblMenus.Add(new TblMenu
                        {
                            DayOfWeek = item.DayOfWeek,
                            MealType = item.MealType,
                            DishName = item.DishName,
                            Price = item.Price,
                            IsMandatory = item.IsMandatory
                        });
                    }

                    await mydb.SaveChangesAsync();
                    await transaction.CommitAsync();

                    return Ok("Menu updated successfully");
                }
                catch (Exception ex)
                {
                    await transaction.RollbackAsync();
                    return StatusCode(500, ex.Message);
                }
            }
        }

    }
}
