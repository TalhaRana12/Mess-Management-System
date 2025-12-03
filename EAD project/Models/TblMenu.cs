using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblMenu")]
public partial class TblMenu
{
    [Key]
    [Column("MenuID")]
    public int MenuId { get; set; }

    [StringLength(15)]
    [Unicode(false)]
    public string DayOfWeek { get; set; } = null!;

    [StringLength(100)]
    [Unicode(false)]
    public string DishName { get; set; } = null!;

    [Column(TypeName = "decimal(10, 2)")]
    public decimal Price { get; set; }

    [StringLength(10)]
    [Unicode(false)]
    public string MealType { get; set; } = null!;

    public bool IsMandatory { get; set; }
}
