using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Migrations;

namespace Proprium.Infrastructure.Persistence;

[DbContext(typeof(PropriumDbContext))]
[Migration("202607220001_InitialCreate")]
public partial class InitialCreate : Migration
{
    protected override void Up(MigrationBuilder migrationBuilder)
    {
        migrationBuilder.CreateTable(name: "platform_metadata", columns: table => new
        {
            Id = table.Column<Guid>(nullable: false),
            Key = table.Column<string>(maxLength: 128, nullable: false),
            Value = table.Column<string>(maxLength: 512, nullable: false),
            CreatedAtUtc = table.Column<DateTimeOffset>(nullable: false)
        }, constraints: table => table.PrimaryKey("PK_platform_metadata", item => item.Id));
        migrationBuilder.CreateIndex(name: "IX_platform_metadata_Key", table: "platform_metadata", column: "Key", unique: true);
    }
    protected override void Down(MigrationBuilder migrationBuilder) => migrationBuilder.DropTable(name: "platform_metadata");
}
