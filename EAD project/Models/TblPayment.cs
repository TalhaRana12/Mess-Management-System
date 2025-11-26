using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

[Table("TblPayment")]
public partial class TblPayment
{
    [Key]
    [Column("PaymentID")]
    public int PaymentId { get; set; }

    [Column("BillID")]
    public int BillId { get; set; }

    [Column("UserID")]
    public int UserId { get; set; }

    [Column(TypeName = "decimal(10, 2)")]
    public decimal AmountPaid { get; set; }

    [StringLength(50)]
    [Unicode(false)]
    public string? PaymentMethod { get; set; }

    [Column("TransactionID")]
    [StringLength(100)]
    [Unicode(false)]
    public string? TransactionId { get; set; }

    [StringLength(20)]
    [Unicode(false)]
    public string Status { get; set; } = null!;

    [Column(TypeName = "datetime")]
    public DateTime PaidAt { get; set; }

    [ForeignKey("BillId")]
    [InverseProperty("TblPayments")]
    public virtual TblBill Bill { get; set; } = null!;

    [ForeignKey("UserId")]
    [InverseProperty("TblPayments")]
    public virtual TblUser User { get; set; } = null!;
}
