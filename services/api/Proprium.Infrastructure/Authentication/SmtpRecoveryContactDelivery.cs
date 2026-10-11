using System.Net;
using System.Net.Mail;
using Microsoft.Extensions.Options;
using Proprium.Application.Authentication;
using Proprium.Infrastructure.Configuration;

namespace Proprium.Infrastructure.Authentication;

/// <summary>
/// Provider-neutral SMTP transport. It is registered only after startup has
/// validated every SMTP setting; failures deliberately do not expose tokens.
/// </summary>
public sealed class SmtpRecoveryContactDelivery(IOptions<RecoveryContactEmailOptions> options) : IRecoveryContactDelivery
{
    private readonly RecoveryContactEmailOptions options = options.Value;

    public async Task<bool> DeliverVerificationAsync(
        RecoveryContactVerificationDelivery delivery,
        CancellationToken cancellationToken = default)
    {
        return await DeliverAsync(delivery.Email, "Verify your Proprium recovery contact", $"Use this verification code to confirm your recovery contact:\n\n{delivery.Token.Value}\n\nThis code expires at {delivery.ExpiresAtUtc:O}. If you did not request this, you can ignore this email.", cancellationToken);
    }

    public Task<bool> DeliverPasswordResetAsync(PasswordResetDelivery delivery, CancellationToken cancellationToken = default)
    {
        if (!Uri.TryCreate(delivery.PublicApplicationOrigin, UriKind.Absolute, out var origin)) return Task.FromResult(false);
        var resetLink = new Uri(origin, $"/reset-password?token={Uri.EscapeDataString(delivery.Token.Value)}").AbsoluteUri;
        return DeliverAsync(delivery.Email, "Reset your Proprium password", $"Use this one-time link to reset your Proprium password:\n\n{resetLink}\n\nThis link expires at {delivery.ExpiresAtUtc:O}. If you did not request this, you can ignore this email.", cancellationToken);
    }

    private async Task<bool> DeliverAsync(string email, string subject, string body, CancellationToken cancellationToken)
    {
        var host = options.Host;
        var fromAddress = options.FromAddress;
        if (string.IsNullOrWhiteSpace(host) || string.IsNullOrWhiteSpace(fromAddress)) return false;
        try
        {
            using var message = new MailMessage { From = new MailAddress(fromAddress, options.FromDisplayName), Subject = subject, Body = body, IsBodyHtml = false };
            message.To.Add(email);
            using var client = new SmtpClient(host, options.Port) { DeliveryMethod = SmtpDeliveryMethod.Network, EnableSsl = true, UseDefaultCredentials = false, Credentials = new NetworkCredential(options.Username, options.Password) };
            await client.SendMailAsync(message, cancellationToken);
            return true;
        }
        catch (SmtpException) { return false; }
        catch (FormatException) { return false; }
    }
}
