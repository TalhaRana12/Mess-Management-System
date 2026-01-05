using System;
using System.Collections.Generic;
using Microsoft.EntityFrameworkCore;

namespace EAD_project.Models;

public partial class MessManagmentContext : DbContext
{
    public MessManagmentContext()
    {
    }

    public MessManagmentContext(DbContextOptions<MessManagmentContext> options)
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
    {
        // IMPORTANT: No hardcoded connection string here.
        // This DbContext must be configured via DI in Program.cs using the
        // ConnectionStrings:DefaultConnection value from appsettings.json / environment.
        if (!optionsBuilder.IsConfigured)
        {
            throw new InvalidOperationException(
                "MessManagmentContext is not configured. Configure it in Program.cs using AddDbContext and a connection string.");
        }
    }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<TblAttendance>(entity =>
        {
            entity.HasKey(e => e.AttendanceId).HasName("PK__TblAtten__8B69263CEF110AB5");

            entity.ToTable("TblAttendance");

            entity.Property(e => e.AttendanceId).HasColumnName("AttendanceID");
            entity.Property(e => e.FoodPrice).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.MealType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("Lunch");
            entity.Property(e => e.TeaWater).HasDefaultValue(true);
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.TblAttendances)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Attendance_UserID");
        });

        modelBuilder.Entity<TblBill>(entity =>
        {
            entity.HasKey(e => e.BillId).HasName("PK__TblBill__11F2FC4A370A4644");

            entity.ToTable("TblBill");

            entity.Property(e => e.BillId).HasColumnName("BillID");
            entity.Property(e => e.GrandTotal).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.PdfPath)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.TotalFoodAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.TotalTeaWaterAmount).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.User).WithMany(p => p.TblBills)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Bills_User");
        });

        modelBuilder.Entity<TblMenu>(entity =>
        {
            entity.HasKey(e => e.MenuId).HasName("PK__TblMenu__C99ED2505AA1EDF4");

            entity.ToTable("TblMenu");

            entity.Property(e => e.MenuId).HasColumnName("MenuID");
            entity.Property(e => e.DayOfWeek)
                .HasMaxLength(15)
                .IsUnicode(false);
            entity.Property(e => e.DishName)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.MealType)
                .HasMaxLength(10)
                .IsUnicode(false)
                .HasDefaultValue("Lunch");
            entity.Property(e => e.Price).HasColumnType("decimal(10, 2)");
        });

        modelBuilder.Entity<TblPayment>(entity =>
        {
            entity.HasKey(e => e.PaymentId).HasName("PK__TblPayme__9B556A5823C0863E");

            entity.ToTable("TblPayment");

            entity.Property(e => e.PaymentId).HasColumnName("PaymentID");
            entity.Property(e => e.AmountPaid).HasColumnType("decimal(10, 2)");
            entity.Property(e => e.BillId).HasColumnName("BillID");
            entity.Property(e => e.PaidAt)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.PaymentMethod)
                .HasMaxLength(50)
                .IsUnicode(false);
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false);
            entity.Property(e => e.TransactionId)
                .HasMaxLength(100)
                .IsUnicode(false)
                .HasColumnName("TransactionID");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Bill).WithMany(p => p.TblPayments)
                .HasForeignKey(d => d.BillId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_Bill");

            entity.HasOne(d => d.User).WithMany(p => p.TblPayments)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Payments_User");
        });

        modelBuilder.Entity<TblRequest>(entity =>
        {
            entity.HasKey(e => e.RequestId).HasName("PK__TblReque__33A8519A09BBCEEC");

            entity.ToTable("TblRequest");

            entity.Property(e => e.RequestId).HasColumnName("RequestID");
            entity.Property(e => e.AdminMessage)
                .HasMaxLength(500)
                .IsUnicode(false);
            entity.Property(e => e.AttendanceId).HasColumnName("AttendanceID");
            entity.Property(e => e.RequestDate)
                .HasDefaultValueSql("(getdate())")
                .HasColumnType("datetime");
            entity.Property(e => e.Status)
                .HasMaxLength(20)
                .IsUnicode(false)
                .HasDefaultValue("Pending");
            entity.Property(e => e.UserId).HasColumnName("UserID");

            entity.HasOne(d => d.Attendance).WithMany(p => p.TblRequests)
                .HasForeignKey(d => d.AttendanceId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Verification_Attendance");

            entity.HasOne(d => d.User).WithMany(p => p.TblRequests)
                .HasForeignKey(d => d.UserId)
                .OnDelete(DeleteBehavior.ClientSetNull)
                .HasConstraintName("FK_Verification_User");
        });

        modelBuilder.Entity<TblUser>(entity =>
        {
            entity.HasKey(e => e.UserId).HasName("PK__TblUser__1788CCAC82DAB226");

            entity.ToTable("TblUser");

            entity.HasIndex(e => e.Username, "UQ__TblUser__536C85E45BCAE38C").IsUnique();

            entity.HasIndex(e => e.Cnic, "UQ__TblUser__AA570FD41FB47198").IsUnique();

            entity.Property(e => e.UserId).HasColumnName("UserID");
            entity.Property(e => e.Cnic)
                .HasMaxLength(15)
                .IsUnicode(false)
                .HasColumnName("CNIC");
            entity.Property(e => e.Department)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.IsActive).HasDefaultValue(true);
            entity.Property(e => e.Name)
                .HasMaxLength(100)
                .IsUnicode(false);
            entity.Property(e => e.PasswordHash)
                .HasMaxLength(200)
                .IsUnicode(false);
            entity.Property(e => e.Role)
                .HasMaxLength(10)
                .IsUnicode(false);
            entity.Property(e => e.Username)
                .HasMaxLength(50)
                .IsUnicode(false);
        });

        OnModelCreatingPartial(modelBuilder);
    }

    partial void OnModelCreatingPartial(ModelBuilder modelBuilder);
}
