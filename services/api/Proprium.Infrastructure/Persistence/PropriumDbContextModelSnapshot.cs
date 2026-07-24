using Microsoft.EntityFrameworkCore;
using Microsoft.EntityFrameworkCore.Infrastructure;
using Microsoft.EntityFrameworkCore.Metadata;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

namespace Proprium.Infrastructure.Persistence;

[DbContext(typeof(PropriumDbContext))]
public partial class PropriumDbContextModelSnapshot : ModelSnapshot
{
    protected override void BuildModel(ModelBuilder modelBuilder)
    {
#pragma warning disable 612, 618
        modelBuilder
            .HasAnnotation("ProductVersion", "9.0.0")
            .HasAnnotation("Relational:MaxIdentifierLength", 63);

        NpgsqlModelBuilderExtensions.UseIdentityByDefaultColumns(modelBuilder);

        modelBuilder.Entity("Proprium.Domain.PlatformMetadata", metadata =>
        {
            metadata.Property<Guid>("Id").ValueGeneratedOnAdd().HasColumnType("uuid");
            metadata.Property<DateTimeOffset>("CreatedAtUtc").HasColumnType("timestamp with time zone");
            metadata.Property<string>("Key").IsRequired().HasMaxLength(128).HasColumnType("character varying(128)");
            metadata.Property<string>("Value").IsRequired().HasMaxLength(512).HasColumnType("character varying(512)");
            metadata.HasKey("Id");
            metadata.HasIndex("Key").IsUnique();
            metadata.ToTable("platform_metadata", (string?)null);
        });
#pragma warning restore 612, 618
    }
}
