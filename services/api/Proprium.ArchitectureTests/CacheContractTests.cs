using Proprium.Application.Caching;
using Xunit;

namespace Proprium.ArchitectureTests;

public sealed class CacheContractTests
{
    [Fact]
    public void Successful_read_requires_a_value()
    {
        Assert.Throws<ArgumentNullException>(() => CacheReadResult<string>.Success(null!));
        Assert.Equal("value", CacheReadResult<string>.Success("value").Value);
    }

    [Theory]
    [InlineData(CacheOperationStatus.Miss)]
    [InlineData(CacheOperationStatus.Unavailable)]
    [InlineData(CacheOperationStatus.SerializationFailure)]
    [InlineData(CacheOperationStatus.Cancelled)]
    public void Failed_read_has_default_value_and_distinct_status(CacheOperationStatus status)
    {
        var result = CacheReadResult<string>.Failure(status);
        Assert.Equal(status, result.Status);
        Assert.Null(result.Value);
    }

    [Fact]
    public void Success_cannot_be_constructed_as_a_failure() =>
        Assert.Throws<ArgumentOutOfRangeException>(() => CacheReadResult<string>.Failure(CacheOperationStatus.Success));
}
