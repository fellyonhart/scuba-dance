# 🐠 Scuba Dance Cam

Scuba Dance Cam adalah aplikasi web interaktif berbasis React yang memanfaatkan kamera untuk mendeteksi pose tangan melalui MediaPipe. Saat tangan terdeteksi di depan kamera, aplikasi akan mengaktifkan mode Kicau Mania, menampilkan animasi GIF scuba cat secara acak, dan memutar musik latar.

## ✨ Fitur Utama
- Deteksi pose tubuh secara real-time menggunakan MediaPipe Pose
- Deteksi tangan untuk mengaktifkan efek animasi
- Penampilan GIF scuba cat secara acak di area canvas
- Pemutaran audio otomatis saat mode aktif
- UI sederhana dan interaktif

## 🛠️ Teknologi yang Digunakan
- React.js
- MediaPipe Pose
- MediaPipe Camera Utils
- CSS3
- Node.js dan npm

## ▶️ Cara Menjalankan Aplikasi

1. Pastikan Node.js dan npm sudah terinstal di komputer Anda.
2. Buka terminal dan masuk ke folder project.
3. Install dependency:

```bash
npm install
```

4. Jalankan aplikasi:

```bash
npm start
```

5. Buka browser dan akses:

```text
http://localhost:3000
```

## 📷 Izin yang Dibutuhkan
Aplikasi ini memerlukan izin akses kamera dan audio dari browser. Pastikan Anda mengizinkan akses tersebut agar fitur dapat berjalan dengan baik.

## ⚠️ Catatan
- Audio dapat terblokir oleh browser sampai Anda klik area halaman pertama kali.
- Aplikasi ini paling optimal digunakan di browser modern seperti Chrome atau Edge.

## 📁 Struktur Proyek
```text
src/
  App.js          # Logika utama aplikasi
  App.css         # Styling UI
  assets/         # GIF dan file audio
public/           # File statis React
```

## 👤 Penulis
Proyek ini dibuat untuk pengalaman interaktif berbasis kamera dengan nuansa fun dan playful.