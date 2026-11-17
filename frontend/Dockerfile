# Expo web uygulamasını statik dosya olarak derler ve nginx ile sunar.
FROM node:22-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci
COPY . .
# Boş bırakılırsa istemci API'ye aynı origin üzerinden (nginx proxy) gider
ARG EXPO_PUBLIC_API_URL=""
ARG EXPO_PUBLIC_WEB_URL=""
ENV EXPO_PUBLIC_API_URL=$EXPO_PUBLIC_API_URL EXPO_PUBLIC_WEB_URL=$EXPO_PUBLIC_WEB_URL
RUN npx expo export -p web

FROM nginx:1.27-alpine
COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html
EXPOSE 80
