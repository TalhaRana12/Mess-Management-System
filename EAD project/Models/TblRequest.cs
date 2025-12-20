using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblRequest
{
    public int RequestId { get; set; }

    public int AttendanceId { get; set; }

    public int UserId { get; set; }

    public DateTime RequestDate { get; set; }

    public string Status { get; set; } = null!;

    public string? AdminMessage { get; set; }

    public virtual TblAttendance Attendance { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}
