using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblAttendance
{
    public int AttendanceId { get; set; }

    public int UserId { get; set; }

    public DateOnly AttendanceDate { get; set; }

    public bool TeaWater { get; set; }

    public bool Food { get; set; }

    public decimal? FoodPrice { get; set; }

    public string MealType { get; set; } = null!;

    public virtual ICollection<TblRequest> TblRequests { get; set; } = new List<TblRequest>();

    public virtual TblUser User { get; set; } = null!;
}
