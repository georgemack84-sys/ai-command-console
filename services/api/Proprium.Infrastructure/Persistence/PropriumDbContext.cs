using Microsoft.EntityFrameworkCore;
using Proprium.Domain;

namespace Proprium.Infrastructure.Persistence;

public sealed class PropriumDbContext(DbContextOptions<PropriumDbContext> options) : DbContext(options)
{
    public DbSet<PlatformMetadata> PlatformMetadata => Set<PlatformMetadata>();

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
    }
}
