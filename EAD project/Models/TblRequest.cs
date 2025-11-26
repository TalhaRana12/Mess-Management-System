using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblRequest")]
public partial class TblRequest
{
    [Key]
    [Column("RequestID")]
    public int RequestId { get; set; }

    [Column("AttendanceID")]
    public int AttendanceId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column(TypeName = "datetime")]
    public DateTime RequestDate { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string Status { get; set; } = null!;

    [StringLength(500)]
    [Unicode(false)]
    public string? AdminMessage { get; set; }

    [ForeignKey("AttendanceId")]
    [InverseProperty("TblRequests")]
    public virtual TblAttendance Attendance { get; set; } = null!;

    [ForeignKey("UserId")]
    [InverseProperty("TblRequests")]
    public virtual TblUser User { get; set; } = null!;
}
