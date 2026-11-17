# TrustNobody API. Build context: backend/
#   docker build -t trustnobody-api backend

FROM mcr.microsoft.com/dotnet/sdk:10.0 AS build
WORKDIR /src

# Önce sadece proje dosyaları: kod değişse de restore katmanı önbellekten gelir
COPY TrustNobody.slnx ./
COPY src/TrustNobody.Domain/TrustNobody.Domain.csproj src/TrustNobody.Domain/
COPY src/TrustNobody.Application/TrustNobody.Application.csproj src/TrustNobody.Application/
COPY src/TrustNobody.Infrastructure/TrustNobody.Infrastructure.csproj src/TrustNobody.Infrastructure/
COPY src/TrustNobody.Api/TrustNobody.Api.csproj src/TrustNobody.Api/
RUN dotnet restore src/TrustNobody.Api/TrustNobody.Api.csproj

COPY src/ src/
RUN dotnet publish src/TrustNobody.Api/TrustNobody.Api.csproj -c Release -o /app --no-restore -p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:10.0 AS runtime
# tzdata: TZ=Europe/Istanbul için. libgssapi-krb5-2: Npgsql açılışta arar; yoksa her başlangıçta zararsız ama gürültülü bir hata loglar.
RUN apt-get update \
    && apt-get install -y --no-install-recommends tzdata libgssapi-krb5-2 \
    && rm -rf /var/lib/apt/lists/*
WORKDIR /app
COPY --from=build /app .
ENV ASPNETCORE_HTTP_PORTS=8080 \
    ASPNETCORE_ENVIRONMENT=Production \
    DOTNET_gcServer=0
EXPOSE 8080
USER $APP_UID
ENTRYPOINT ["dotnet", "TrustNobody.Api.dll"]
