# 🧛 TrustNobody

Arkadaşlarla aynı masada, yüz yüze oynanan vampir-köylü oyunu. Ayrı bir anlatıcıya gerek yok: rolleri dağıtmak, geceleri yönetmek, oyları saymak ve ölenleri duyurmak uygulamanın işi. Odayı kuran kişi dahil **herkes oyuncu**.

| Katman | Teknoloji |
|---|---|
| Frontend | Expo (SDK 58) + Expo Router + TypeScript. Web'e statik olarak export edilir, aynı kod iOS/Android'de de çalışır |
| Backend | .NET 10 Minimal API, katmanlı mimari (Domain / Application / Infrastructure / Api) |
| Veritabanı | PostgreSQL 17, EF Core + migrations, snake_case şema |
| Canlı güncelleme | SignalR (WebSocket) |
| Kimlik | İsteğe bağlı kayıt (e-posta + kullanıcı adı + şifre) ya da takma adla misafir girişi, JWT |
| Deploy | Docker Compose: `db` + `api` + `web` (nginx: statik dosyalar + `/api`, `/hubs` proxy) |

## Proje yapısı

```
trustnobody/
├─ docker-compose.yml
├─ backend/
│  ├─ TrustNobody.slnx
│  ├─ src/
│  │  ├─ TrustNobody.Domain/          Oyun kuralları, saf C# (EF'ye ve web'e bağımlı değil)
│  │  │  ├─ Games/Game.cs             Aggregate: lobi, rol dağıtımı, gece/gündüz/oylama, kazanma
│  │  │  └─ Users/User.cs
│  │  ├─ TrustNobody.Application/     Kullanım senaryoları (AuthService, GameService), DTO'lar,
│  │  │                               oyuncuya özel görünüm (GameViewBuilder), arayüzler
│  │  ├─ TrustNobody.Infrastructure/  EF Core + Npgsql, repository'ler, migrations, JWT, şifre hash
│  │  └─ TrustNobody.Api/             Endpoint'ler, SignalR hub, aşama zamanlayıcısı, hata yönetimi
│  └─ tests/TrustNobody.Domain.Tests/ Oyun kuralları için birim testleri (xUnit)
└─ frontend/
   └─ src/
      ├─ app/                         Ekranlar (Expo Router, dosya = rota)
      │  ├─ login.tsx, register.tsx
      │  ├─ join/[code].tsx           Davet linki: /join/ABC123
      │  └─ (app)/                    Giriş gerektiren ekranlar: home, create, game/[code]
      ├─ api/                         HTTP istemcisi, endpoint'ler, tipler
      ├─ auth/AuthContext.tsx         Oturum (mobilde SecureStore, web'de localStorage)
      ├─ hooks/                       useGame (veri + SignalR), useCountdown
      ├─ components/                  UI bileşenleri, oyun parçaları
      └─ lib/                         config, realtime, paylaşım/onay yardımcıları
```

Bağımlılık yönü: `Api → Infrastructure → Application → Domain`. Domain hiçbir şeye bağımlı değil. Saat ve rastgelelik dışarıdan verildiği için kurallar veritabanı olmadan test ediliyor.

## Geliştirme

Gerekenler: .NET 10 SDK, Node 22+, Docker.

```bash
# 1) PostgreSQL
docker compose up -d db

# 2) API: http://localhost:5080. Migration'lar açılışta otomatik uygulanır
cd backend
dotnet run --project src/TrustNobody.Api

# 3) Frontend: http://localhost:8081
cd frontend
npm install
npm run web          # ya da: npx expo start (telefonda Expo Go ile)
```

- Frontend API adresini `frontend/.env.development` dosyasındaki `EXPO_PUBLIC_API_URL` değerinden alır. Telefondan denemek için bunu bilgisayarın yerel IP'si yapın (ör. `http://192.168.1.20:5080`) ve `backend/.../appsettings.Development.json` içindeki `Cors:Origins` listesine Expo adresini ekleyin.
- Makinede 5432 portu doluysa: `DB_PORT=5433 docker compose up -d db` ve API'yi `ConnectionStrings__Default="Host=localhost;Port=5433;..."` ile çalıştırın.

```bash
cd backend && dotnet test                 # domain testleri
cd frontend && npm run typecheck && npm run lint
```

### Veritabanı şemasını değiştirmek

```bash
cd backend
dotnet ef migrations add <Isim> -p src/TrustNobody.Infrastructure -s src/TrustNobody.Api -o Persistence/Migrations
```

Tablolar: `users`, `games` (ayarlar `settings_*` kolonlarında), `game_players`, `game_actions`, `game_events`.

## Web'e deploy

```bash
cp .env.example .env        # JWT_KEY'i doldurun (openssl rand -base64 48)
docker compose up -d --build
```

Uygulama `http://sunucu:8080` adresinde açılır. nginx statik Expo çıktısını sunar, `/api` ve `/hubs` (WebSocket) isteklerini API'ye yönlendirir. Böylece tarayıcı tek origin görür ve CORS gerekmez. Önüne HTTPS için Caddy, Traefik ya da bir bulut load balancer koyun. `X-Forwarded-*` başlıkları destekleniyor.

Frontend'i ayrı bir statik hosting'e (Netlify, Vercel, Cloudflare Pages) koymak isterseniz:
`EXPO_PUBLIC_API_URL=https://api.example.com npx expo export -p web` komutunu çalıştırıp `dist/` klasörünü yükleyin, tüm yolları `/index.html`'e yönlendirin ve API'de `Cors__Origins__0=https://site.example.com` ayarını yapın.

Önemli ayarlar (ortam değişkeni olarak): `ConnectionStrings__Default`, `Jwt__Key` (en az 32 karakter, yoksa API açılmaz), `Cors__Origins__N`, `RateLimiting__AuthPermitPerMinute`, `Database__MigrateOnStartup`.

## Oyun akışı

1. **Hesap (isteğe bağlı):** kayıt olmak zorunlu değil. Sadece bir takma adla **misafir** olarak oda kurulabilir ya da odaya katılınabilir. İsteyen e-posta + kullanıcı adı + şifre ile kayıt olur, girişte e-posta ya da kullanıcı adı kullanılabilir. Misafir oturumu cihazda saklanır; çıkış yapılırsa o hesaba tekrar girilemez.
2. **Oda kur:** kuran kişi yönetici olur ama herkes gibi oynar ve rolü de rastgele gelir. Seçebildikleri: en fazla oyuncu, vampir sayısı, doktor/kahin, gece/tartışma/oylama süreleri, ölenin rolü açıklansın mı.
3. **Davet:** lobide 6 haneli kod ve **davet linki** (`/join/KOD`) paylaşılır. Linke tıklayan kişi giriş yapmamışsa takma adını yazıp tek tıkla katılır. İsterse giriş yapabilir ya da kayıt olabilir; o durumda da işlem bitince otomatik olarak odaya döner. Odada aynı isim varsa sonuna sayı eklenir (`Ali`, `Ali (2)`).
4. **Başlat:** roller kriptografik rastgelelikle dağıtılır. Rol kartı gizli durur, dokununca 5 saniye görünür. Vampirler birbirini görür.
5. **🌙 Gece:** vampirler kurban seçer, doktor birini korur, kahin birine bakar. Herkes seçim yapınca gece erken biter.
6. **☀️ Gündüz:** ölen kişi duyurulur ve yüz yüze tartışılır. Süre bitince ya da hayattakilerin yarısından fazlası "hazırım" deyince oylama başlar.
7. **🗳️ Oylama:** en çok oyu alan asılır. Oylar eşitse ya da pas sayısı fazlaysa kimse asılmaz.
8. **Kazanma:** tüm vampirler ölürse köylüler, vampirler diğerlerine eşit ya da fazla olursa vampirler kazanır. Yönetici aynı oyuncularla tekrar başlatabilir.

Yönetici aşamaları elle geçiremez (vampir çıkarsa haksız avantaj olurdu). Oyun sırasında sadece masadan kalkan birini eleyebilir ve oyunu sonlandırabilir.

## Mimari notlar

- **Hileye karşı:** SignalR yalnızca `changed` sinyali yollar. Her istemci kendi görünümünü `GET /api/games/{code}` ile çeker ve sunucu sadece o oyuncunun görmesi gereken bilgiyi döner. Roller hiçbir zaman toplu olarak istemciye gitmez.
- **Eşzamanlılık:** her oyun değişikliği bir transaction içinde `SELECT … FOR UPDATE` ile oyun satırını kilitler. Birden fazla API örneği çalışsa bile güvenlidir. Birden fazla örnekte SignalR için Redis backplane eklenmelidir.
- **Zamanlayıcı:** `GamePhaseWorker` her saniye süresi dolan aşamaları ilerletir.
- **Güvenlik:** şifreler ASP.NET Core Identity PBKDF2 ile hash'lenir. Giriş ve kayıt IP başına dakikada 10 istekle sınırlıdır.

## API

| Metot | Yol | Açıklama |
|---|---|---|
| POST | `/api/auth/register` | `{email, username, password}` → `{token, expiresAt, user}` |
| POST | `/api/auth/login` | `{login, password}` (login = e-posta veya kullanıcı adı) |
| POST | `/api/auth/guest` | `{displayName}` → kayıtsız misafir oturumu |
| GET | `/api/auth/me` | Oturumdaki kullanıcı |
| POST | `/api/games` | Oda oluştur (ayarlar) → `{code}` |
| GET | `/api/games/mine` | Devam eden oyunlarım |
| GET | `/api/games/{code}` | Bana özel oyun görünümü |
| POST | `/api/games/{code}/join` · `/leave` | Katıl / ayrıl |
| POST | `/api/games/{code}/action` | `{targetId}`: gece hamlesi ya da oy (`null` = pas) |
| POST | `/api/games/{code}/ready` | Gündüz "oylamaya hazırım" (aç/kapa) |
| PUT | `/api/games/{code}/settings` | Ayarlar (yönetici, lobide) |
| POST | `/api/games/{code}/start` · `/abort` · `/rematch` | Yönetici kontrolleri |
| POST | `/api/games/{code}/kick/{playerId}` | Lobide çıkar, oyunda ele (yönetici) |
| GET | `/health` | Sağlık kontrolü |
| WS | `/hubs/game` | SignalR: `JoinGame(code)` → `changed` |

Geliştirme ortamında OpenAPI şeması: `http://localhost:5080/openapi/v1.json`
