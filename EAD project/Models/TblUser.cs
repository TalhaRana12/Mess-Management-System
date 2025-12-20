using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblUser
{
    public int UserId { get; set; }

    public string Name { get; set; } = null!;

    public string Cnic { get; set; } = null!;

    public string Department { get; set; } = null!;

    public string Username { get; set; } = null!;

    public string PasswordHash { get; set; } = null!;

    public string Role { get; set; } = null!;

    public bool IsActive { get; set; }

    public virtual ICollection<TblAttendance> TblAttendances { get; set; } = new List<TblAttendance>();

    public virtual ICollection<TblBill> TblBills { get; set; } = new List<TblBill>();

    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    public virtual ICollection<TblRequest> TblRequests { get; set; } = new List<TblRequest>();
}
