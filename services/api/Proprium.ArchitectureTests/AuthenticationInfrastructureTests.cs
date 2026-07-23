using Microsoft.AspNetCore.Identity;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Domain.Identity;
using Proprium.Infrastructure.Authentication;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class AuthenticationInfrastructureTests
{
    [Fact]
    public void Password_wrapper_maps_all_framework_outcomes()
    {
        var user = new User();
        var current = new UserPasswordHasher(new PasswordHasher<User>());
        var hash = current.Hash(user, "correct-password");
        Assert.Equal(PasswordVerificationOutcome.Success, current.Verify(user, hash, "correct-password"));
        Assert.Equal(PasswordVerificationOutcome.Failed, current.Verify(user, hash, "incorrect-password"));

        var outdated = new PasswordHasher<User>(Options.Create(new PasswordHasherOptions { IterationCount = 1_000 }));
        var rehashRequired = new UserPasswordHasher(new PasswordHasher<User>(Options.Create(new PasswordHasherOptions { IterationCount = 10_000 })));
        Assert.Equal(PasswordVerificationOutcome.SuccessRehashNeeded, rehashRequired.Verify(user, outdated.HashPassword(user, "correct-password"), "correct-password"));
    }

    [Fact]
    public void Generated_session_tokens_are_opaque_url_safe_and_hashed()
    {
        var generator = new SessionTokenGenerator(Enumerable.Range(0, 32).Select(item => (byte)item).ToArray());
        var first = generator.Generate();
        var second = generator.Generate();

        Assert.Equal(SessionTokenGenerator.EncodedLength, first.RawToken.Value.Length);
        Assert.True(generator.IsStructurallyValid(first.RawToken));
        Assert.Equal(first.Hash, generator.Hash(first.RawToken));
        Assert.NotEqual(first.RawToken.Value, first.Hash.Value);
        Assert.NotEqual(first.RawToken, second.RawToken);
        Assert.NotEqual(first.Hash, second.Hash);
    }
}
