namespace AnalyzerFixture;

public sealed class Counter
{
    private int _value;

    public Counter(int value)
    {
        _value = value;
    }

    public int Value => _value;
}
