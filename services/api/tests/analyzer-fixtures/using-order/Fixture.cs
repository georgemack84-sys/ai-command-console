using System.Text;
using System.Globalization;

namespace AnalyzerFixture;

public static class Writer
{
    public static void Write()
    {
        Console.WriteLine(new StringBuilder(CultureInfo.InvariantCulture.Name));
    }
}
