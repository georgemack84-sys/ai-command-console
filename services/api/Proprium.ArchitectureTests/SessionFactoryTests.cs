using Proprium.Domain.Identity;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class SessionFactoryTests
{
    [Fact]
    public void Session_snapshot_is_captured_from_the_current_user_security_version()
    {
        var user = new User { SecurityVersion = 7 };
        var createdAt = DateTimeOffset.UtcNow;
        var session = SessionFactory.Create(user, "digest", createdAt.AddHours(1), createdAt);

        Assert.Equal(user.Id, session.UserId);
        Assert.Equal(7, session.SecurityVersionSnapshot);
        Assert.Equal("digest", session.TokenHash);
    }

    [Fact]
    public void Invalid_token_digest_or_timestamp_contract_is_rejected()
    {
        var user = new User();
        var createdAt = DateTimeOffset.UtcNow;

        Assert.Throws<ArgumentException>(() => SessionFactory.Create(user, "", createdAt.AddHours(1), createdAt));
        Assert.Throws<ArgumentException>(() => SessionFactory.Create(user, "digest", createdAt, createdAt));
        Assert.Throws<ArgumentException>(() => SessionFactory.Create(user, "digest", createdAt.ToOffset(TimeSpan.FromHours(1)).AddHours(1), createdAt));
    }
}
