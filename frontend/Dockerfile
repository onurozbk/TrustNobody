# TrustNobody web: Expo web uygulamasını statik dosya olarak derler ve nginx ile sunar. Build context: frontend/
#   docker build -t trustnobody-web frontend
#
# EXPO_PUBLIC_* değerleri derleme anında JS'e gömülür; değişirse imaj yeniden derlenmeli.

FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --no-audit --no-fund
COPY . .
# Boş bırakılırsa istemci API'ye aynı origin üzerinden gider (Ingress ya da nginx proxy)
ARG EXPO_PUBLIC_API_URL=""
# Davet linklerinin başındaki adres. Boşsa tarayıcıdaki origin kullanılır.
ARG EXPO_PUBLIC_WEB_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL \
    EXPO_PUBLIC_WEB_URL=$EXPO_PUBLIC_WEB_URL \
    EXPO_NO_TELEMETRY=1
RUN npx expo export -p web

# root olmadan çalışan nginx (8080'i dinler); k3s'te runAsNonRoot ile uyumlu
FROM nginxinc/nginx-unprivileged:1.29-alpine
ENV API_UPSTREAM=http://api:8080
COPY nginx.conf.template /etc/nginx/templates/default.conf.template
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 8080
