// Biến EXPO_PUBLIC_* được Metro/Babel thay giá trị lúc build (https://docs.expo.dev/guides/environment-variables/).
declare const process: { env: { [key: `EXPO_PUBLIC_${string}`]: string | undefined; NODE_ENV?: string } };

// src/modules/sources/infrastructure/http-client.ts của web truyền `next: { revalidate, tags }` (Data Cache của Next).
// Trên React Native trường này bị fetch bỏ qua; khai báo để typecheck code dùng chung.
interface RequestInit {
  next?: { revalidate?: number | false; tags?: string[] };
}
