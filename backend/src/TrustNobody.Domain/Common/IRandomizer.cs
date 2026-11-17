using System.Security.Cryptography;

namespace TrustNobody.Domain.Common;

/// <summary>Rastgelelik soyutlaması: üretimde kriptografik, testlerde deterministik.</summary>
public interface IRandomizer
{
    /// <summary>[0, maxExclusive) aralığında sayı.</summary>
    int Next(int maxExclusive);

    void Shuffle<T>(Span<T> items);
}

public sealed class CryptoRandomizer : IRandomizer
{
    public static readonly CryptoRandomizer Instance = new();

    public int Next(int maxExclusive) => RandomNumberGenerator.GetInt32(maxExclusive);

    public void Shuffle<T>(Span<T> items) => RandomNumberGenerator.Shuffle(items);
}
