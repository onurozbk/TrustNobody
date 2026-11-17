# Deploy: k3s + Argo CD + GitHub Actions

TrustNobody, tesekkur.co ve birikim ile **aynı VDS'te**, aynı k3s ve Argo CD üzerinde çalışır. Ama **ayrı bir namespace (`trustnobody`) ve ayrı bir Argo CD projesi/uygulaması** olarak.

```
Actions → Deploy → Run workflow (elle)
      │
      ├─► ghcr.io/onurozbk/trustnobody-api:<sha>
      ├─► ghcr.io/onurozbk/trustnobody-web:<sha>
      │
      └─► deploy/apps/{api,web}/kustomization.yaml (newTag=<sha>) commit
                                   │
                 Argo CD (VDS) ◄───┘  repoyu izler, k3s'e uygular
```

**Trafik:** `trustnobody.tesekkur.co` → Traefik →
- `/api/*` → `trustnobody-api:8080` (.NET REST)
- `/hubs/*` → `trustnobody-api:8080` (SignalR WebSocket)
- geri kalan her şey → `trustnobody-web` (nginx, Expo web statik dosyaları)

PostgreSQL bu repoda **yönetilmez**. birikim'deki gibi ayrı repo/Argo CD uygulamasındaki PostgreSQL kullanılır. API'ye bağlantı bilgisi yalnızca `trustnobody-api-secrets` içindeki `ConnectionStrings__Default` ile verilir.

## Diğer uygulamalarla ayrım

| | tesekkurco | birikim | trustnobody |
|---|---|---|---|
| Namespace | `tesekkurco` | `birikim` | `trustnobody` |
| Argo CD projesi | `tesekkurco` | `birikim` | `trustnobody` (yalnızca bu repo + `trustnobody` namespace'i, cluster kaynağı yok) |
| Traefik / Let's Encrypt ayarı | **burada** | yok | yok. Aynı `letsencrypt` resolver'ını kullanır |
| Middleware | `tesekkurco-redirect-https` | `birikim-redirect-https` | `trustnobody-redirect-https` |
| GHCR pull secret | `tesekkurco/ghcr-pull` | `birikim/ghcr-pull` | `trustnobody/ghcr-pull` (secret'lar namespace'e özeldir) |

> Traefik ayarı (HelmChartConfig) cluster'da tektir. Onu tesekkurco reposu yönetir; buraya **kopyalama**.

## Klasör yapısı

| Yol | İçerik |
|---|---|
| `argocd/project.yaml` | Argo CD projesi (bir kez elle uygulanır) |
| `argocd/trustnobody.yaml` | Argo CD uygulaması → `deploy/kustomization.yaml` (bir kez elle uygulanır) |
| `kustomization.yaml` | Uygulamanın içeriği; namespace burada `trustnobody` olarak sabitlenir |
| `platform/` | http→https middleware'i |
| `apps/api/` | .NET API: Deployment, Service, ConfigMap |
| `apps/web/` | nginx + Expo web: Deployment, Service, Ingress |

## İlk kurulum (bir kez)

k3s ve Argo CD zaten kurulu olduğundan yalnızca trustnobody'ye özel adımlar var.

### 1. DNS
`trustnobody.tesekkur.co` için VDS IP'sine bir **A kaydı** ekle. Cloudflare proxy kullanıyorsan SSL modu Full (strict) olmalı; tesekkur.co ile aynı. Cloudflare'de **WebSockets** açık olmalı (varsayılan açık); SignalR buna ihtiyaç duyar.

### 2. Veritabanı
Ortak PostgreSQL'de bu uygulamaya ayrı bir kullanıcı ve veritabanı aç (PostgreSQL'i yöneten repodaki yönteme göre), ör.:
```sql
CREATE USER trustnobody WITH PASSWORD '<güçlü-şifre>';
CREATE DATABASE trustnobody OWNER trustnobody;
```
Tabloları API ilk açılışta kendisi oluşturur (`Database__MigrateOnStartup=true`).

### 3. Argo CD'ye repoyu tanıt (repo private ise)
```bash
kubectl -n argocd create secret generic repo-trustnobody \
  --from-literal=type=git \
  --from-literal=url=https://github.com/onurozbk/TrustNobody.git \
  --from-literal=username=x-access-token \
  --from-literal=password=<GitHub fine-grained PAT: yalnızca onurozbk/TrustNobody, Contents: Read>
kubectl -n argocd label secret repo-trustnobody argocd.argoproj.io/secret-type=repository
```

### 4. Namespace ve secret'lar (repoya girmez)
```bash
kubectl create namespace trustnobody

# GHCR'dan image çekmek için (classic PAT: read:packages)
kubectl -n trustnobody create secret docker-registry ghcr-pull \
  --docker-server=ghcr.io --docker-username=onurozbk --docker-password=<PAT>

# API secret'ları: anahtar adları .NET config yolları (":" yerine "__")
kubectl -n trustnobody create secret generic trustnobody-api-secrets \
  --from-literal=ConnectionStrings__Default="Host=<postgres-host>;Port=5432;Database=trustnobody;Username=trustnobody;Password=<şifre>" \
  --from-literal=Jwt__Key="$(openssl rand -base64 48)"
```
- `<postgres-host>`: birikim'in `ConnectionStrings__Birikim` değerindeki host'un aynısı (ör. `postgres.<namespace>.svc.cluster.local`). Bakmak için:
  `kubectl -n birikim get secret birikim-api-secrets -o jsonpath='{.data.ConnectionStrings__Birikim}' | base64 -d`
- `Jwt__Key` yoksa ya da 32 karakterden kısaysa API hiç başlamaz.
- `Jwt__Key` değişirse herkesin oturumu düşer. Misafir hesaplar da geri gelmez.
- Bir secret'ı güncelledikten sonra: `kubectl -n trustnobody rollout restart deploy/trustnobody-api`

### 5. GitHub
- Repo → Settings → Actions → General → Workflow permissions: **Read and write** (workflow manifest'e tag commit'liyor).
- `main` için branch protection varsa `github-actions[bot]`'un push yapmasına izin ver.
- **Actions → Deploy → Run workflow** ile ilk build'i al. Bitince GHCR'da `trustnobody-api` ve `trustnobody-web` paketleri oluşur: Package settings → Manage Actions access → repoyu bağla.

### 6. Argo CD'yi başlat
İlk deploy workflow'u bittikten sonra (image'lar GHCR'da olmalı):
```bash
kubectl apply -f deploy/argocd/project.yaml -f deploy/argocd/trustnobody.yaml
```
- Argo CD API'yi, web'i ve Ingress'i kurar.
- Traefik birkaç dakika içinde `trustnobody.tesekkur.co` için sertifika alır: `kubectl -n kube-system logs deploy/traefik | grep -i acme`

## Günlük kullanım

- **Deploy:** Actions → Deploy → Run workflow. Yaklaşık 3-5 dakikada canlıya çıkar. İstersen önce Actions → CI ile testleri çalıştır.
  Her `main` push'unda otomatik deploy istersen `.github/workflows/deploy.yml` başındaki yorumdaki `push:` tetikleyicisini ekle.
- **Durum:** Argo CD arayüzü ya da `kubectl -n trustnobody get pods`
- **Log:** `kubectl -n trustnobody logs deploy/trustnobody-api -f` / `kubectl -n trustnobody logs deploy/trustnobody-web -f`
- **Sağlık:** web `GET /healthz`, api `GET /health`. Probe'lar bunları kullanır.
- **Geri alma:** Argo CD'de önceki revision'a Rollback ya da deploy commit'ini `git revert`.

## Ölçekleme notu

API **tek kopya** çalışır (`replicas: 1`). SignalR bildirimleri bellekte tutuluyor; ikinci bir kopyaya bağlanan oyuncu diğer kopyadaki değişiklikleri anında görmez. Birden fazla kopya için önce SignalR'a Redis backplane eklenmeli. Oyun kuralları zaten `SELECT … FOR UPDATE` ile korunuyor.

## Mobil uygulama

- Yayın build'lerinde (EAS) `EXPO_PUBLIC_API_URL=https://trustnobody.tesekkur.co` ve `EXPO_PUBLIC_WEB_URL=https://trustnobody.tesekkur.co` verilmeli.
- Mobil, API'ye web ile aynı adresten (`/api`, `/hubs`) erişir; ayrı bir alan adı gerekmez.

## Alan adını değiştirmek

`trustnobody.tesekkur.co` iki yerde geçiyor:
- `deploy/apps/web/ingress.yaml`
- `.github/workflows/deploy.yml` (`SITE_URL`)

Web image'ı yeniden derlenmeli; davet linkinin adresi derleme anında JS'e gömülüyor.
