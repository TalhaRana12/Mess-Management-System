using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblUser")]
[Index("Username", Name = "UQ__TblUser__536C85E45BCAE38C", IsUnique = true)]
[Index("Cnic", Name = "UQ__TblUser__AA570FD41FB47198", IsUnique = true)]
public partial class TblUser
{
    [Key]
    [Column("UserID")]
    public int UserId { get; set; }

    [StringLength(100)]
    [Unicode(false)]
    public string Name { get; set; } = null!;

    [Column("CNIC")]
    [StringLength(15)]
    [Unicode(false)]
    public string Cnic { get; set; } = null!;

    [StringLength(100)]
    [Unicode(false)]
    public string Department { get; set; } = null!;

    [StringLength(50)]
    [Unicode(false)]
    public string Username { get; set; } = null!;

    [StringLength(200)]
    [Unicode(false)]
    public string PasswordHash { get; set; } = null!;

    [StringLength(10)]
    [Unicode(false)]
    public string Role { get; set; } = null!;

    public bool IsActive { get; set; }

    [InverseProperty("User")]
    public virtual ICollection<TblAttendance> TblAttendances { get; set; } = new List<TblAttendance>();

    [InverseProperty("User")]
    public virtual ICollection<TblBill> TblBills { get; set; } = new List<TblBill>();

    [InverseProperty("User")]
    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    [InverseProperty("User")]
    public virtual ICollection<TblRequest> TblRequests { get; set; } = new List<TblRequest>();
}
