# Requirements Document

## Introduction

Fitur **Activity Calendar** (Kalender Aktivitas) menambahkan tampilan kalender pada aplikasi PPM Monitor (PT Chief Level Indonesia) sehingga setiap pengguna dapat melihat aktivitas KPI yang akan dikerjakan dalam rentang **satu minggu** atau **satu bulan**. Tujuan utamanya adalah memberikan gambaran ringkas "apa saja yang harus dikerjakan / kapan tenggatnya" tanpa harus menelusuri daftar entri satu per satu.

Aplikasi ini dibangun dengan Next.js (App Router) dan Supabase. Aktivitas pada kalender diturunkan dari data yang sudah ada di basis data, terutama:

- **`kpi_entries`** — submission KPI dengan `period_start`, `period_end`, `status` (`pending`/`approved`/`rejected`), `kpi_id`, dan `submitted_by`.
- **`kpis`** — definisi KPI dengan `timeframe` (`weekly`/`monthly`/`annually`), `department_id`, dan `assigned_to`.
- **`kpi_period_targets`** — target per periode dengan `period_start`/`period_end` yang menjadi dasar tenggat (deadline) submission.

Cakupan akses mengikuti aturan peran yang sudah berlaku (Row-Level Security): **Staff** melihat aktivitas miliknya sendiri, **Manager** melihat aktivitas departemennya, dan **Admin** melihat seluruh aktivitas.

### Scope Decisions and Assumptions

- Model data saat ini menyimpan aktivitas pada level **tanggal** (`DATE`), bukan jam/menit. Oleh karena itu kalender menampilkan aktivitas pada sel **hari**, bukan slot waktu per jam seperti pada gambar referensi.
- Setiap aktivitas KPI ditambatkan (di-anchor) pada **tanggal tenggat**, yaitu `period_end` dari entri/periode terkait, karena inilah tanggal "harus selesai dikerjakan".
- Kategori pada gambar referensi yang **tidak** memiliki tabel pendukung (Events, Project, Issues, Performance Appraisals, Leave Requests, Holidays) berada **di luar cakupan** rilis ini. Fitur ini fokus pada aktivitas KPI yang sudah ada. Filter pada rilis ini berbasis **status KPI** dan **timeframe**.
- Fitur ini bersifat **read-only** (melihat dan memfilter). Pembuatan/pengubahan aktivitas dilakukan melalui alur entri KPI yang sudah ada (di luar cakupan spec ini).

## Glossary

- **Activity_Calendar**: Halaman/fitur kalender yang menampilkan aktivitas KPI dalam tampilan minggu atau bulan.
- **Activity**: Item terjadwal pada kalender yang diturunkan dari data KPI, yaitu sebuah `kpi_entries` (submission KPI) beserta KPI terkaitnya.
- **Activity_Date**: Tanggal sel kalender tempat sebuah Activity ditampilkan, yaitu nilai `period_end` dari `kpi_entries` terkait.
- **KPI_Entry**: Satu baris pada tabel `kpi_entries`.
- **KPI_Timeframe**: Nilai `timeframe` pada `kpis` (`weekly`, `monthly`, `annually`).
- **Activity_Status**: Status submission KPI, salah satu dari `pending`, `approved`, `rejected`.
- **Month_View**: Tampilan kalender berupa grid satu bulan penuh (kolom Senin–Minggu).
- **Week_View**: Tampilan kalender berupa tujuh hari (Senin–Minggu) dari minggu terpilih.
- **View_Mode**: Mode tampilan aktif, salah satu dari `week` atau `month`.
- **Focused_Date**: Tanggal acuan yang menentukan minggu atau bulan yang sedang ditampilkan.
- **Visible_Range**: Rentang tanggal yang sedang tampil di layar (satu minggu untuk Week_View, atau sel-sel grid bulan untuk Month_View).
- **Viewer**: Pengguna terautentikasi yang membuka Activity_Calendar.
- **Viewer_Role**: Peran Viewer, salah satu dari `admin`, `manager`, `staff`.
- **Category_Filter**: Kontrol untuk menyaring Activity berdasarkan Activity_Status dan/atau KPI_Timeframe.

## Requirements

### Requirement 1: Akses dan Navigasi Kalender

**User Story:** Sebagai pengguna aplikasi, saya ingin membuka halaman kalender dari menu navigasi, sehingga saya dapat melihat aktivitas saya tanpa mencari-cari.

#### Acceptance Criteria

1. THE Activity_Calendar SHALL be reachable at the route `/dashboard/calendar`.
2. THE Activity_Calendar SHALL display a navigation item labeled "Calendar" in the sidebar for Viewers with Viewer_Role `admin`, `manager`, or `staff`.
3. WHEN a Viewer with Viewer_Role `admin`, `manager`, or `staff` selects the "Calendar" navigation item, THE Activity_Calendar SHALL display the calendar view showing the current month within 3 seconds.
4. WHILE the calendar view is displayed, THE Activity_Calendar SHALL show the "Calendar" navigation item in an active (selected) state.
5. IF an unauthenticated request is made to the route `/dashboard/calendar`, THEN THE Activity_Calendar SHALL redirect the request to the login page within 3 seconds.
6. IF an authenticated Viewer whose Viewer_Role is not `admin`, `manager`, or `staff` requests the route `/dashboard/calendar`, THEN THE Activity_Calendar SHALL deny access and display a message indicating the Viewer is not authorized to view the calendar.

### Requirement 2: Tampilan Bulan (Month View)

**User Story:** Sebagai pengguna, saya ingin melihat aktivitas dalam satu bulan penuh, sehingga saya tahu apa saja yang akan dikerjakan sepanjang bulan ini.

#### Acceptance Criteria

1. WHEN View_Mode is `month`, THE Activity_Calendar SHALL render a grid containing every day of the Focused_Date month, arranged in 7 columns ordered Monday through Sunday, across the minimum number of week rows (5 or 6) required to contain all days of that month.
2. WHEN View_Mode is `month`, THE Activity_Calendar SHALL display leading and trailing days from adjacent months needed to complete the first and last grid weeks, rendered with a distinct visual treatment (reduced opacity or muted text color) that differs from days within the Focused_Date month.
3. WHEN the calendar renders and the current date falls within the Visible_Range, THE Activity_Calendar SHALL apply a distinct visual marker to exactly one cell representing the current date.
4. WHEN View_Mode is `month`, THE Activity_Calendar SHALL display each Activity within the Visible_Range on the day cell matching its Activity_Date, ordered within the cell by Activity start time from earliest to latest.
5. IF the count of Activities on a single day cell exceeds 3, THEN THE Activity_Calendar SHALL display the first 3 Activities and a "+N more" indicator, where N equals the total count of Activities on that day minus 3.
6. WHEN a day cell contains no Activities within the Visible_Range, THE Activity_Calendar SHALL render that cell without any Activity entry and without a "+N more" indicator.

### Requirement 3: Tampilan Minggu (Week View)

**User Story:** Sebagai pengguna, saya ingin melihat aktivitas dalam satu minggu, sehingga saya bisa fokus pada pekerjaan jangka pendek.

#### Acceptance Criteria

1. WHEN View_Mode is `week` and Focused_Date is set, THE Activity_Calendar SHALL render exactly seven day-cells, ordered Monday through Sunday, of the week containing the Focused_Date, where Monday is the first day of the week.
2. IF View_Mode is `week` and Focused_Date is unset or invalid, THEN THE Activity_Calendar SHALL render the week containing the current date and SHALL show an indication that the current date is being used.
3. WHEN View_Mode is `week`, THE Activity_Calendar SHALL display each Activity within the Visible_Range in the day-cell matching its Activity_Date, ordered ascending by Activity start time, and for activities sharing the same start time, ordered ascending by Activity title.
4. WHERE the count of activities in a single day-cell exceeds the maximum of 5 simultaneously visible entries, THE Activity_Calendar SHALL display the first 5 entries and an overflow indicator stating the count of remaining hidden activities.
5. WHEN View_Mode is `week` and a day-cell contains no Activity within the Visible_Range, THE Activity_Calendar SHALL display that day-cell as empty with no activity entries.
6. WHEN the calendar renders and the current date falls within the Visible_Range, THE Activity_Calendar SHALL apply a distinct visual marker to the day-cell representing the current date that differs from all other day-cells.
7. IF the calendar renders and the current date falls outside the Visible_Range, THEN THE Activity_Calendar SHALL render no current-date marker in any day-cell.

### Requirement 4: Pergantian Mode Tampilan

**User Story:** Sebagai pengguna, saya ingin beralih antara tampilan minggu dan bulan, sehingga saya dapat memilih tingkat detail yang sesuai.

#### Acceptance Criteria

1. WHILE the Activity_Calendar is displayed, THE Activity_Calendar SHALL render a persistently visible control offering exactly two selectable options for View_Mode: `week` and `month`.
2. WHEN a Viewer sets View_Mode to `month`, THE Activity_Calendar SHALL render the Month_View for the Focused_Date within 1 second (1000 ms).
3. WHEN a Viewer sets View_Mode to `week`, THE Activity_Calendar SHALL render the Week_View for the Focused_Date within 1 second (1000 ms).
4. WHEN a Viewer changes View_Mode, THE Activity_Calendar SHALL retain the current Focused_Date without modification.
5. WHERE no View_Mode has been selected by the Viewer AND the viewport width is at or above the application's mobile breakpoint, THE Activity_Calendar SHALL default View_Mode to `month`.
6. WHERE no View_Mode has been selected by the Viewer AND the viewport width is below the application's mobile breakpoint, THE Activity_Calendar SHALL default View_Mode to `week`.
7. IF a request to set View_Mode specifies a value other than `week` or `month`, THEN THE Activity_Calendar SHALL retain the previously active View_Mode, leave the current Focused_Date unchanged, and display an error indication that the requested view mode is not supported.

### Requirement 5: Navigasi Antar Periode

**User Story:** Sebagai pengguna, saya ingin berpindah ke minggu atau bulan lain, sehingga saya dapat melihat aktivitas yang lampau maupun yang akan datang.

#### Acceptance Criteria

1. THE Activity_Calendar SHALL display three distinct and always-visible controls: a previous-period control, a next-period control, and a current-period control.
2. WHILE View_Mode is `month`, WHEN the Viewer selects the next-period control, THE Activity_Calendar SHALL set the Focused_Date to the same day-of-month one month later.
3. WHILE View_Mode is `month`, WHEN the Viewer selects the previous-period control, THE Activity_Calendar SHALL set the Focused_Date to the same day-of-month one month earlier.
4. IF the source day-of-month does not exist in the target month (e.g., the 31st in a month with fewer days), THEN THE Activity_Calendar SHALL set the Focused_Date to the last calendar day of that target month.
5. WHILE View_Mode is `week`, WHEN the Viewer selects the next-period control, THE Activity_Calendar SHALL set the Focused_Date to exactly seven days later.
6. WHILE View_Mode is `week`, WHEN the Viewer selects the previous-period control, THE Activity_Calendar SHALL set the Focused_Date to exactly seven days earlier.
7. WHEN the Viewer selects the current-period control, THE Activity_Calendar SHALL set the Focused_Date to the system's current local date.
8. WHEN the Focused_Date changes, THE Activity_Calendar SHALL recompute the Visible_Range and refresh the displayed period within 500 milliseconds.
9. WHILE View_Mode is `month`, THE Activity_Calendar SHALL display a label identifying the month and year of the Focused_Date for the current Visible_Range.
10. WHILE View_Mode is `week`, THE Activity_Calendar SHALL display a week-mode label identifying the start date and the end date of the current Visible_Range.

### Requirement 6: Sumber dan Tampilan Aktivitas

**User Story:** Sebagai pengguna, saya ingin setiap aktivitas KPI muncul pada tanggal yang tepat dengan informasi ringkas, sehingga saya langsung paham aktivitas tersebut.

#### Acceptance Criteria

1. THE Activity_Calendar SHALL derive each Activity from a KPI_Entry joined with its related KPI record on the matching KPI identifier.
2. IF a KPI_Entry has no related KPI record, THEN THE Activity_Calendar SHALL exclude that KPI_Entry from the displayed Activity list and SHALL NOT render a calendar entry for it.
3. THE Activity_Calendar SHALL set the Activity_Date of each Activity to the `period_end` value of the related KPI_Entry.
4. IF the `period_end` value of a KPI_Entry is null or not a valid date, THEN THE Activity_Calendar SHALL exclude that Activity from the calendar and SHALL show a non-blocking indication that one or more activities could not be placed.
5. WHEN an Activity is displayed on the calendar, THE Activity_Calendar SHALL show the KPI name and the Activity_Status of that Activity.
6. WHEN the KPI name of a displayed Activity exceeds 60 characters, THE Activity_Calendar SHALL truncate the visible name to 60 characters followed by an ellipsis while retaining the full name in the Activity details view.
7. THE Activity_Calendar SHALL apply a distinct and mutually different visual color to each of the three Activity_Status values (`pending`, `approved`, `rejected`) such that no two statuses share the same color.
8. WHEN a Viewer selects an Activity, THE Activity_Calendar SHALL display the Activity details including KPI name, Activity_Status, period start date, period end date, and submitter name within 2 seconds.
9. IF the submitter name of a selected Activity is unavailable, THEN THE Activity_Calendar SHALL display a placeholder text indicating the submitter is unknown in place of the submitter name.

### Requirement 7: Cakupan Berdasarkan Peran dan Departemen

**User Story:** Sebagai pemilik data, saya ingin kalender menghormati batas akses peran, sehingga setiap orang hanya melihat aktivitas yang berhak dilihatnya.

#### Acceptance Criteria

1. WHERE Viewer_Role is `staff`, THE Activity_Calendar SHALL display only Activities whose KPI_Entry was submitted by the Viewer, and SHALL exclude all Activities submitted by any other user, including Activities belonging to the Viewer's department but submitted by others.
2. WHERE Viewer_Role is `manager`, THE Activity_Calendar SHALL display only Activities whose related KPI belongs to the Viewer's department, and SHALL exclude all Activities whose related KPI belongs to any other department.
3. WHERE Viewer_Role is `admin`, THE Activity_Calendar SHALL display Activities across all departments without department-based or submitter-based exclusion.
4. THE Activity_Calendar SHALL retrieve Activities through the Supabase client so that Row-Level Security policies are enforced for the Viewer.
5. IF the Viewer is not authenticated or the Viewer_Role is null, empty, or not one of `staff`, `manager`, or `admin`, THEN THE Activity_Calendar SHALL display zero Activities and SHALL present a pesan yang menyatakan bahwa akses tidak diizinkan, while retaining no Activity data in the view.
6. WHEN the role-scoped query returns zero Activities for the Viewer, THE Activity_Calendar SHALL render without any Activity entries and SHALL display a pesan kosong yang menyatakan tidak ada aktivitas dalam cakupan Viewer.

### Requirement 8: Penyaringan Aktivitas

**User Story:** Sebagai pengguna, saya ingin menyaring aktivitas berdasarkan status dan jenis periode, sehingga saya dapat memfokuskan pada aktivitas tertentu.

#### Acceptance Criteria

1. THE Activity_Calendar SHALL display a Category_Filter listing each Activity_Status value (`pending`, `approved`, `rejected`) as an individually toggleable control.
2. WHEN a Viewer disables an Activity_Status in the Category_Filter, THE Activity_Calendar SHALL hide every Activity with that Activity_Status from the Visible_Range within 1 second and retain all other Activities.
3. WHEN a Viewer enables a previously disabled Activity_Status in the Category_Filter, THE Activity_Calendar SHALL display every Activity with that Activity_Status within the Visible_Range within 1 second.
4. WHERE Viewer_Role is `manager` or `admin`, THE Activity_Calendar SHALL provide a filter to restrict Activities by exactly one KPI_Timeframe value (`weekly`, `monthly`, `annually`) at a time.
5. WHILE both a Category_Filter selection and a KPI_Timeframe selection are active, THE Activity_Calendar SHALL display only Activities that match the enabled Activity_Status values AND the selected KPI_Timeframe within the Visible_Range.
6. WHERE no Category_Filter selection has been changed by the Viewer, THE Activity_Calendar SHALL display Activities of all three Activity_Status values.
7. IF the Viewer disables all three Activity_Status values in the Category_Filter, THEN THE Activity_Calendar SHALL display zero Activities within the Visible_Range and present an indication that no Activity_Status is currently selected.

### Requirement 9: Status Data (Loading, Kosong, Error)

**User Story:** Sebagai pengguna, saya ingin tahu kondisi data kalender, sehingga saya tidak bingung saat data sedang dimuat, kosong, atau gagal dimuat.

#### Acceptance Criteria

1. WHILE Activities for the Visible_Range are being retrieved, THE Activity_Calendar SHALL display a loading indicator within 300 milliseconds of the retrieval starting, dengan teks atau ikon yang menyatakan data sedang dimuat.
2. WHEN retrieval completes and no Activity exists within the Visible_Range, THE Activity_Calendar SHALL display an empty-state message yang menyatakan tidak ada aktivitas untuk periode yang sedang ditampilkan.
3. IF retrieval of Activities fails, THEN THE Activity_Calendar SHALL display an error message yang menyatakan data gagal dimuat dan SHALL display a retry control yang dapat ditekan pengguna.
4. IF retrieval of Activities does not complete within 10 seconds, THEN THE Activity_Calendar SHALL treat the retrieval as failed dan menampilkan error state sesuai kriteria 3.
5. WHEN the user activates the retry control, THE Activity_Calendar SHALL re-initiate retrieval of Activities for the Visible_Range dan kembali ke loading state sesuai kriteria 1.
6. THE Activity_Calendar SHALL display only one of the loading, empty-state, or error states at any given time untuk Visible_Range yang sedang ditampilkan.

### Requirement 10: Pemuatan Data Sesuai Rentang Tampilan

**User Story:** Sebagai pengguna, saya ingin kalender memuat hanya data yang relevan dengan tampilan, sehingga halaman tetap responsif.

#### Acceptance Criteria

1. WHEN the Visible_Range changes, THE Activity_Calendar SHALL retrieve, within 1 second, all Activities whose Activity_Date falls within the new Visible_Range, treating the Visible_Range start date and end date as inclusive boundaries.
2. THE Activity_Calendar SHALL exclude from display any Activity whose Activity_Date falls outside the Visible_Range.
3. WHILE Activities for the current Visible_Range are being retrieved, THE Activity_Calendar SHALL display a loading indicator and SHALL keep the previously displayed Activities visible until retrieval completes.
4. IF retrieval of Activities for the Visible_Range fails, THEN THE Activity_Calendar SHALL display an error message indicating that the data could not be loaded and SHALL retain the previously displayed Activities without modification.

### Requirement 11: Lokalisasi

**User Story:** Sebagai pengguna berbahasa Indonesia, saya ingin antarmuka kalender mengikuti bahasa yang dipilih, sehingga mudah dipahami.

#### Acceptance Criteria

1. THE Activity_Calendar SHALL render all static interface labels using the application's active language setting, where the active language is exactly one of two supported values (`id` or `en`).
2. WHEN the active language is `id`, THE Activity_Calendar SHALL display all weekday names, all month names, and all interface labels in Indonesian, with no label remaining in any other language.
3. WHEN the active language is `en`, THE Activity_Calendar SHALL display all weekday names, all month names, and all interface labels in English, with no label remaining in any other language.
4. WHEN the active language setting changes between `id` and `en`, THE Activity_Calendar SHALL re-render all weekday names, month names, and interface labels in the newly selected language within 1 second, without requiring a page reload.
5. IF the active language setting is absent or is a value other than `id` or `en`, THEN THE Activity_Calendar SHALL fall back to displaying all weekday names, month names, and interface labels in English (`en`).

### Requirement 12: Tampilan Responsif

**User Story:** Sebagai pengguna perangkat seluler, saya ingin kalender tetap dapat digunakan di layar kecil, sehingga saya bisa mengeceknya di mana saja.

#### Acceptance Criteria

1. WHILE the viewport width is below the mobile breakpoint of 768 CSS pixels, THE Activity_Calendar SHALL render all calendar content within the viewport width with no element extending beyond the viewport boundary and no horizontal page scrollbar.
2. WHERE no View_Mode has been selected by the Viewer AND the viewport width is below the mobile breakpoint of 768 CSS pixels, THE Activity_Calendar SHALL default View_Mode to `week`.
3. WHILE the viewport width is below the mobile breakpoint of 768 CSS pixels, THE Activity_Calendar SHALL render every interactive control with a touch target measuring at least 44 by 44 CSS pixels.
4. WHEN the viewport width crosses the mobile breakpoint of 768 CSS pixels in either direction, THE Activity_Calendar SHALL re-render its layout to fit the new viewport width within 500 milliseconds while preserving the currently selected View_Mode.
