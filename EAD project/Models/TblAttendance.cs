using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblAttendance")]
public partial class TblAttendance
{
    [Key]
    [Column("AttendanceID")]
    public int AttendanceId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    public DateOnly AttendanceDate { get; set; }

    public bool TeaWater { get; set; }

    public bool Food { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal? FoodPrice { get; set; }

    [InverseProperty("Attendance")]
    public virtual ICollection<TblRequest> TblRequests { get; set; } = new List<TblRequest>();

    [ForeignKey("UserId")]
    [InverseProperty("TblAttendances")]
    public virtual TblUser User { get; set; } = null!;
}
