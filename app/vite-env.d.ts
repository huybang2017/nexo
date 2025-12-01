/// <reference types="vite/client" />

// Khai báo đúng tên biến môi trường bạn dùng trong code
interface ImportMetaEnv {
  readonly VITE_API_URL: string;
  // Thêm các biến VITE_ khác nếu cần
}
