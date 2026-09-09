using System.Net;
using System.Net.Http.Json;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Identity;
using Microsoft.AspNetCore.Mvc.Testing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Proprium.Contracts.V1;
using Proprium.Domain.Billing;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Events;
using Proprium.Infrastructure.Persistence;
using Xunit;

namespace Proprium.IntegrationTests;

[Trait("Category", "Integration")]
public sealed class RealtimeApiIntegrationTests(WebApplicationFactory<Program> factory) : IIntegrationTest, IClassFixture<WebApplicationFactory<Program>>
{
    [Fact]
    public async Task Authenticated_household_clients_receive_created_paid_and_unpaid_bill_events_over_sse()
    {
        var username = $"realtime-events-{Guid.NewGuid():N}";
        const string password = "correct-password";
        var (householdId, _) = await SeedHouseholdAsync(username, password);
        using var clientA = CreateAuthenticatedClient(); using var clientB = CreateAuthenticatedClient();
        await LoginAsync(clientA, username, password); await LoginAsync(clientB, username, password);
        using var request = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/events/stream?householdId={householdId}");
        using var response = await clientB.SendAsync(request, HttpCompletionOption.ResponseHeadersRead);
        using var reader = new StreamReader(await response.Content.ReadAsStreamAsync());
        await reader.ReadLineAsync(); await reader.ReadLineAsync();
        var created = await clientA.PostAsJsonAsync($"/api/v1/households/{householdId}/bills", new CreateBillRequest("Water", 55m, new DateOnly(2026, 10, 10), null));
        var bill = await created.Content.ReadFromJsonAsync<BillResponse>(); Assert.Equal(HttpStatusCode.Created, created.StatusCode);
        var processor = factory.Services.GetServices<IHostedService>().OfType<OutboxProcessor>().Single();
        await processor.ProcessPendingAsync();
        await AssertEventAsync(reader, "proprium.bill.created.v1");
        await clientA.PatchAsJsonAsync($"/api/v1/households/{householdId}/bills/{bill!.Id}/payment-status", new SetBillPaymentStatusRequest("Paid"));
        await processor.ProcessPendingAsync(); await AssertEventAsync(reader, "proprium.bill.paid.v1");
        await clientA.PatchAsJsonAsync($"/api/v1/households/{householdId}/bills/{bill.Id}/payment-status", new SetBillPaymentStatusRequest("Unpaid"));
        await processor.ProcessPendingAsync(); await AssertEventAsync(reader, "proprium.bill.unpaid.v1");
    }

    private static async Task AssertEventAsync(StreamReader reader, string eventType)
    {
        Assert.StartsWith("id: ", await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));
        Assert.Equal($"event: {eventType}", await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));
        await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)); await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5));
    }

    [Fact]
    public async Task Authenticated_household_member_can_list_only_its_bill_read_model()
    {
        var username = $"bill-query-{Guid.NewGuid():N}";
        var (householdId, billId) = await SeedHouseholdAsync(username, "correct-password");
        using var client = CreateAuthenticatedClient();
        await LoginAsync(client, username, "correct-password");

        var response = await client.GetAsync($"/api/v1/households/{householdId}/bills");
        var bills = await response.Content.ReadFromJsonAsync<BillResponse[]>();

        Assert.Equal(HttpStatusCode.OK, response.StatusCode);
        Assert.Contains(bills ?? [], bill => bill.Id == billId);
    }

    [Fact]
    public async Task Authenticated_household_clients_receive_a_committed_bill_update_over_sse()
    {
        var username = $"realtime-{Guid.NewGuid():N}";
        const string password = "correct-password";
        var (householdId, billId) = await SeedHouseholdAsync(username, password);
        using var clientA = CreateAuthenticatedClient();
        using var clientB = CreateAuthenticatedClient();
        await LoginAsync(clientA, username, password);
        await LoginAsync(clientB, username, password);

        using var streamRequest = new HttpRequestMessage(HttpMethod.Get, $"/api/v1/events/stream?householdId={householdId}");
        using var streamResponse = await clientB.SendAsync(streamRequest, HttpCompletionOption.ResponseHeadersRead);
        Assert.Equal(HttpStatusCode.OK, streamResponse.StatusCode);
        await using var stream = await streamResponse.Content.ReadAsStreamAsync();
        using var reader = new StreamReader(stream);
        Assert.Equal(": connected", await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));
        Assert.Equal(string.Empty, await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));

        var update = await clientA.PatchAsJsonAsync($"/api/v1/households/{householdId}/bills/{billId}", new UpdateBillRequest(229.00m, new DateOnly(2026, 10, 9), "Updated plan"));
        Assert.Equal(HttpStatusCode.OK, update.StatusCode);
        var processor = factory.Services.GetServices<IHostedService>().OfType<OutboxProcessor>().Single();
        await processor.ProcessPendingAsync();

        Assert.StartsWith("id: ", await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));
        Assert.Equal("event: proprium.bill.updated.v1", await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5)));
        var data = await reader.ReadLineAsync().WaitAsync(TimeSpan.FromSeconds(5));
        Assert.Contains(billId.ToString(), data, StringComparison.Ordinal);
    }

    private HttpClient CreateAuthenticatedClient()
    {
        var client = factory.CreateClient(new WebApplicationFactoryClientOptions { HandleCookies = true });
        client.DefaultRequestHeaders.Add("Origin", Environment.GetEnvironmentVariable("AUTH_ALLOWED_ORIGIN") ?? "http://localhost:3000");
        client.DefaultRequestHeaders.Add("X-Proprium-CSRF", "1");
        return client;
    }

    private static async Task LoginAsync(HttpClient client, string username, string password)
    {
        var response = await client.PostAsJsonAsync("/api/v1/auth/login", new LoginRequest(username, password));
        Assert.Equal(HttpStatusCode.NoContent, response.StatusCode);
    }

    private static async Task<(Guid HouseholdId, Guid BillId)> SeedHouseholdAsync(string username, string password)
    {
        await using var database = CreateContext();
        var user = new User { Username = username, NormalizedUsername = username.ToUpperInvariant(), DisplayName = "Realtime User" };
        user.PasswordHash = new PasswordHasher<User>().HashPassword(user, password);
        var household = new Household { OwnerUserId = user.Id, Name = "Realtime household" };
        var bill = new Bill { HouseholdId = household.Id, Name = "Internet" };
        database.AddRange(user, household, new HouseholdMembership { HouseholdId = household.Id, UserId = user.Id }, bill);
        await database.SaveChangesAsync();
        return (household.Id, bill.Id);
    }

    private static PropriumDbContext CreateContext()
    {
        var connection = $"Host={Environment.GetEnvironmentVariable("POSTGRES_HOST") ?? "localhost"};Port={Environment.GetEnvironmentVariable("POSTGRES_PORT") ?? "55432"};Database={Environment.GetEnvironmentVariable("POSTGRES_DATABASE") ?? "proprium"};Username={Environment.GetEnvironmentVariable("POSTGRES_USER") ?? "proprium"};Password={Environment.GetEnvironmentVariable("POSTGRES_PASSWORD") ?? "change-me"}";
        return new PropriumDbContext(new DbContextOptionsBuilder<PropriumDbContext>().UseNpgsql(connection).Options);
    }
}
