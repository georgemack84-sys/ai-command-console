using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

/// <inheritdoc />
public partial class AddHouseholdInvitationAuditEvents : Migration
{
    /// <inheritdoc />
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(
            name: "household_invitation_audit_events",
            columns: table => new
            {
                Id = table.Column<Guid>(type: "uuid", nullable: false),
                HouseholdId = table.Column<Guid>(type: "uuid", nullable: false),
                InvitationId = table.Column<Guid>(type: "uuid", nullable: true),
                ActorUserId = table.Column<Guid>(type: "uuid", nullable: false),
                TargetUserId = table.Column<Guid>(type: "uuid", nullable: true),
                Action = table.Column<string>(type: "character varying(32)", maxLength: 32, nullable: false),
                ReasonCode = table.Column<string>(type: "character varying(128)", maxLength: 128, nullable: false),
                OccurredAtUtc = table.Column<DateTimeOffset>(type: "timestamp with time zone", nullable: false)
            },
            constraints: table =>
            {
                table.PrimaryKey("PK_household_invitation_audit_events", x => x.Id);
                table.ForeignKey(
                    name: "FK_household_invitation_audit_events_households_HouseholdId",
                    column: x => x.HouseholdId,
                    principalTable: "households",
                    principalColumn: "Id",
                    onDelete: ReferentialAction.Cascade);
            });

        migrationBuilder.CreateIndex(
            name: "IX_household_invitation_audit_events_HouseholdId_OccurredAtUtc",
            table: "household_invitation_audit_events",
            columns: ["HouseholdId", "OccurredAtUtc"]);

        migrationBuilder.CreateIndex(
            name: "IX_household_invitation_audit_events_InvitationId",
            table: "household_invitation_audit_events",
            column: "InvitationId");
    }

    /// <inheritdoc />
    protected override void Down(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.DropTable(
            name: "household_invitation_audit_events");
    }
}
