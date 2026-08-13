#pragma warning disable CS1998 // The fixture proves one justified diagnostic can be suppressed narrowly.
await WorkAsync();

static async Task WorkAsync()
{
    string? value = null;
    Console.WriteLine(value.Length);
}
#pragma warning restore CS1998
