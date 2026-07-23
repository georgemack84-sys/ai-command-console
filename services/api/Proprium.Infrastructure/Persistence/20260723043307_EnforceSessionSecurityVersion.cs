using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

/// <inheritdoc />
public partial class EnforceSessionSecurityVersion : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddCheckConstraint(
            name: "CK_sessions_security_version_snapshot",
            table: "sessions",
            sql: "\"SecurityVersionSnapshot\" > 0");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropCheckConstraint(
            name: "CK_sessions_security_version_snapshot",
            table: "sessions");
    }
}
