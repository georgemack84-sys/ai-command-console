using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

/// <inheritdoc />
public partial class Week3IdentityFoundation : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "permissions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Key = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: false),
                CapabilityGroup = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_permissions", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "roles",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Name = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                NormalizedName = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                Description = table.Column<string>(type: "character varying(512)", maxLength: 512, nullable: true),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_roles", x => x.Id);
            });

        migrationBuilder.CreateTable(
            name: "users",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                Username = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                NormalizedUsername = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: false),
                PasswordHash = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: false),
                IsActive = table.Column<bool>(type: "boolean", nullable: false),
                SecurityVersion = table.Column<long>(type: "bigint", nullable: false, defaultValue: 1L),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_users", x => x.Id);
                table.CheckConstraint("CK_users_security_version", "\"SecurityVersion\" > 0");
            });

        migrationBuilder.CreateTable(
            name: "role_permissions",
            columns: table => new
            {
                RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                PermissionId = table.Column<Guid>(type: "uuid", nullable: false),
                AssignedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_role_permissions", x => new { x.RoleId, x.PermissionId });
                table.ForeignKey(
                    name: "FK_role_permissions_permissions_PermissionId",
                    column: x => x.PermissionId,
                    principalTable: "permissions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_role_permissions_roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "sessions",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                TokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                SecurityVersionSnapshot = table.Column<long>(type: "bigint", nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                RevokedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                LastUsedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                RevocationReason = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_sessions", x => x.Id);
                table.ForeignKey(
                    name: "FK_sessions_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "user_roles",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                RoleId = table.Column<Guid>(type: "uuid", nullable: false),
                AssignedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_user_roles", x => new { x.UserId, x.RoleId });
                table.ForeignKey(
                    name: "FK_user_roles_roles_RoleId",
                    column: x => x.RoleId,
                    principalTable: "roles",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_user_roles_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateTable(
            name: "authentication_events",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                EventType = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                Outcome = table.Column<string>(type: "character varying(64)", maxLength: 64, nullable: false),
                OccurredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                UserId = table.Column<Guid>(type: "uuid", nullable: true),
                SessionId = table.Column<Guid>(type: "uuid", nullable: true),
                NormalizedUsername = table.Column<string>(type: "character varying(256)", maxLength: 256, nullable: true),
                ReasonCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                CorrelationId = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                RequestMetadata = table.Column<string>(type: "character varying(1024)", maxLength: 1024, nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_authentication_events", x => x.Id);
                table.ForeignKey(
                    name: "FK_authentication_events_sessions_SessionId",
                    column: x => x.SessionId,
                    principalTable: "sessions",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_authentication_events_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_CorrelationId",
            table: "authentication_events",
            column: "CorrelationId");

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_EventType",
            table: "authentication_events",
            column: "EventType");

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_OccurredAtUtc",
            table: "authentication_events",
            column: "OccurredAtUtc");

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_Outcome",
            table: "authentication_events",
            column: "Outcome");

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_SessionId",
            table: "authentication_events",
            column: "SessionId");

        migrationBuilder.CreateIndex(
            name: "IX_authentication_events_UserId",
            table: "authentication_events",
            column: "UserId");

        migrationBuilder.CreateIndex(
            name: "IX_permissions_Key",
            table: "permissions",
            column: "Key",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_role_permissions_PermissionId",
            table: "role_permissions",
            column: "PermissionId");

        migrationBuilder.CreateIndex(
            name: "IX_roles_NormalizedName",
            table: "roles",
            column: "NormalizedName",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_sessions_ExpiresAtUtc",
            table: "sessions",
            column: "ExpiresAtUtc");

        migrationBuilder.CreateIndex(
            name: "IX_sessions_TokenHash",
            table: "sessions",
            column: "TokenHash",
            unique: true);

        migrationBuilder.CreateIndex(
            name: "IX_sessions_UserId_RevokedAtUtc_ExpiresAtUtc",
            table: "sessions",
            columns: new[] { "UserId", "RevokedAtUtc", "ExpiresAtUtc" });

        migrationBuilder.CreateIndex(
            name: "IX_user_roles_RoleId",
            table: "user_roles",
            column: "RoleId");

        migrationBuilder.CreateIndex(
            name: "IX_users_NormalizedUsername",
            table: "users",
            column: "NormalizedUsername",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "authentication_events");

        migrationBuilder.DropTable(
            name: "role_permissions");

        migrationBuilder.DropTable(
            name: "user_roles");

        migrationBuilder.DropTable(
            name: "sessions");

        migrationBuilder.DropTable(
            name: "permissions");

        migrationBuilder.DropTable(
            name: "roles");

        migrationBuilder.DropTable(
            name: "users");
    }
}
