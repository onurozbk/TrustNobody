namespace TrustNobody.Domain.Common;

/// <summary>Hatanın türü. API katmanı bunu HTTP durum koduna çevirir.</summary>
public enum ErrorKind { Validation, Unauthorized, Forbidden, NotFound, Conflict }

/// <summary>Kullanıcıya gösterilebilecek iş kuralı hatası.</summary>
public class DomainException(string message, ErrorKind kind = ErrorKind.Validation) : Exception(message)
{
    public ErrorKind Kind { get; } = kind;

    public static DomainException NotFound(string message) => new(message, ErrorKind.NotFound);
    public static DomainException Forbidden(string message) => new(message, ErrorKind.Forbidden);
    public static DomainException Conflict(string message) => new(message, ErrorKind.Conflict);
    public static DomainException Unauthorized(string message) => new(message, ErrorKind.Unauthorized);
}
