using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

public partial class MessDbContext : DbContext
{
    public MessDbContext()
    {
    }

    public MessDbContext(DbContextOptions<MessDbContext> options)
        : base(options)
    {
    }

    public virtual DbSet<TblAttendance> TblAttendances { get; set; }

    public virtual DbSet<TblBill> TblBills { get; set; }

    public virtual DbSet<TblMenu> TblMenus { get; set; }

    public virtual DbSet<TblPayment> TblPayments { get; set; }

    public virtual DbSet<TblRequest> TblRequests { get; set; }

    public virtual DbSet<TblUser> TblUsers { get; set; }

    protected override void OnConfiguring(DbContextOptionsBuilder optionsBuilder)
#warning To protect potentially sensitive information in your connection string, you should move it out of source code. You can avoid scaffolding the connection string by using the Name= syntax to read it from configuration - see https://go.microsoft.com/fwlink/?linkid=2131148. For more guidance on storing connection strings, see https://go.microsoft.com/fwlink/?LinkId=723263.
        => optionsBuilder.UseSqlServer("Data Source=(localdb)\\ProjectModels;Initial Catalog=MessManagment;Integrated Security=True;Connect Timeout=30;Encrypt=False;Trust Server Certificate=False;Application Intent=ReadWrite;Multi Subnet Failover=False;");

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblAttendance>(entity =>
        {
            entity.HasKey(e => e.AttendanceId).HasName("PK__TblAtten__8B69263CEF110AB5");

            entity.Property(e => e.TeaWater).HasDefaultValue(true);

            entity.HasOne(d => d.User).WithMany(p => p.TblAttendances)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attendance_UserID");
        });

        modelBuilder.Entity<TblBill>(entity =>
        {
            entity.HasKey(e => e.BillId).HasName("PK__TblBill__11F2FC4A370A4644");

            entity.HasOne(d => d.User).WithMany(p => p.TblBills)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bills_User");
        });

        modelBuilder.Entity<TblMenu>(entity =>
        {
            entity.HasKey(e => e.MenuId).HasName("PK__TblMenu__C99ED2505AA1EDF4");
        });

        modelBuilder.Entity<TblPayment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__TblPayme__9B556A5823C0863E");

            entity.Property(e => e.PaidAt).HasDefaultValueSql("(getdate())");

            entity.HasOne(d => d.Bill).WithMany(p => p.TblPayments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Bill");

            entity.HasOne(d => d.User).WithMany(p => p.TblPayments)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_User");
        });

        modelBuilder.Entity<TblRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__TblReque__33A8519A09BBCEEC");

            entity.Property(e => e.RequestDate).HasDefaultValueSql("(getdate())");
            entity.Property(e => e.Status).HasDefaultValue("Pending");

            entity.HasOne(d => d.Attendance).WithMany(p => p.TblRequests)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Verification_Attendance");

            entity.HasOne(d => d.User).WithMany(p => p.TblRequests)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Verification_User");
        });

        modelBuilder.Entity<TblUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__TblUser__1788CCAC82DAB226");

            entity.Property(e => e.IsActive).HasDefaultValue(true);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
