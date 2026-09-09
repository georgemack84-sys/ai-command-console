using System.Reflection;
using Proprium.Infrastructure.Retry;

namespace Proprium.ArchitectureTests;

internal sealed record ArchitectureException(
    string Rule,
    string Type,
    string Reason,
    string ApprovedBy,
    DateOnly CreatedOn,
    DateOnly ExpiresOn);

internal static class ArchitectureExceptionRegistry
{
    // Add only a type-specific, time-bounded exception that has received architecture approval.
    internal static IReadOnlyList<ArchitectureException> All { get; } =
    [
        new(
            "ARCH-005",
            typeof(RetryExecutor).FullName ?? throw new InvalidOperationException("RetryExecutor must have a full name."),
            "Retry execution creates a fresh scope for each database attempt; the exact owner is protected by ARCH-005 tests.",
            "George",
            new DateOnly(2026, 9, 6),
            new DateOnly(2026, 12, 5)),
        new(
            "ARCH-006",
            typeof(RetryExecutor).FullName ?? throw new InvalidOperationException("RetryExecutor must have a full name."),
            "Retry execution exposes IServiceScopeFactory only to create a fresh scope for each database attempt.",
            "George",
            new DateOnly(2026, 9, 6),
            new DateOnly(2026, 12, 5)),
    ];

    internal static IReadOnlySet<Type> ApprovedTypes(string rule, IEnumerable<Assembly> assemblies) =>
        All.Where(exception => exception.Rule == rule)
            .Select(exception => assemblies.Select(assembly => assembly.GetType(exception.Type, throwOnError: false))
                .SingleOrDefault(type => type is not null) ??
                throw new InvalidOperationException($"{exception.Rule} exception type {exception.Type} was not found in a production assembly."))
            .ToHashSet();

    internal static string[] Violations(IEnumerable<ArchitectureException> exceptions, DateOnly today) =>
        exceptions
            .Where(exception => !exception.Rule.StartsWith("ARCH-", StringComparison.Ordinal) ||
                string.IsNullOrWhiteSpace(exception.Type) || exception.Type.Contains('*') ||
                string.IsNullOrWhiteSpace(exception.Reason) || string.IsNullOrWhiteSpace(exception.ApprovedBy) ||
                exception.CreatedOn > today || exception.ExpiresOn < today || exception.ExpiresOn < exception.CreatedOn)
            .Select(exception => $"{exception.Rule} / {exception.Type} must include a specific type, reason, approver, valid creation date, and non-expired date.")
            .ToArray();
}
