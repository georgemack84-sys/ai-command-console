using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

/// <inheritdoc />
public partial class AddRecoveryContacts : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "recovery_contacts",
            columns: table => new
            {
                UserId = table.Column<Guid>(type: "uuid", nullable: false),
                Email = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                NormalizedEmail = table.Column<string>(type: "character varying(320)", maxLength: 320, nullable: false),
                VerificationTokenHash = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: true),
                VerificationExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                VerifiedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true),
                UpdatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_recovery_contacts", x => x.UserId);
                table.ForeignKey(
                    name: "FK_recovery_contacts_users_UserId",
                    column: x => x.UserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_recovery_contacts_NormalizedEmail",
            table: "recovery_contacts",
            column: "NormalizedEmail",
            unique: true);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "recovery_contacts");
    }
}
