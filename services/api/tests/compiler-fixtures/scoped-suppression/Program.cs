#pragma warning disable CS1998 // Permanent negative fixture; remove only with the scoped-suppression contract.
await WorkAsync();

static async Task WorkAsync()
{
    string? value = null;
    Console.WriteLine(value.Length);
}
#pragma warning restore CS1998
