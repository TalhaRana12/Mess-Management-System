using System;
using System.Collections.Generic;

namespace EAD_project;

public partial class TblPayment
{
    public int PaymentId { get; set; }

    public int BillId { get; set; }

    public int UserId { get; set; }

    public decimal AmountPaid { get; set; }

    public string? PaymentMethod { get; set; }

    public string? TransactionId { get; set; }

    public string Status { get; set; } = null!;

    public DateTime PaidAt { get; set; }

    public virtual TblBill Bill { get; set; } = null!;

    public virtual TblUser User { get; set; } = null!;
}
