# 🍍 NanasParty - 1 2 3 4 Player Party Game

[![Build Android APK](https://github.com/nanasmudawkwk/NanasParty/actions/workflows/build-apk.yml/badge.svg)](https://github.com/nanasmudawkwk/NanasParty/actions/workflows/build-apk.yml)
[![Package](https://img.shields.io/badge/Package-com.nanasparty.nanas-orange.svg)](https://github.com/nanasmudawkwk/NanasParty)
[![Platform](https://img.shields.io/badge/Platform-Android-green.svg)](https://github.com/nanasmudawkwk/NanasParty)
[![Players](https://img.shields.io/badge/Players-1--4%20Local-blue.svg)](https://github.com/nanasmudawkwk/NanasParty)

**NanasParty** adalah game pesta multiplayer (1 hingga 4 pemain) lokal di satu layar yang terinspirasi dari game legendaris *Stickman Party*, dibalut dengan karakter Nanas lucu dan animasi seru!

Package Name: `com.nanasparty.nanas`

---

## 🎮 Fitur Mini-Games

1. 🚀 **Nanas Tanks**: Pertarungan tank 4 arah dengan peluru memantul dan rintangan kayu.
2. ⚽ **Nanas Soccer**: Pertandingan sepak bola seru dengan bola lentur dan gawang responsif.
3. 🏎️ **Nanas Micro Rally**: Balapan sirkuit seru 3 putaran dengan efek drifting.
4. 🥋 **Nanas Sumo Clash**: Adu dorong keluar dari pulau es melayang yang terus mencair.
5. 🎨 **Nanas Color Clash**: Adu cepat mewarnai ubin lantai dalam batas waktu 30 detik.
6. 💣 **Nanas Pass The Bomb**: Oper bom kelapa bertali sumbu ke lawan sebelum meledak!
7. 👻 **Nanas Ghost Survival**: Bertahan dari kejaran hantu dengan tetap berada di dalam lingkaran cahaya lampu.
8. 🏃 **Nanas Obstacle Run**: Hindari rintangan berputar dan jadilah yang pertama mencapai garis finish.

---

## 🕹️ Mode Permainan & Kontrol

- **Mode Main Cepat (Quick Play)**: Pilih mini-game favorit secara bebas.
- **Turnamen Piala Nanas (Cup Tournament)**: 5 ronde acak dengan akumulasi poin dan panggung juara (podium) di akhir!
- **Dukungan Bot AI**: Dapat dimainkan sendiri (1P vs 3 Bot), berdua (2P vs 2 Bot), bertiga (3P vs 1 Bot), atau berempat (4P).

### Kontrol:
- **Layar Sentuh (HP / Tablet)**: 4 sudut layar memiliki joystick analog virtual dan tombol aksi yang ergonomis untuk 4 pemain bersamaan.
- **Keyboard (PC)**:
  - **P1 (Nanas Merah)**: `W`, `A`, `S`, `D` + `[Spasi]`
  - **P2 (Nanas Biru)**: `Tombol Panah` + `[Enter]`
  - **P3 (Nanas Hijau)**: `I`, `J`, `K`, `L` + `[U]`
  - **P4 (Nanas Kuning)**: `Numpad 8, 4, 5, 6` + `[Numpad 0]`

---

## 🛠️ Otomatisasi GitHub Actions (Build APK)

Proyek ini telah dikonfigurasi dengan alur kerja CI/CD di `.github/workflows/build-apk.yml`.
Setiap kali ada push ke branch `main`, GitHub Actions akan:
1. Menyiapkan lingkungan JDK 17 dan Android Build Tools.
2. Mengompilasi kode sumber menjadi file **APK Release & Debug** (`NanasParty-release.apk` dan `NanasParty-debug.apk`).
3. Mengunggah file APK ke tab **Artifacts** dan membuat rilis otomatis di GitHub Releases.

---

## 📥 Cara Download APK

1. Masuk ke tab **[Releases](https://github.com/nanasmudawkwk/NanasParty/releases)** di repositori ini.
2. Unduh file `NanasParty-release.apk` atau `NanasParty-debug.apk`.
3. Pasang (install) di perangkat Android Anda.
