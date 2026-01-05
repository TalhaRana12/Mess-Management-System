using EAD_project.Models;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Controllers
{
    public class MenuController : Controller
    {
        private readonly MessManagmentContext _db;

        public MenuController(MessManagmentContext db)
        {
            _db = db;
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        public async Task<IActionResult> menu()
        {
            var temp = await _db.TblMenus.ToListAsync();
            return View(temp);
        }

        [Authorize(AuthenticationSchemes = "JwtAuth")]
        [HttpPost]
        public async Task<IActionResult> SaveMenu_api([FromBody] List<TblMenu> menuItems)
        {
            if (menuItems == null || !menuItems.Any())
                return BadRequest("Menu data is empty");

            string day = menuItems.First().DayOfWeek;

            await using (var transaction = await _db.Database.BeginTransactionAsync())
            {
                try
                {
                    var existingMenu = _db.TblMenus.Where(m => m.DayOfWeek == day);
                    _db.TblMenus.RemoveRange(existingMenu);
                    await _db.SaveChangesAsync();

                    foreach (var item in menuItems)
                    {
                        _db.TblMenus.Add(new TblMenu
                        {
                            DayOfWeek = item.DayOfWeek,
                            MealType = item.MealType,
                            DishName = item.DishName,
                            Price = item.Price,
                            IsMandatory = item.IsMandatory
                        });
                    }

                    await _db.SaveChangesAsync();
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
