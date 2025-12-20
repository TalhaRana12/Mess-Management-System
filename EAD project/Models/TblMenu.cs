using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblMenu
{
    public int MenuId { get; set; }

    public string DayOfWeek { get; set; } = null!;

    public string DishName { get; set; } = null!;

    public decimal Price { get; set; }

    public string MealType { get; set; } = null!;

    public bool IsMandatory { get; set; }
}
