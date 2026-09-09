using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Metadata;
using Proprium.Domain;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Events;

namespace Proprium.Infrastructure.Persistence;

public sealed class PropriumDbContext(DbContextOptions<PropriumDbContext> options) : DbContext(options)
{
    public DbSet<PlatformMetadata> PlatformMetadata => Set<PlatformMetadata>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Role> Roles => Set<Role>();
    public DbSet<Permission> Permissions => Set<Permission>();
    public DbSet<UserRole> UserRoles => Set<UserRole>();
    public DbSet<RolePermission> RolePermissions => Set<RolePermission>();
    public DbSet<Session> Sessions => Set<Session>();
    public DbSet<AuthenticationEvent> AuthenticationEvents => Set<AuthenticationEvent>();
    public DbSet<Household> Households => Set<Household>();
    public DbSet<HouseholdMembership> HouseholdMemberships => Set<HouseholdMembership>();
    public DbSet<Bill> Bills => Set<Bill>();
    public DbSet<OutboxMessage> OutboxMessages => Set<OutboxMessage>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<PlatformMetadata>(entity =>
        {
            entity.ToTable("platform_metadata");
            entity.HasKey(metadata => metadata.Id);
            entity.Property(metadata => metadata.Key).HasMaxLength(128).IsRequired();
            entity.Property(metadata => metadata.Value).HasMaxLength(512).IsRequired();
            entity.HasIndex(metadata => metadata.Key).IsUnique();
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.ToTable("users", table => table.HasCheckConstraint("CK_users_security_version", "\"SecurityVersion\" > 0"));
            entity.HasKey(user => user.Id);
            entity.Property(user => user.Username).HasMaxLength(256).IsRequired();
            entity.Property(user => user.NormalizedUsername).HasMaxLength(256).IsRequired();
            entity.Property(user => user.DisplayName).HasMaxLength(256).IsRequired();
            entity.Property(user => user.PasswordHash).HasMaxLength(1024).IsRequired();
            entity.Property(user => user.SecurityVersion).HasDefaultValue(1L).IsConcurrencyToken();
            entity.HasIndex(user => user.NormalizedUsername).IsUnique();
        });
        modelBuilder.Entity<Role>(entity =>
        {
            entity.ToTable("roles"); entity.HasKey(role => role.Id);
            entity.Property(role => role.Name).HasMaxLength(128).IsRequired();
            entity.Property(role => role.NormalizedName).HasMaxLength(128).IsRequired();
            entity.Property(role => role.Description).HasMaxLength(512);
            entity.HasIndex(role => role.NormalizedName).IsUnique();
        });
        modelBuilder.Entity<Permission>(entity =>
        {
            entity.ToTable("permissions"); entity.HasKey(permission => permission.Id);
            entity.Property(permission => permission.Key).HasMaxLength(128).IsRequired();
            entity.Property(permission => permission.Description).HasMaxLength(512).IsRequired();
            entity.Property(permission => permission.CapabilityGroup).HasMaxLength(128).IsRequired();
            entity.HasIndex(permission => permission.Key).IsUnique();
        });
        modelBuilder.Entity<UserRole>(entity =>
        {
            entity.ToTable("user_roles"); entity.HasKey(item => new { item.UserId, item.RoleId });
            entity.HasOne(item => item.User).WithMany(user => user.Roles).HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Role).WithMany(role => role.Users).HasForeignKey(item => item.RoleId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<RolePermission>(entity =>
        {
            entity.ToTable("role_permissions"); entity.HasKey(item => new { item.RoleId, item.PermissionId });
            entity.HasOne(item => item.Role).WithMany(role => role.Permissions).HasForeignKey(item => item.RoleId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Permission).WithMany(permission => permission.Roles).HasForeignKey(item => item.PermissionId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Session>(entity =>
        {
            entity.ToTable("sessions", table => table.HasCheckConstraint("CK_sessions_security_version_snapshot", "\"SecurityVersionSnapshot\" > 0")); entity.HasKey(session => session.Id);
            entity.Property(session => session.TokenHash).HasMaxLength(128).IsRequired();
            entity.Property(session => session.SecurityVersionSnapshot).IsRequired();
            entity.Property(session => session.RevocationReason).HasMaxLength(128);
            entity.HasIndex(session => session.TokenHash).IsUnique();
            entity.HasIndex(session => new { session.UserId, session.RevokedAtUtc, session.ExpiresAtUtc });
            entity.HasIndex(session => session.ExpiresAtUtc);
            entity.HasOne(session => session.User).WithMany(user => user.Sessions).HasForeignKey(session => session.UserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<AuthenticationEvent>(entity =>
        {
            entity.ToTable("authentication_events"); entity.HasKey(item => item.Id);
            entity.Property(item => item.EventType).HasConversion<string>().HasMaxLength(64).IsRequired().Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.Outcome).HasConversion<string>().HasMaxLength(64).IsRequired().Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.OccurredAtUtc).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.UserId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.SessionId).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.NormalizedUsername).HasMaxLength(256).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.ReasonCode).HasMaxLength(128).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.CorrelationId).HasMaxLength(128).IsRequired().Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.Property(item => item.RequestMetadata).HasMaxLength(1024).Metadata.SetAfterSaveBehavior(PropertySaveBehavior.Throw);
            entity.HasIndex(item => item.OccurredAtUtc); entity.HasIndex(item => item.UserId); entity.HasIndex(item => item.SessionId);
            entity.HasIndex(item => item.EventType); entity.HasIndex(item => item.Outcome); entity.HasIndex(item => item.CorrelationId);
            entity.HasOne(item => item.User).WithMany(user => user.AuthenticationEvents).HasForeignKey(item => item.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasOne(item => item.Session).WithMany().HasForeignKey(item => item.SessionId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<Household>(entity =>
        {
            entity.ToTable("households"); entity.HasKey(household => household.Id);
            entity.Property(household => household.Name).HasMaxLength(256).IsRequired();
            entity.HasIndex(household => household.OwnerUserId);
            entity.HasOne<User>().WithMany().HasForeignKey(household => household.OwnerUserId).OnDelete(DeleteBehavior.Restrict);
        });
        modelBuilder.Entity<HouseholdMembership>(entity =>
        {
            entity.ToTable("household_memberships"); entity.HasKey(membership => new { membership.HouseholdId, membership.UserId });
            entity.HasOne(membership => membership.Household).WithMany(household => household.Members).HasForeignKey(membership => membership.HouseholdId).OnDelete(DeleteBehavior.Cascade);
            entity.HasOne<User>().WithMany().HasForeignKey(membership => membership.UserId).OnDelete(DeleteBehavior.Restrict);
            entity.HasIndex(membership => membership.UserId);
        });
        modelBuilder.Entity<Bill>(entity =>
        {
            entity.ToTable("bills", table => table.HasCheckConstraint("CK_bills_amount", "\"Amount\" >= 0")); entity.HasKey(bill => bill.Id);
            entity.Property(bill => bill.Name).HasMaxLength(256).IsRequired();
            entity.Property(bill => bill.Amount).HasPrecision(18, 2);
            entity.Property(bill => bill.Notes).HasMaxLength(1000);
            entity.Ignore(bill => bill.DomainEvents);
            entity.HasOne(bill => bill.Household).WithMany(household => household.Bills).HasForeignKey(bill => bill.HouseholdId).OnDelete(DeleteBehavior.Cascade);
            entity.HasIndex(bill => new { bill.HouseholdId, bill.DueDate });
        });
        modelBuilder.Entity<OutboxMessage>(entity =>
        {
            entity.ToTable("outbox_messages"); entity.HasKey(message => message.Id);
            entity.Property(message => message.EventType).HasMaxLength(200).IsRequired();
            entity.Property(message => message.PayloadJson).HasColumnType("jsonb").IsRequired();
            entity.Property(message => message.CorrelationId).HasMaxLength(128).IsRequired();
            entity.Property(message => message.LastError).HasMaxLength(2_000);
            entity.HasIndex(message => new { message.ProcessedAtUtc, message.CreatedAtUtc });
            entity.HasIndex(message => message.HouseholdId);
        });
    }
}
