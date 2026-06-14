# Bugfix Requirements Document

## Introduction

Seorang manager melaporkan bahwa di halaman **Analytics** (`/dashboard/analytics`) dan **Dashboard** (`/dashboard`), entri KPI hanya bisa dilihat tetapi tidak bisa diedit. Akibatnya, kalau manager sudah memberi respon yang salah pada sebuah entry (misalnya keliru approve/reject atau salah memberi score), tidak ada cara untuk mengoreksinya langsung dari kedua tampilan tersebut ("aku kalau salah respon gimana").

Saat ini, kemampuan untuk mengoreksi keputusan review (`Edit decision`) hanya tersedia di halaman **Submissions** (`/dashboard/entries`). Tabel entri di Analytics dan daftar "Recent Submissions" di Dashboard bersifat read-only dan tidak menyediakan affordance (tombol/tautan) apa pun untuk mengedit entry atau mengoreksi respon, sehingga manager terjebak tanpa jalan keluar dari tampilan yang sedang dibukanya.

Bug ini berdampak pada peran **manager** (dan admin) yang berwenang mereview entri di departemennya. Perbaikan harus memberi manager jalan untuk mengedit/mengoreksi entry dari Analytics dan Dashboard, tanpa mengubah batasan RBAC yang sudah ada (manager hanya boleh menyentuh entri di departemennya sendiri).

## Bug Analysis

### Current Behavior (Defect)

Apa yang terjadi sekarang ketika manager membuka Analytics atau Dashboard dan ingin mengoreksi sebuah entry:

1.1 WHEN seorang manager melihat tabel entri di halaman Analytics (`/dashboard/analytics`) THEN the system hanya menampilkan data entry secara read-only tanpa tombol atau tautan apa pun untuk mengedit entry tersebut

1.2 WHEN seorang manager melihat daftar "Recent Submissions" di Dashboard (`/dashboard`) THEN the system hanya menampilkan entry secara read-only tanpa affordance untuk mengedit atau mengoreksi keputusan review pada entry tersebut

1.3 WHEN seorang manager menyadari telah salah merespon (keliru approve/reject atau salah score) sebuah entry sambil berada di Analytics atau Dashboard THEN the system tidak menyediakan jalur apa pun dari tampilan tersebut untuk mengoreksi keputusan itu

### Expected Behavior (Correct)

Apa yang seharusnya terjadi:

2.1 WHEN seorang manager melihat sebuah entry di halaman Analytics (`/dashboard/analytics`) THEN the system SHALL menyediakan affordance (tombol/tautan edit) yang memungkinkan manager mengedit entry tersebut

2.2 WHEN seorang manager melihat sebuah entry di daftar "Recent Submissions" pada Dashboard (`/dashboard`) THEN the system SHALL menyediakan affordance yang memungkinkan manager mengedit atau mengoreksi keputusan review pada entry tersebut

2.3 WHEN seorang manager menyadari telah salah merespon sebuah entry sambil berada di Analytics atau Dashboard THEN the system SHALL menyediakan jalur untuk mengoreksi keputusan review (mengubah approve/reject/pending, score, atau catatan) atas entry tersebut

### Unchanged Behavior (Regression Prevention)

Perilaku yang harus tetap dipertahankan:

3.1 WHEN seorang manager mengoreksi sebuah entry THEN the system SHALL CONTINUE TO membatasi akses hanya pada entri yang berada di departemen manager tersebut (RBAC/RLS scoping tidak berubah)

3.2 WHEN seorang manager mengoreksi keputusan review dari halaman Submissions (`/dashboard/entries`) menggunakan tombol "Edit decision" THEN the system SHALL CONTINUE TO bekerja seperti semula

3.3 WHEN seorang pengguna dengan peran staff melihat tampilan entry THEN the system SHALL CONTINUE TO tidak memberikan kemampuan edit/koreksi keputusan review yang bukan haknya

3.4 WHEN seorang admin mengedit atau mengoreksi entry apa pun THEN the system SHALL CONTINUE TO mengizinkan akses penuh seperti semula

3.5 WHEN tabel Analytics dan daftar "Recent Submissions" menampilkan data entry THEN the system SHALL CONTINUE TO menampilkan informasi entry yang sama (KPI, departemen, nilai, periode, status) seperti sebelumnya
