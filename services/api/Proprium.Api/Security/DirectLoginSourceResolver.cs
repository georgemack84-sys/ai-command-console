using System.Net;
using Proprium.Application.Authentication;

namespace Proprium.Api.Security;

public sealed class DirectLoginSourceResolver : ILoginSourceResolver
{
    public string Resolve(IPAddress? address)
    {
        if (address is null) return "unknown";
        if (address.IsIPv4MappedToIPv6) address = address.MapToIPv4();
        return address.ToString();
    }
}
