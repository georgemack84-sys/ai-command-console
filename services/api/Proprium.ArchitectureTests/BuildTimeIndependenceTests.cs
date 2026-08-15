using Microsoft.Extensions.DependencyInjection;
using Microsoft.EntityFrameworkCore;
using Npgsql;
using Proprium.Infrastructure;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.ArchitectureTests;

[Trait("Category", "Unit")]
public sealed class BuildTimeIndependenceTests
{
    [Fact]
    public void Infrastructure_registration_and_container_construction_do_not_activate_clients()
    {
        var services = new ServiceCollection();

        services.AddPropriumInfrastructure();
        using var provider = services.BuildServiceProvider();

        Assert.NotNull(provider);
    }

    [Fact]
    public void Ef_design_time_model_uses_an_inert_synthetic_connection()
    {
        using var database = new PropriumDbContextFactory().CreateDbContext([]);
        var connection = Assert.IsType<NpgsqlConnection>(database.Database.GetDbConnection());
        var settings = new NpgsqlConnectionStringBuilder(connection.ConnectionString);

        Assert.EndsWith(".invalid", settings.Host, StringComparison.Ordinal);
        Assert.Equal(System.Data.ConnectionState.Closed, connection.State);
        Assert.NotEmpty(database.Model.GetEntityTypes());
        Assert.Equal(System.Data.ConnectionState.Closed, connection.State);
    }
}
