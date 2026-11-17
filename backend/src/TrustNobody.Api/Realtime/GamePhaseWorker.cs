using TrustNobody.Application.Games;

namespace TrustNobody.Api.Realtime;

/// <summary>Her saniye süresi dolmuş aşamaları bulur ve ilerletir (gece → gündüz → oylama → gece ...).</summary>
public sealed class GamePhaseWorker(IServiceScopeFactory scopes, ILogger<GamePhaseWorker> log) : BackgroundService
{
    protected override async Task ExecuteAsync(CancellationToken ct)
    {
        using var timer = new PeriodicTimer(TimeSpan.FromSeconds(1));
        while (await timer.WaitForNextTickAsync(ct))
        {
            try
            {
                IReadOnlyList<Guid> due;
                using (var scope = scopes.CreateScope())
                    due = await scope.ServiceProvider.GetRequiredService<GameService>().ListDueAsync(ct);

                foreach (var id in due)
                {
                    try
                    {
                        using var scope = scopes.CreateScope(); // her oyun için temiz DbContext
                        await scope.ServiceProvider.GetRequiredService<GameService>().AdvanceIfDueAsync(id, ct);
                    }
                    catch (Exception ex) when (ex is not OperationCanceledException)
                    {
                        log.LogError(ex, "Oyun {GameId} ilerletilirken hata", id);
                    }
                }
            }
            catch (OperationCanceledException) when (ct.IsCancellationRequested) { }
            catch (Exception ex)
            {
                log.LogError(ex, "Aşama kontrolü sırasında hata");
            }
        }
    }
}
