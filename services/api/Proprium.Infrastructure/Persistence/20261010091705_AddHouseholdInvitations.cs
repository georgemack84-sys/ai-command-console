using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

/// <inheritdoc />
public partial class AddHouseholdInvitations : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "household_invitations",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                InviterUserId = table.Column<Guid>(type: "uuid", nullable: false),
                TargetUserId = table.Column<Guid>(type: "uuid", nullable: false),
                Status = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                CreatedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ExpiresAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false),
                ResolvedAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: true)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_household_invitations", x => x.Id);
                table.ForeignKey(
                    name: "FK_household_invitations_households_HouseholdId",
                    column: x => x.HouseholdId,
                    principalTable: "households",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
                table.ForeignKey(
                    name: "FK_household_invitations_users_InviterUserId",
                    column: x => x.InviterUserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
                table.ForeignKey(
                    name: "FK_household_invitations_users_TargetUserId",
                    column: x => x.TargetUserId,
                    principalTable: "users",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Restrict);
            });

        migrationBuilder.CreateIndex(
            name: "IX_household_invitations_HouseholdId_TargetUserId_Status",
            table: "household_invitations",
            columns: ["HouseholdId", "TargetUserId", "Status"]);

        migrationBuilder.CreateIndex(
            name: "IX_household_invitations_InviterUserId",
            table: "household_invitations",
            column: "InviterUserId");

        migrationBuilder.CreateIndex(
            name: "IX_household_invitations_TargetUserId_Status_ExpiresAtUtc",
            table: "household_invitations",
            columns: ["TargetUserId", "Status", "ExpiresAtUtc"]);
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "household_invitations");
    }
}
