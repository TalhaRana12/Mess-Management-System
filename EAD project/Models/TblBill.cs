using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblBill
{
    public int BillId { get; set; }

    public int UserId { get; set; }

    public int Month { get; set; }

    public int Year { get; set; }

    public decimal TotalTeaWaterAmount { get; set; }

    public decimal TotalFoodAmount { get; set; }

    public decimal GrandTotal { get; set; }

    public string? PdfPath { get; set; }

    public bool IsPaid { get; set; }

    public virtual ICollection<TblPayment> TblPayments { get; set; } = new List<TblPayment>();

    public virtual TblUser User { get; set; } = null!;
}
