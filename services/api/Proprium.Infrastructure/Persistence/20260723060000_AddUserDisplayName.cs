using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace Proprium.Infrastructure.Persistence;

[DbContext(typeof(PropriumDbContext))]
[Migration("20260723060000_AddUserDisplayName")]
public partial class AddUserDisplayName : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.AddColumn<string>(
            name: "DisplayName",
            table: "users",
            type: "character varying(256)",
            maxLength: 256,
            nullable: false,
            defaultValue: string.Empty);

        migrationBuilder.Sql("UPDATE users SET \"DisplayName\" = \"Username\" WHERE \"DisplayName\" = '';");

        migrationBuilder.AlterColumn<string>(
            name: "DisplayName",
            table: "users",
            type: "character varying(256)",
            maxLength: 256,
            nullable: false,
            oldClrType: typeof(string),
            oldType: "character varying(256)",
            oldMaxLength: 256,
            oldDefaultValue: string.Empty);
    }

    protected override void Down(MigrationBuilder migrationBuilder) =>
        migrationBuilder.DropColumn(name: "DisplayName", table: "users");
}
