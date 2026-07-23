namespace Proprium.Application.Authentication;

public interface ILoginSourceResolver { string Resolve(System.Net.IPAddress? address); }
