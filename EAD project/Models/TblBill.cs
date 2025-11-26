using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblBill")]
public partial class TblBill
{
    [Key]
    [Column("BillID")]
    public int BillId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalTeaWaterAmount { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal TotalFoodAmount { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal GrandTotal { get; set; }

    [StringLength(200)]
    [Unicode(false)]
    public string? PdfPath { get; set; }

    public bool IsPaid { get; set; }

    [InverseProperty("Bill")]
    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    [ForeignKey("UserId")]
    [InverseProperty("TblBills")]
    public virtual TblUser User { get; set; } = null!;
}
