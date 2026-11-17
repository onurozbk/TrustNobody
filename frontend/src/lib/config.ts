// EXPO_PUBLIC_ değişkenleri build sırasında koda gömülür; sadece nokta notasyonuyla okunmalı.

/** API adresi. Boşsa aynı origin kullanılır (web'de nginx /api ve /hubs'ı API'ye yönlendirir). */
export const API_URL = (process.env.EXPO_PUBLIC_API_URL ?? "").replace(/\/+$/, "");

/** Davet linklerinin başındaki web adresi. Boşsa web'de mevcut origin kullanılır. */
export const WEB_URL = (process.env.EXPO_PUBLIC_WEB_URL ?? "").replace(/\/+$/, "");
