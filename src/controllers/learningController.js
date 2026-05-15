const fiqihGuides = [
  {
    slug: "sholat",
    title: "Cara Sholat Wajib",
    summary: "Urutan lengkap dari niat, takbiratul ihram, ruku, sujud, hingga salam.",
    points: ["Syarat sah sholat", "Rukun sholat", "Bacaan inti"],
    category: "Fardhu",
  },
  {
    slug: "wudhu",
    title: "Cara Wudhu",
    summary: "Langkah wudhu sesuai urutan dengan poin sunnah dan hal yang membatalkan.",
    points: ["Niat dan urutan", "Bagian yang wajib terkena air", "Pembatal wudhu"],
    category: "Thaharah",
  },
  {
    slug: "mandi-wajib",
    title: "Cara Mandi Wajib",
    summary: "Panduan mandi junub yang ringkas agar sah untuk kembali beribadah.",
    points: ["Sebab mandi wajib", "Rukun mandi wajib", "Kesalahan umum"],
    category: "Thaharah",
  },
  {
    slug: "tayamum",
    title: "Tayamum Dasar",
    summary: "Alternatif bersuci saat tidak ada air atau ada uzur menggunakan air.",
    points: ["Kapan tayamum", "Urutan tayamum", "Yang membatalkan tayamum"],
    category: "Thaharah",
  },
  {
    slug: "dhuha",
    title: "Sholat Sunnah Dhuha",
    summary: "Panduan niat, waktu, rakaat, dan urutan sholat dhuha.",
    points: ["Waktu dhuha", "Niat dhuha", "Rakaat dhuha"],
    category: "Sunnah",
  },
  {
    slug: "jumat",
    title: "Sholat Jumat",
    summary: "Ringkasan syarat, rukun khutbah, dan tata cara pelaksanaan Jumat.",
    points: ["Syarat wajib", "Rukun khutbah", "Alur pelaksanaan"],
    category: "Fardhu",
  },
  {
    slug: "jenazah",
    title: "Sholat Jenazah",
    summary: "Tata cara sholat jenazah dari niat hingga salam tanpa ruku dan sujud.",
    points: ["Empat takbir", "Doa jenazah", "Posisi imam"],
    category: "Fardhu Kifayah",
  },
  {
    slug: "sujud-sahwi",
    title: "Sujud Sahwi",
    summary: "Panduan kapan sujud sahwi dilakukan dan bagaimana pelaksanaannya.",
    points: ["Sebab sujud sahwi", "Dua kali sujud", "Sebelum salam"],
    category: "Fiqih Sholat",
  },
  {
    slug: "tahajud",
    title: "Sholat Tahajud",
    summary: "Panduan niat, waktu malam terbaik, dan pola rakaat tahajud.",
    points: ["Sepertiga malam", "Niat tahajud", "Rakaat 2 salam"],
    category: "Sunnah",
  },
  {
    slug: "witir",
    title: "Sholat Witir",
    summary: "Panduan witir sebagai penutup sholat malam dengan rakaat ganjil.",
    points: ["Penutup malam", "Rakaat ganjil", "Niat witir"],
    category: "Sunnah",
  },
  {
    slug: "istikharah",
    title: "Sholat Istikharah",
    summary: "Tata cara meminta petunjuk Allah saat memilih satu urusan penting.",
    points: ["Niat istikharah", "2 rakaat", "Doa setelah sholat"],
    category: "Sunnah",
  },
  {
    slug: "taubat",
    title: "Sholat Taubat",
    summary: "Panduan sholat taubat saat ingin kembali dan memohon ampun kepada Allah.",
    points: ["Niat taubat", "2 rakaat", "Istighfar sungguh-sungguh"],
    category: "Sunnah",
  },
  {
    slug: "hajat",
    title: "Sholat Hajat",
    summary: "Sholat sunnah untuk memohon pertolongan Allah atas kebutuhan/urusan tertentu.",
    points: ["Niat hajat", "2 rakaat", "Doa setelah sholat"],
    category: "Sunnah",
  },
];

const quranLearningPath = {
  slug: "baca-quran",
  title: "Belajar Baca Al-Qur'an (Metode Iqro Bertahap)",
  summary:
    "Semua materi hijaiyah, harakat, tajwid dasar, dan latihan harian digabung dalam satu jalur belajar terstruktur.",
  stages: [
    { name: "Tahap 1", title: "Hijaiyah & Makhraj", note: "Kenali huruf Alif sampai Ya dan bunyi yang tepat." },
    { name: "Tahap 2", title: "Harakat Dasar", note: "Latihan fathah, kasrah, dhammah, sukun, dan tanwin." },
    { name: "Tahap 3", title: "Tajwid Praktis", note: "Mulai dari nun mati/tanwin, mim mati, mad, dan waqaf." },
    { name: "Tahap 4", title: "Rutin Harian", note: "Masuk mode Iqro halaman per halaman + latihan konsisten." },
  ],
};

const weeklyPlan = [
  "Hari 1-2: Huruf hijaiyah + makhraj",
  "Hari 3-4: Harakat + latihan baca suku kata",
  "Hari 5: Tajwid dasar (nun mati/tanwin)",
  "Hari 6: Baca surah pendek perlahan",
  "Hari 7: Murajaah dan evaluasi bacaan",
];

const iqroLevels = [
  {
    level: 1,
    title: "Iqro 1 - Huruf Tunggal (Alif-Ba-Ta)",
    objective: "Mengenal bentuk huruf hijaiyah tunggal dan bunyi dasar berharakat fathah.",
    lessons: [
      {
        label: "Kelompok 1",
        items: [
          { arabic: "ا", latin: "alif", read: "a" },
          { arabic: "ب", latin: "ba", read: "ba" },
          { arabic: "ت", latin: "ta", read: "ta" },
          { arabic: "ث", latin: "tsa", read: "tsa" },
        ],
      },
      {
        label: "Kelompok 2",
        items: [
          { arabic: "ج", latin: "jim", read: "ja" },
          { arabic: "ح", latin: "ha", read: "ha" },
          { arabic: "خ", latin: "kha", read: "kha" },
          { arabic: "د", latin: "dal", read: "da" },
        ],
      },
      {
        label: "Latihan Cepat",
        items: [
          { arabic: "بَ", latin: "ba", read: "ba" },
          { arabic: "تَ", latin: "ta", read: "ta" },
          { arabic: "ثَ", latin: "tsa", read: "tsa" },
          { arabic: "جَ", latin: "ja", read: "ja" },
        ],
      },
    ],
    tips: [
      "Fokus akurasi bunyi dulu, bukan kecepatan.",
      "Ulang tiap huruf 5-10 kali sebelum pindah.",
    ],
  },
  {
    level: 2,
    title: "Iqro 2 - Sambung Sederhana",
    objective: "Membaca huruf bersambung dua huruf dan pola suku kata sederhana.",
    lessons: [
      {
        label: "Sambung 2 Huruf",
        items: [
          { arabic: "بَا", latin: "ba-a", read: "baa" },
          { arabic: "تَا", latin: "ta-a", read: "taa" },
          { arabic: "جَا", latin: "ja-a", read: "jaa" },
          { arabic: "دَا", latin: "da-a", read: "daa" },
        ],
      },
      {
        label: "Latihan Gabungan",
        items: [
          { arabic: "بَتَ", latin: "ba-ta", read: "bata" },
          { arabic: "تَبَ", latin: "ta-ba", read: "taba" },
          { arabic: "جَدَ", latin: "ja-da", read: "jada" },
          { arabic: "حَبَ", latin: "ha-ba", read: "haba" },
        ],
      },
    ],
    tips: [
      "Perhatikan bentuk huruf saat di awal, tengah, dan akhir.",
      "Jika sering tertukar, latih pasangan huruf yang mirip (ta-tsa, ha-kha).",
    ],
  },
  {
    level: 3,
    title: "Iqro 3 - Kasrah, Dhammah, dan Sukun",
    objective: "Mengenal variasi vokal i/u dan huruf mati (sukun).",
    lessons: [
      {
        label: "Kasrah (i) & Dhammah (u)",
        items: [
          { arabic: "بِ", latin: "bi", read: "bi" },
          { arabic: "بُ", latin: "bu", read: "bu" },
          { arabic: "تِ", latin: "ti", read: "ti" },
          { arabic: "تُ", latin: "tu", read: "tu" },
        ],
      },
      {
        label: "Sukun",
        items: [
          { arabic: "أَبْ", latin: "ab", read: "ab" },
          { arabic: "أَتْ", latin: "at", read: "at" },
          { arabic: "أَجْ", latin: "aj", read: "aj" },
          { arabic: "أَدْ", latin: "ad", read: "ad" },
        ],
      },
    ],
    tips: [
      "Bedakan vokal pendek a-i-u secara konsisten.",
      "Pada sukun, huruf dibaca berhenti tanpa vokal tambahan.",
    ],
  },
  {
    level: 4,
    title: "Iqro 4 - Tanwin dan Mad Dasar",
    objective: "Mengenal an/in/un (tanwin) dan bacaan panjang dasar (mad).",
    lessons: [
      {
        label: "Tanwin",
        items: [
          { arabic: "بً", latin: "ban", read: "ban" },
          { arabic: "بٍ", latin: "bin", read: "bin" },
          { arabic: "بٌ", latin: "bun", read: "bun" },
          { arabic: "تٌ", latin: "tun", read: "tun" },
        ],
      },
      {
        label: "Mad Dasar",
        items: [
          { arabic: "بَا", latin: "baa", read: "baa (2 harakat)" },
          { arabic: "بِي", latin: "bii", read: "bii (2 harakat)" },
          { arabic: "بُو", latin: "buu", read: "buu (2 harakat)" },
          { arabic: "قَالَ", latin: "qaa-la", read: "qaala" },
        ],
      },
    ],
    tips: [
      "Mad dasar dibaca dua ketukan.",
      "Gunakan metronom sederhana (tepuk tangan) agar panjang bacaan stabil.",
    ],
  },
  {
    level: 5,
    title: "Iqro 5 - Tajwid Dasar Praktis",
    objective: "Mulai membaca potongan kata/ayat dengan aturan tajwid dasar.",
    lessons: [
      {
        label: "Nun Mati / Tanwin",
        items: [
          { arabic: "مِنْ بَعْدِ", latin: "min ba'di", read: "ikhfa/idgham sesuai kaidah" },
          { arabic: "أَنْعَمْتَ", latin: "an'amta", read: "jelas di makhraj" },
          { arabic: "غَفُورٌ رَحِيمٌ", latin: "ghafuurun rahiim", read: "perhatikan tanwin" },
        ],
      },
      {
        label: "Qalqalah Ringkas",
        items: [
          { arabic: "أَحَدْ", latin: "ahad", read: "pantul ringan pada دْ saat waqaf" },
          { arabic: "لَمْ يَلِدْ", latin: "lam yalid", read: "qalqalah pada دْ saat berhenti" },
        ],
      },
    ],
    tips: [
      "Prioritaskan tajwid yang paling sering muncul dulu.",
      "Gunakan murottal lambat untuk meniru tempo baca.",
    ],
  },
  {
    level: 6,
    title: "Iqro 6 - Siap ke Mushaf",
    objective: "Transisi dari latihan Iqro ke bacaan ayat Al-Qur'an bertahap.",
    lessons: [
      {
        label: "Latihan Surah Pendek",
        items: [
          { arabic: "قُلْ هُوَ اللَّهُ أَحَدٌ", latin: "qul huwallahu ahad", read: "latih per ayat" },
          { arabic: "إِنَّا أَعْطَيْنَاكَ الْكَوْثَرَ", latin: "inna a'thainakal kauthar", read: "perhatikan ghunnah" },
        ],
      },
      {
        label: "Target Rutin",
        items: [
          { arabic: "10-15 MENIT", latin: "murajaah harian", read: "sedikit tapi konsisten" },
          { arabic: "1 HALAMAN", latin: "bertahap", read: "jangan dipaksa cepat" },
        ],
      },
    ],
    tips: [
      "Setelah level ini, lanjut rutin di menu Al-Qur'an dengan target realistis.",
      "Rekam suara sendiri untuk evaluasi makhraj dan panjang-pendek.",
    ],
  },
];

function getIqroLevelSummaries() {
  return iqroLevels.map((level) => ({
    level: level.level,
    title: level.title,
    objective: level.objective,
  }));
}

function getIqroLevelDetail(levelNumber) {
  const numericLevel = Number(levelNumber);
  if (!Number.isInteger(numericLevel)) return null;
  return iqroLevels.find((item) => item.level === numericLevel) || null;
}

const learningDetails = {
  sholat: {
    slug: "sholat",
    title: "Cara Sholat Wajib",
    subtitle: "Ringkasan praktik umum yang lazim diajarkan di Indonesia.",
    focus: ["Niat sesuai sholat fardhu", "Rukun sholat", "Tuma'ninah di tiap gerakan"],
    intentionIntro:
      "Niat tempat utamanya di hati. Lafal berikut umum dipakai untuk membantu menghadirkan niat sebelum takbiratul ihram.",
    intentions: [
      {
        label: "Sholat Subuh (2 rakaat)",
        arabic: "أُصَلِّيْ فَرْضَ الصُّبْحِ رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhas shubhi rak'ataini lillahi ta'ala.",
        meaning: "Saya shalat Subuh dua rakaat karena Allah Ta'ala.",
      },
      {
        label: "Sholat Zuhur (4 rakaat)",
        arabic: "أُصَلِّيْ فَرْضَ الظُّهْرِ أَرْبَعَ رَكَعَاتٍ لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhadh dhuhri arba'a raka'atin lillahi ta'ala.",
        meaning: "Saya shalat Zuhur empat rakaat karena Allah Ta'ala.",
      },
      {
        label: "Sholat Ashar (4 rakaat)",
        arabic: "أُصَلِّيْ فَرْضَ الْعَصْرِ أَرْبَعَ رَكَعَاتٍ لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhal 'ashri arba'a raka'atin lillahi ta'ala.",
        meaning: "Saya shalat Ashar empat rakaat karena Allah Ta'ala.",
      },
      {
        label: "Sholat Maghrib (3 rakaat)",
        arabic: "أُصَلِّيْ فَرْضَ الْمَغْرِبِ ثَلَاثَ رَكَعَاتٍ لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhal maghribi tsalatsa raka'atin lillahi ta'ala.",
        meaning: "Saya shalat Maghrib tiga rakaat karena Allah Ta'ala.",
      },
      {
        label: "Sholat Isya (4 rakaat)",
        arabic: "أُصَلِّيْ فَرْضَ الْعِشَاءِ أَرْبَعَ رَكَعَاتٍ لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhal 'isya'i arba'a raka'atin lillahi ta'ala.",
        meaning: "Saya shalat Isya empat rakaat karena Allah Ta'ala.",
      },
    ],
    sunnahPrayers: [
      {
        name: "Qabliyah Subuh",
        rakaat: "2 rakaat",
        time: "Sebelum Subuh",
        intention: "Ushalli sunnatas subhi rak'ataini qabliyyatan lillahi ta'ala.",
      },
      {
        name: "Rawatib Zuhur",
        rakaat: "2-4 rakaat",
        time: "Sebelum/sesudah Zuhur",
        intention: "Ushalli sunnatad dhuhri rak'ataini (atau arba'a) qabliyyatan/ba'diyyatan lillahi ta'ala.",
      },
      {
        name: "Rawatib Ashar",
        rakaat: "2-4 rakaat",
        time: "Sebelum Ashar",
        intention: "Ushalli sunnatal 'ashri rak'ataini (atau arba'a) qabliyyatan lillahi ta'ala.",
      },
      {
        name: "Rawatib Maghrib",
        rakaat: "2 rakaat",
        time: "Sebelum/sesudah Maghrib",
        intention: "Ushalli sunnatal maghribi rak'ataini qabliyyatan/ba'diyyatan lillahi ta'ala.",
      },
      {
        name: "Rawatib Isya",
        rakaat: "2 rakaat",
        time: "Sebelum/sesudah Isya",
        intention: "Ushalli sunnatal 'isya'i rak'ataini qabliyyatan/ba'diyyatan lillahi ta'ala.",
      },
      {
        name: "Dhuha",
        rakaat: "2 rakaat (boleh lebih genap)",
        time: "Pagi setelah matahari naik",
        intention: "Ushalli sunnatad dhuha rak'ataini lillahi ta'ala.",
      },
      {
        name: "Tahajud",
        rakaat: "2 rakaat salam (berulang)",
        time: "Malam hari (utama setelah tidur)",
        intention: "Ushalli sunnatat tahajjudi rak'ataini lillahi ta'ala.",
      },
      {
        name: "Witir",
        rakaat: "1 rakaat atau bilangan ganjil",
        time: "Setelah Isya hingga sebelum Subuh",
        intention: "Ushalli sunnatal witri rak'atan lillahi ta'ala.",
      },
      {
        name: "Istikharah",
        rakaat: "2 rakaat",
        time: "Saat meminta petunjuk pilihan",
        intention: "Ushalli sunnatal istikharati rak'ataini lillahi ta'ala.",
      },
    ],
    illustrations: [
      { title: "Posisi Berdiri", caption: "Berdiri tegak, pandangan ke tempat sujud.", kind: "shalat-berdiri" },
      { title: "Ruku", caption: "Punggung rata, tangan memegang lutut.", kind: "shalat-ruku" },
      { title: "Sujud", caption: "Dahi dan hidung menempel tempat sujud.", kind: "shalat-sujud" },
      { title: "Duduk", caption: "Duduk di antara dua sujud/tasyahud dengan tenang.", kind: "shalat-duduk" },
    ],
    sections: [
      {
        heading: "Persiapan Sebelum Sholat",
        items: [
          "Pastikan suci dari hadas kecil/besar, pakaian dan tempat bersih dari najis.",
          "Menutup aurat dan menghadap kiblat.",
          "Pastikan waktu sholat sudah masuk.",
        ],
      },
      {
        heading: "Urutan Inti Sholat",
        items: [
          "Niat dalam hati sesuai sholat yang akan dikerjakan.",
          "Takbiratul ihram sambil berdiri bagi yang mampu.",
          "Membaca Al-Fatihah di setiap rakaat.",
          "Ruku, i'tidal, sujud, duduk di antara dua sujud dengan tuma'ninah.",
          "Tasyahud akhir, shalawat Nabi, lalu salam.",
        ],
      },
      {
        heading: "Jumlah Rakaat Sholat Fardhu",
        items: [
          "Subuh: 2 rakaat",
          "Zuhur: 4 rakaat",
          "Asar: 4 rakaat",
          "Maghrib: 3 rakaat",
          "Isya: 4 rakaat",
        ],
      },
    ],
    notes: [
      "Fokuskan dulu pada urutan gerakan yang benar, lalu bacaan disempurnakan bertahap.",
      "Jika ada perbedaan detail fiqih (misalnya posisi tangan), ikuti bimbingan ustadz/guru setempat yang kamu jadikan rujukan.",
      "Untuk makmum/imam, sebagian lafal niat bisa ditambah kata ma'muman/imaman sesuai penjelasan ulama.",
    ],
    references: [
      { label: "NU Online: Tata Cara Pelaksanaan Shalat Fardhu Lima Waktu", url: "https://nu.or.id/shalat/tata-cara-pelaksanaan-shalat-fardhu-lima-waktu-HiNmU" },
      { label: "NU Online: Tata Cara Shalat Rawatib (niat, dalil, waktu)", url: "https://islam.nu.or.id/shalat/tata-cara-shalat-rawatib-niat-dalil-waktu-dan-fungsinya-ga01H" },
      { label: "NU Online: Ini Lafal Niat Shalat Dhuha", url: "https://islam.nu.or.id/shalat/ini-lafal-niat-shalat-dhuha-RLfwL" },
      { label: "NU Online: Ini Lafal Niat Shalat Tahajud", url: "https://islam.nu.or.id/shalat/ini-lafal-niat-shalat-tahajud-cbA7o" },
      { label: "NU Online: Shalat Istikharah Lengkap", url: "https://islam.nu.or.id/shalat/shalat-istikharah-lengkap-tata-cara-doa-dan-terjemahnya-c6Ly4" },
      { label: "NU Online: Shalat Witir (niat dan tata cara)", url: "https://islam.nu.or.id/ramadhan/shalat-witir-pengertian-rakaat-tata-cara-dan-niatnya-pcfG7" },
      { label: "Sahih Bukhari 631: 'Shalatlah sebagaimana kalian melihat aku shalat'", url: "https://sunnah.com/bukhari/10/28" },
    ],
  },
  wudhu: {
    slug: "wudhu",
    title: "Cara Wudhu",
    subtitle: "Bersuci dari hadas kecil sebagai syarat sah sholat.",
    focus: ["Rukun wudhu", "Urutan anggota", "Tidak berlebihan air"],
    intentionIntro:
      "Niat wudhu dibaca saat mulai bersuci sebagai bentuk kesengajaan mengangkat hadas kecil.",
    intentions: [
      {
        label: "Niat Wudhu",
        arabic: "نَوَيْتُ الْوُضُوْءَ لِرَفْعِ الْحَدَثِ الْأَصْغَرِ فَرْضًا لِلّٰهِ تَعَالَى",
        latin: "Nawaitul wudhu'a liraf'il hadatsil ashghari fardhan lillahi ta'ala.",
        meaning: "Saya niat berwudhu untuk menghilangkan hadas kecil fardu karena Allah Ta'ala.",
      },
    ],
    illustrations: [
      { title: "Basuh Wajah", caption: "Ratakan air ke seluruh batas wajah.", kind: "wudhu-wajah" },
      { title: "Basuh Tangan", caption: "Sampai siku, dahulukan kanan lalu kiri.", kind: "wudhu-tangan" },
      { title: "Usap Kepala", caption: "Usap sebagian kepala dengan air.", kind: "wudhu-kepala" },
      { title: "Basuh Kaki", caption: "Sampai mata kaki dan sela jari kaki.", kind: "wudhu-kaki" },
    ],
    sections: [
      {
        heading: "Rukun Wudhu (Inti Wajib)",
        items: [
          "Niat wudhu.",
          "Membasuh wajah.",
          "Membasuh kedua tangan hingga siku.",
          "Mengusap sebagian kepala.",
          "Membasuh kedua kaki hingga mata kaki.",
          "Tertib (berurutan).",
        ],
      },
      {
        heading: "Praktik Ringkas",
        items: [
          "Mulai dengan basmalah dan cuci telapak tangan.",
          "Berkumur dan membersihkan hidung (sunnah muakkadah).",
          "Lakukan rukun wudhu sesuai urutan.",
          "Akhiri dengan doa setelah wudhu.",
        ],
      },
      {
        heading: "Pembatal Wudhu (Ringkas)",
        items: [
          "Keluar sesuatu dari qubul/dubur.",
          "Hilang akal (tidur nyenyak, pingsan, mabuk).",
          "Bersentuhan kulit laki-laki/perempuan non-mahram menurut sebagian mazhab.",
          "Menyentuh kemaluan dengan telapak tangan menurut sebagian pendapat.",
        ],
      },
    ],
    notes: [
      "Untuk perbedaan rincian antar mazhab, konsultasikan ke guru fiqih yang kamu ikuti.",
      "Utamakan wudhu tenang dan merata, bukan cepat-cepat.",
    ],
    references: [
      { label: "NU Online: Tata Cara Wudhu Lengkap", url: "https://islam.nu.or.id/syariah/tata-cara-wudhu-lengkap-niat-teknis-dan-doanya-ghUvt" },
      { label: "Qur'an 5:6 (ayat wudhu dan tayamum)", url: "https://legacy.quran.com/5/6" },
      { label: "Sahih Bukhari 164 (riwayat wudhu Utsman)", url: "https://sunnah.com/bukhari:164" },
    ],
  },
  "mandi-wajib": {
    slug: "mandi-wajib",
    title: "Cara Mandi Wajib (Mandi Junub)",
    subtitle: "Panduan bersuci dari hadas besar secara ringkas.",
    focus: ["Niat mengangkat hadas besar", "Air merata ke seluruh tubuh", "Ikuti adab mandi"],
    intentionIntro:
      "Niat mandi wajib dibaca di awal mandi untuk mengangkat hadas besar.",
    intentions: [
      {
        label: "Niat Mandi Wajib",
        arabic: "نَوَيْتُ الْغُسْلَ لِرَفْعِ الْحَدَثِ الْأَكْبَرِ فَرْضًا لِلّٰهِ تَعَالَى",
        latin: "Nawaitul ghusla liraf'il hadatsil akbari fardhan lillahi ta'ala.",
        meaning: "Saya niat mandi untuk menghilangkan hadas besar fardu karena Allah Ta'ala.",
      },
    ],
    illustrations: [
      { title: "Niat & Bersih Najis", caption: "Mulai dengan niat lalu bersihkan najis yang ada.", kind: "mandi-niat" },
      { title: "Wudhu", caption: "Lanjut berwudhu seperti wudhu sholat.", kind: "mandi-wudhu" },
      { title: "Siram Kepala", caption: "Pastikan pangkal rambut terkena air.", kind: "mandi-kepala" },
      { title: "Ratakan Air", caption: "Ratakan air ke seluruh bagian tubuh.", kind: "mandi-rata" },
    ],
    sections: [
      {
        heading: "Kapan Mandi Wajib Diperlukan",
        items: [
          "Setelah junub (hubungan suami-istri/keluar mani).",
          "Setelah haid atau nifas selesai (untuk muslimah).",
          "Saat kondisi hadas besar lainnya sesuai ketentuan fiqih.",
        ],
      },
      {
        heading: "Urutan Praktik Ringkas",
        items: [
          "Niat dalam hati untuk mengangkat hadas besar.",
          "Basuh tangan dan bersihkan najis/kotoran yang menempel.",
          "Berwudhu seperti wudhu sholat.",
          "Siram kepala hingga pangkal rambut (umumnya tiga kali).",
          "Ratakan air ke seluruh tubuh tanpa ada bagian yang tertinggal.",
        ],
      },
    ],
    notes: [
      "Bagian lipatan tubuh dan pangkal rambut perlu diperhatikan agar air merata.",
      "Jika masih bingung, praktikkan langsung dengan guru agar lebih mantap.",
    ],
    references: [
      { label: "NU Online: Niat, Cara, dan Adab Mandi Wajib", url: "https://islam.nu.or.id/thaharah/niat-cara-dan-adab-mandi-wajib-atau-mandi-junub-Km7xi" },
      { label: "Sahih Bukhari 248 (cara mandi janabah Nabi)", url: "https://sunnah.com/bukhari:248" },
      { label: "Qur'an 5:6 (perintah bersuci ketika junub)", url: "https://legacy.quran.com/5/6" },
    ],
  },
  tayamum: {
    slug: "tayamum",
    title: "Tayamum Dasar",
    subtitle: "Pengganti wudhu/mandi wajib saat ada uzur syar'i.",
    focus: ["Sebab tayamum", "Media debu/tanah suci", "Urutan wajah dan tangan"],
    intentionIntro:
      "Saat tayamum, niatkan untuk membolehkan sholat karena ada uzur menggunakan air.",
    intentions: [
      {
        label: "Niat Tayamum",
        arabic: "نَوَيْتُ التَّيَمُّمَ لِاسْتِبَاحَةِ الصَّلَاةِ فَرْضًا لِلّٰهِ تَعَالَى",
        latin: "Nawaitut tayammuma listibaahatish shalaati fardhan lillahi ta'ala.",
        meaning: "Saya niat tayamum agar diperbolehkan sholat fardu karena Allah Ta'ala.",
      },
    ],
    illustrations: [
      { title: "Tepuk Debu Suci", caption: "Gunakan debu/tanah suci yang bersih.", kind: "tayamum-tepuk" },
      { title: "Usap Wajah", caption: "Usap wajah dengan tangan yang sudah ditepukkan.", kind: "tayamum-wajah" },
      { title: "Usap Tangan", caption: "Usap kedua tangan sesuai tuntunan yang kamu ikuti.", kind: "tayamum-tangan" },
    ],
    sections: [
      {
        heading: "Kapan Tayamum Boleh Dilakukan",
        items: [
          "Tidak menemukan air setelah diupayakan.",
          "Ada sakit/uzur yang membuat penggunaan air berbahaya.",
          "Kondisi lain yang dibenarkan syariat.",
        ],
      },
      {
        heading: "Urutan Tayamum Ringkas",
        items: [
          "Niat tayamum untuk ibadah tertentu.",
          "Menepukkan telapak tangan ke debu/tanah suci.",
          "Mengusap wajah.",
          "Mengusap kedua tangan.",
        ],
      },
    ],
    notes: [
      "Setelah uzur hilang dan air tersedia, kembali bersuci dengan wudhu/mandi seperti biasa.",
      "Perincian teknis (sampai pergelangan/siku) bisa berbeda pendapat; ikuti bimbingan guru fiqih yang kamu rujuk.",
    ],
    references: [
      { label: "NU Online: Sebab dan Tata Cara Bertayamum", url: "https://islam.nu.or.id/syariah/sebab-dan-tata-cara-bertayamum-iVi4h" },
      { label: "Qur'an 5:6 (tayamum saat tidak ada air)", url: "https://legacy.quran.com/5/6" },
      { label: "Sahih Bukhari 339 (tayamum wajah dan tangan)", url: "https://sunnah.com/bukhari:339" },
    ],
  },
  dhuha: {
    slug: "dhuha",
    title: "Sholat Sunnah Dhuha",
    subtitle: "Sholat sunnah di pagi hari sebagai amalan pembuka aktivitas dengan keberkahan.",
    focus: ["Waktu dhuha", "Niat dhuha", "Rakaat minimal 2"],
    intentionIntro: "Niat dibaca saat takbiratul ihram atau dihadirkan dalam hati sebelum sholat.",
    intentions: [
      {
        label: "Niat Sholat Dhuha",
        arabic: "أُصَلِّيْ سُنَّةَ الضُّحَى رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatadh dhuha rak'ataini lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah dhuha dua rakaat karena Allah Ta'ala.",
      },
    ],
    illustrations: [
      { title: "Niat & Takbir", caption: "Mulai sholat seperti sholat sunnah pada umumnya.", kind: "shalat-berdiri" },
      { title: "Ruku", caption: "Ruku dengan tuma'ninah.", kind: "shalat-ruku" },
      { title: "Sujud", caption: "Sujud dua kali tiap rakaat.", kind: "shalat-sujud" },
      { title: "Salam", caption: "Akhiri dengan salam, bisa lanjut rakaat berikutnya.", kind: "shalat-duduk" },
    ],
    sections: [
      {
        heading: "Waktu Pelaksanaan Dhuha",
        items: [
          "Dimulai setelah matahari naik (sekitar 15-20 menit setelah terbit).",
          "Berakhir sebelum masuk waktu Zuhur.",
          "Waktu utama saat matahari mulai terasa panas (menjelang siang).",
        ],
      },
      {
        heading: "Urutan Singkat",
        items: [
          "Niat sholat dhuha.",
          "Sholat 2 rakaat (boleh ditambah 4, 6, atau 8 dengan salam setiap 2 rakaat).",
          "Setelah salam, disunnahkan berdoa.",
        ],
      },
    ],
    notes: [
      "Lakukan 2 rakaat rutin lebih baik daripada banyak tapi jarang.",
      "Untuk bacaan surat setelah Al-Fatihah, boleh menyesuaikan hafalan yang kamu punya.",
    ],
    references: [
      { label: "NU Online: Ini Lafal Niat Shalat Dhuha", url: "https://islam.nu.or.id/shalat/ini-lafal-niat-shalat-dhuha-RLfwL" },
      { label: "Sunnah.com: Pencarian Hadits tentang Dhuha", url: "https://sunnah.com/search?q=duha+prayer" },
    ],
  },
  jumat: {
    slug: "jumat",
    title: "Sholat Jumat",
    subtitle: "Panduan ringkas pelaksanaan sholat Jumat dari persiapan hingga selesai.",
    focus: ["Syarat wajib Jumat", "Khutbah dua kali", "Sholat 2 rakaat berjamaah"],
    intentionIntro: "Niat Jumat dihadirkan saat memulai sholat Jumat sebagai makmum atau imam.",
    intentions: [
      {
        label: "Niat Sholat Jumat (Makmum)",
        arabic: "أُصَلِّي فَرْضَ الْجُمُعَةِ رَكْعَتَيْنِ مَأْمُومًا لِلّٰهِ تَعَالَى",
        latin: "Ushalli fardhal jumu'ati rak'ataini ma'muuman lillahi ta'ala.",
        meaning: "Saya niat sholat Jumat dua rakaat sebagai makmum karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Persiapan Sebelum Jumat",
        items: [
          "Mandi, berpakaian bersih, memakai wewangian secukupnya.",
          "Datang lebih awal ke masjid dan memperbanyak dzikir/shalawat.",
          "Menjaga adab selama khutbah: diam dan menyimak.",
        ],
      },
      {
        heading: "Rangkaian Pelaksanaan",
        items: [
          "Khutbah pertama oleh khatib.",
          "Khutbah kedua dengan rukun khutbah terpenuhi.",
          "Sholat Jumat 2 rakaat berjamaah dipimpin imam.",
        ],
      },
    ],
    notes: [
      "Jika terlambat dan tidak mendapat satu rakaat bersama imam, maka ganti dengan sholat Zuhur.",
      "Jaga kekhusyukan saat khutbah karena mendengarkan khutbah adalah bagian penting Jumat.",
    ],
    references: [
      { label: "Qur'an 62:9 (perintah menuju shalat Jumat)", url: "https://quran.com/62/9" },
      { label: "Sunnah.com: Pencarian Hadits tentang Jumat", url: "https://sunnah.com/search?q=jummah+prayer" },
    ],
  },
  jenazah: {
    slug: "jenazah",
    title: "Sholat Jenazah",
    subtitle: "Sholat fardu kifayah untuk mendoakan muslim yang wafat.",
    focus: ["Empat takbir", "Tanpa ruku/sujud", "Doa untuk jenazah"],
    intentionIntro: "Niat sholat jenazah dibaca sesuai posisi sebagai imam atau makmum.",
    intentions: [
      {
        label: "Niat Sholat Jenazah (Makmum)",
        arabic: "أُصَلِّي عَلَى هَذَا الْمَيِّتِ أَرْبَعَ تَكْبِيْرَاتٍ فَرْضَ الْكِفَايَةِ مَأْمُومًا لِلّٰهِ تَعَالَى",
        latin: "Ushalli 'ala hadzal mayyiti arba'a takbiraatin fardhal kifaayati ma'muuman lillahi ta'ala.",
        meaning: "Saya niat sholat atas jenazah ini empat takbir fardu kifayah sebagai makmum karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Urutan Sholat Jenazah",
        items: [
          "Takbir pertama lalu membaca Al-Fatihah.",
          "Takbir kedua lalu membaca shalawat Nabi.",
          "Takbir ketiga lalu membaca doa untuk jenazah.",
          "Takbir keempat lalu doa singkat dan salam.",
        ],
      },
      {
        heading: "Posisi Imam",
        items: [
          "Untuk jenazah laki-laki, imam sejajar kepala jenazah.",
          "Untuk jenazah perempuan, imam sejajar bagian tengah tubuh jenazah.",
        ],
      },
    ],
    notes: [
      "Sholat jenazah tidak memakai ruku dan sujud.",
      "Gunakan doa jenazah yang kamu pelajari dari guru setempat agar bacaan lebih mantap.",
    ],
    references: [
      { label: "Sunnah.com: Pencarian Hadits Shalat Jenazah", url: "https://sunnah.com/search?q=funeral+prayer" },
      { label: "Sunnah.com: Bab Funerals (Bukhari)", url: "https://sunnah.com/bukhari/23" },
    ],
  },
  "sujud-sahwi": {
    slug: "sujud-sahwi",
    title: "Sujud Sahwi",
    subtitle: "Sujud karena lupa dalam sholat, biasanya dilakukan dua kali sebelum salam.",
    focus: ["Ketika lupa dalam sholat", "Dua sujud sahwi", "Tetap tenang dan lanjutkan sholat"],
    sections: [
      {
        heading: "Kapan Sujud Sahwi Dilakukan",
        items: [
          "Lupa tasyahud awal menurut mayoritas pembahasan fiqih.",
          "Ragu jumlah rakaat lalu mengambil yang lebih yakin.",
          "Terjadi tambahan/kekurangan gerakan karena lupa.",
        ],
      },
      {
        heading: "Cara Singkat Sujud Sahwi",
        items: [
          "Setelah tasyahud akhir, lakukan sujud dua kali seperti sujud biasa.",
          "Baca dzikir sujud seperti biasa (boleh ditambah doa sujud sahwi sesuai riwayat).",
          "Duduk sejenak, lalu salam.",
        ],
      },
    ],
    notes: [
      "Rincian sujud sahwi dapat berbeda antarmazhab; ikuti bimbingan guru yang kamu jadikan rujukan.",
      "Jika ragu, utamakan ketenangan dan lanjutkan sholat, lalu lakukan sujud sahwi sesuai kaidah.",
    ],
    references: [
      { label: "Sunnah.com: Pencarian Hadits Sujud Sahwi", url: "https://sunnah.com/search?q=sujud+sahwi" },
      { label: "Sahih Muslim: Riwayat sujud sahwi", url: "https://sunnah.com/muslim:572" },
    ],
  },
  tahajud: {
    slug: "tahajud",
    title: "Sholat Tahajud",
    subtitle: "Sholat malam yang sangat dianjurkan sebagai ibadah sunnah utama.",
    focus: ["Waktu malam", "Niat tahajud", "Rakaat 2 salam"],
    intentionIntro: "Niat tahajud dihadirkan sebelum takbiratul ihram.",
    intentions: [
      {
        label: "Niat Sholat Tahajud",
        arabic: "أُصَلِّيْ سُنَّةَ التَّهَجُّدِ رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatat tahajjudi rak'ataini lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah tahajud dua rakaat karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Waktu Tahajud",
        items: [
          "Dilakukan setelah sholat Isya sampai sebelum Subuh.",
          "Utama: sepertiga malam terakhir.",
          "Lebih baik setelah tidur terlebih dahulu.",
        ],
      },
      {
        heading: "Cara Praktik Ringkas",
        items: [
          "Sholat 2 rakaat salam, lalu boleh diulang sesuai kemampuan.",
          "Baca surat yang mudah setelah Al-Fatihah.",
          "Akhiri dengan witir jika belum witir.",
        ],
      },
    ],
    notes: [
      "Jaga konsistensi walau sedikit rakaat.",
      "Utamakan kekhusyukan dan doa di akhir malam.",
    ],
    references: [
      { label: "NU Online: Ini Lafal Niat Shalat Tahajud", url: "https://islam.nu.or.id/shalat/ini-lafal-niat-shalat-tahajud-cbA7o" },
      { label: "Sunnah.com: Pencarian Hadits Tahajjud", url: "https://sunnah.com/search?q=tahajjud+prayer" },
    ],
  },
  witir: {
    slug: "witir",
    title: "Sholat Witir",
    subtitle: "Sholat sunnah dengan rakaat ganjil sebagai penutup sholat malam.",
    focus: ["Rakaat ganjil", "Penutup malam", "Niat witir"],
    intentionIntro: "Niat witir dibaca sesuai jumlah rakaat yang dikerjakan.",
    intentions: [
      {
        label: "Niat Sholat Witir (1 rakaat)",
        arabic: "أُصَلِّيْ سُنَّةَ الْوِتْرِ رَكْعَةً لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatal witri rak'atan lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah witir satu rakaat karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Waktu dan Rakaat Witir",
        items: [
          "Waktu: setelah Isya hingga sebelum Subuh.",
          "Bisa 1, 3, 5, atau bilangan ganjil lainnya.",
          "Untuk pemula, mulai dari 1 atau 3 rakaat.",
        ],
      },
      {
        heading: "Cara Ringkas",
        items: [
          "Kerjakan setelah tahajud atau setelah Isya jika khawatir tidak bangun malam.",
          "Jadikan witir penutup sholat malam.",
        ],
      },
    ],
    notes: [
      "Boleh witir di awal malam bila khawatir tertidur.",
      "Jika bangun malam setelah witir, mayoritas ulama tidak menganjurkan witir dua kali.",
    ],
    references: [
      { label: "NU Online: Shalat Witir (niat dan tata cara)", url: "https://islam.nu.or.id/ramadhan/shalat-witir-pengertian-rakaat-tata-cara-dan-niatnya-pcfG7" },
      { label: "Sunnah.com: Pencarian Hadits Witr", url: "https://sunnah.com/search?q=witr+prayer" },
    ],
  },
  istikharah: {
    slug: "istikharah",
    title: "Sholat Istikharah",
    subtitle: "Sholat sunnah untuk meminta petunjuk Allah dalam memilih satu urusan.",
    focus: ["Niat istikharah", "2 rakaat", "Doa setelah sholat"],
    intentionIntro: "Niat istikharah dihadirkan saat memulai sholat.",
    intentions: [
      {
        label: "Niat Sholat Istikharah",
        arabic: "أُصَلِّيْ سُنَّةَ الاِسْتِخَارَةِ رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatal istikharati rak'ataini lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah istikharah dua rakaat karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Kapan Istikharah Dilakukan",
        items: [
          "Saat dihadapkan pada pilihan yang mubah dan penting.",
          "Bukan untuk memilih perkara yang sudah jelas wajib/haram.",
        ],
      },
      {
        heading: "Cara Praktik Ringkas",
        items: [
          "Sholat 2 rakaat sunnah.",
          "Setelah salam, baca doa istikharah.",
          "Lanjutkan dengan ikhtiar dan musyawarah, lalu ambil keputusan yang paling menenangkan hati.",
        ],
      },
    ],
    notes: [
      "Istikharah bukan menunggu mimpi; yang utama adalah kemantapan setelah doa dan ikhtiar.",
      "Bisa diulang jika masih ragu.",
    ],
    references: [
      { label: "NU Online: Shalat Istikharah Lengkap", url: "https://islam.nu.or.id/shalat/shalat-istikharah-lengkap-tata-cara-doa-dan-terjemahnya-c6Ly4" },
      { label: "Sunnah.com: Pencarian Hadits Istikhara", url: "https://sunnah.com/search?q=istikharah" },
    ],
  },
  taubat: {
    slug: "taubat",
    title: "Sholat Taubat",
    subtitle: "Sholat sunnah untuk mengiringi taubat nasuha dan memohon ampunan Allah.",
    focus: ["Niat taubat", "2 rakaat", "Istighfar dan tekad tidak mengulangi"],
    intentionIntro: "Niat sholat taubat dihadirkan saat memulai sholat.",
    intentions: [
      {
        label: "Niat Sholat Taubat",
        arabic: "أُصَلِّيْ سُنَّةَ التَّوْبَةِ رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatat taubati rak'ataini lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah taubat dua rakaat karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Langkah Taubat yang Disarankan",
        items: [
          "Menyesal atas dosa yang telah dilakukan.",
          "Berhenti dari dosa tersebut saat ini juga.",
          "Bertekad kuat tidak mengulangi lagi.",
          "Jika terkait hak orang lain, kembalikan haknya atau minta maaf.",
        ],
      },
      {
        heading: "Cara Sholat Taubat Ringkas",
        items: [
          "Sholat 2 rakaat seperti sholat sunnah biasa.",
          "Setelah salam, perbanyak istighfar dan doa taubat.",
          "Lanjutkan dengan memperbaiki amal dan menjauhi sebab dosa.",
        ],
      },
    ],
    notes: [
      "Taubat bisa dilakukan kapan saja selain waktu yang dilarang sholat sunnah.",
      "Inti taubat ada pada kejujuran hati dan perubahan perilaku setelahnya.",
    ],
    references: [
      { label: "Sunnah.com: Pencarian Hadits tentang Taubat", url: "https://sunnah.com/search?q=repentance+prayer" },
      { label: "Qur'an 39:53 (jangan berputus asa dari rahmat Allah)", url: "https://quran.com/39/53" },
    ],
  },
  hajat: {
    slug: "hajat",
    title: "Sholat Hajat",
    subtitle: "Sholat sunnah saat memohon pertolongan Allah untuk kebutuhan yang baik.",
    focus: ["Niat hajat", "2 rakaat", "Doa hajat setelah sholat"],
    intentionIntro: "Niat sholat hajat dihadirkan sebelum takbiratul ihram.",
    intentions: [
      {
        label: "Niat Sholat Hajat",
        arabic: "أُصَلِّيْ سُنَّةَ الْحَاجَةِ رَكْعَتَيْنِ لِلّٰهِ تَعَالَى",
        latin: "Ushalli sunnatal haajati rak'ataini lillahi ta'ala.",
        meaning: "Saya niat sholat sunnah hajat dua rakaat karena Allah Ta'ala.",
      },
    ],
    sections: [
      {
        heading: "Kapan Sholat Hajat Dilakukan",
        items: [
          "Saat memiliki kebutuhan atau urusan penting yang mubah.",
          "Dilakukan dengan adab doa: yakin, rendah hati, dan berharap kepada Allah.",
        ],
      },
      {
        heading: "Cara Ringkas",
        items: [
          "Sholat 2 rakaat seperti sholat sunnah biasa.",
          "Setelah salam, panjatkan doa hajat dengan menyebut kebutuhan secara spesifik.",
          "Tetap diiringi ikhtiar dan tawakal.",
        ],
      },
    ],
    notes: [
      "Utamakan permohonan untuk kebaikan dunia dan akhirat.",
      "Perbanyak doa di waktu mustajab seperti sepertiga malam.",
    ],
    references: [
      { label: "Sunnah.com: Pencarian Hadits tentang kebutuhan/doa", url: "https://sunnah.com/search?q=need+dua+prayer" },
      { label: "Qur'an 2:186 (Allah dekat dan mengabulkan doa)", url: "https://quran.com/2/186" },
    ],
  },
  "baca-quran": {
    slug: "baca-quran",
    title: "Belajar Baca Al-Qur'an",
    subtitle: "Langkah bertahap agar bacaan makin benar, tartil, dan konsisten.",
    focus: ["Huruf hijaiyah", "Makhraj huruf", "Tajwid dasar"],
    intentionIntro:
      "Belajar membaca Al-Qur'an dimulai dengan niat ikhlas dan adab yang baik terhadap mushaf serta bacaan.",
    intentions: [
      {
        label: "Niat Belajar Al-Qur'an (Anjuran)",
        arabic: "نَوَيْتُ تَعَلُّمَ الْقُرْآنِ لِلّٰهِ تَعَالَى",
        latin: "Nawaitu ta'allumal qur'ani lillahi ta'ala.",
        meaning: "Saya niat belajar Al-Qur'an karena Allah Ta'ala.",
      },
    ],
    illustrations: [
      { title: "Huruf Hijaiyah", caption: "Kenali bentuk huruf dan bunyinya.", kind: "quran-hijaiyah" },
      { title: "Makhraj", caption: "Latih tempat keluar huruf secara bertahap.", kind: "quran-makhraj" },
      { title: "Tajwid", caption: "Mulai dari hukum nun mati/tanwin dan mad.", kind: "quran-tajwid" },
      { title: "Latihan Harian", caption: "Ulangi bacaan sedikit tapi konsisten.", kind: "quran-rutin" },
    ],
    tajwidRules: [
      {
        title: "Nun Mati / Tanwin",
        rules: [
          {
            name: "Izhar Halqi",
            detail: "Dibaca jelas ketika bertemu huruf halqi (ء ه ع ح غ خ).",
            example: "مِنْهُمْ (nun mati bertemu ha)",
          },
          {
            name: "Idgham Bighunnah",
            detail: "Masuk disertai dengung jika bertemu ي ن م و.",
            example: "مِنْ وَالٍ (nun mati bertemu waw)",
          },
          {
            name: "Idgham Bilaghunnah",
            detail: "Masuk tanpa dengung jika bertemu ل atau ر.",
            example: "مِنْ رَبِّهِمْ (nun mati bertemu ra)",
          },
          {
            name: "Iqlab",
            detail: "Nun mati/tanwin berubah bunyi mim samar saat bertemu ب.",
            example: "سَمِيعٌ بَصِيرٌ (tanwin bertemu ba)",
          },
          {
            name: "Ikhfa Haqiqi",
            detail: "Dibaca samar berdengung saat bertemu 15 huruf ikhfa.",
            example: "مِنْ شَرِّ (nun mati bertemu syin)",
          },
        ],
      },
      {
        title: "Mim Mati",
        rules: [
          {
            name: "Ikhfa Syafawi",
            detail: "Mim mati bertemu ب, dibaca samar berdengung.",
            example: "تَرْمِيهِمْ بِحِجَارَةٍ",
          },
          {
            name: "Idgham Mimi",
            detail: "Mim mati bertemu mim, dibaca masuk dengan dengung.",
            example: "لَكُمْ مَا",
          },
          {
            name: "Izhar Syafawi",
            detail: "Mim mati bertemu selain mim dan ba, dibaca jelas.",
            example: "عَلَيْهِمْ صَلَوَاتٌ",
          },
        ],
      },
      {
        title: "Mad (Panjang Bacaan)",
        rules: [
          { name: "Mad Thabi'i", detail: "Panjang 2 harakat (mad dasar).", example: "قَالَ" },
          {
            name: "Mad Wajib Muttasil",
            detail: "Mad bertemu hamzah dalam satu kata, panjang 4-5 harakat.",
            example: "جَاءَ",
          },
          {
            name: "Mad Jaiz Munfasil",
            detail: "Mad bertemu hamzah di kata berikutnya, umumnya 4-5 harakat.",
            example: "فِي أَنْفُسِكُمْ",
          },
          {
            name: "Mad 'Aridh Lissukun",
            detail: "Panjang karena waqaf di akhir kata, boleh 2/4/6 harakat.",
            example: "الْعَالَمِينَ (saat waqaf)",
          },
          { name: "Mad Lazim", detail: "Mad yang harus dipanjangkan 6 harakat.", example: "الضَّالِّينَ" },
        ],
      },
      {
        title: "Hukum Lain yang Sering Muncul",
        rules: [
          { name: "Qalqalah", detail: "Pantulan bunyi pada huruf ق ط ب ج د saat sukun.", example: "أَحَدْ" },
          {
            name: "Lam Tafkhim / Tarqiq",
            detail: "Lafaz Allah dibaca tebal atau tipis sesuai harakat sebelumnya.",
            example: "اللَّهُ / بِاللَّهِ",
          },
          {
            name: "Ra Tafkhim / Tarqiq",
            detail: "Huruf ra dibaca tebal atau tipis sesuai kaidah.",
            example: "رَحْمٰن (tebal) / فِرْعَوْن (tipis pada posisi tertentu)",
          },
          { name: "Ghunnah", detail: "Dengung pada nun/mim bertasydid selama 2 harakat.", example: "إِنَّ / ثُمَّ" },
        ],
      },
    ],
    tajwidQuiz: [
      {
        question: "Pada lafal سَمِيعٌ بَصِيرٌ, hukum tanwin bertemu ب adalah...",
        options: ["Iqlab", "Izhar Halqi", "Qalqalah", "Mad Lazim"],
        answer: "Iqlab",
      },
      {
        question: "Pada lafal مِنْهُمْ, hukum nun mati bertemu هـ adalah...",
        options: ["Izhar Halqi", "Idgham Mimi", "Ikhfa Syafawi", "Mad Thabi'i"],
        answer: "Izhar Halqi",
      },
      {
        question: "Pada lafal تَرْمِيهِمْ بِحِجَارَةٍ, mim mati bertemu ب termasuk...",
        options: ["Ikhfa Syafawi", "Idgham Bilaghunnah", "Izhar Syafawi", "Qalqalah"],
        answer: "Ikhfa Syafawi",
      },
      {
        question: "Mad yang panjangnya wajib 6 harakat disebut...",
        options: ["Mad Lazim", "Mad Thabi'i", "Mad Jaiz Munfasil", "Mad 'Aridh Lissukun"],
        answer: "Mad Lazim",
      },
      {
        question: "Pantulan bunyi pada huruf ق ط ب ج د saat sukun disebut...",
        options: ["Qalqalah", "Ghunnah", "Iqlab", "Izhar Syafawi"],
        answer: "Qalqalah",
      },
    ],
    sections: [
      {
        heading: "Tahap Belajar yang Disarankan",
        items: [
          "Tahap 1: Kuasai huruf hijaiyah (bentuk + bunyi).",
          "Tahap 2: Latih makhraj huruf (tempat keluarnya huruf).",
          "Tahap 3: Pelajari harakat, mad (panjang-pendek), dan waqaf.",
          "Tahap 4: Mulai tajwid dasar (nun mati/tanwin, mim mati, qalqalah, dll).",
          "Tahap 5: Murajaah rutin 10-15 menit per hari.",
        ],
      },
      {
        heading: "Pola Latihan Harian",
        items: [
          "5 menit pemanasan makhraj huruf sulit (contoh: kha, 'ain, qaf).",
          "5 menit baca perlahan dengan fokus tajwid.",
          "5 menit ulang ayat yang sama sampai bacaan stabil.",
        ],
      },
    ],
    notes: [
      "Belajar baca Qur'an paling efektif dengan talaqqi/musyafahah (dibimbing guru), bukan mandiri penuh.",
      "Gunakan menu Al-Qur'an di aplikasi ini untuk latihan bacaan harian setelah dapat dasar.",
    ],
    references: [
      { label: "Kemenag Jateng: Hukum Mempelajari Ilmu Tajwid", url: "https://jateng.kemenag.go.id/hukum-mempelajari-ilmu-tajwid/" },
      { label: "Kemenag Kota Yogyakarta: Kajian Ilmu Tajwid (tartil)", url: "https://yogyakartakota.kemenag.go.id/kajian-ilmu-tajwid-episode-1-mukadimah/" },
      { label: "Qur'an 96:1 (Iqra - perintah membaca)", url: "https://quran.com/96?translations=20" },
    ],
  },
};

function renderLearningIndex(req, res) {
  const fiqihGuideLinks = fiqihGuides.map((item) => ({
    ...item,
    href: `/belajar/${item.slug}`,
  }));

  const quranTrackPath = {
    ...quranLearningPath,
    href: `/belajar/${quranLearningPath.slug}`,
  };

  return res.render("pages/learning/index", {
    title: "Belajar Ibadah - Prayer Streak",
    fiqihGuides: fiqihGuideLinks,
    quranLearningPath: quranTrackPath,
    weeklyPlan,
  });
}

function renderLearningDetail(req, res) {
  const { slug } = req.params;
  const topic = learningDetails[slug];

  if (!topic) {
    req.flash("error", "Materi belajar belum tersedia.");
    return res.redirect("/belajar");
  }

  const iqroSummaries = slug === "baca-quran" ? getIqroLevelSummaries() : [];
  const iqroInitialLevel = slug === "baca-quran" ? getIqroLevelDetail(1) : null;

  return res.render("pages/learning/detail", {
    title: `${topic.title} - Prayer Streak`,
    topic,
    iqroSummaries,
    iqroInitialLevel,
  });
}

function getIqroLevelsAction(req, res) {
  return res.json({
    levels: getIqroLevelSummaries(),
  });
}

function getIqroLevelDetailAction(req, res) {
  const detail = getIqroLevelDetail(req.params.level);
  if (!detail) {
    return res.status(404).json({
      message: "Level Iqro tidak ditemukan.",
    });
  }

  return res.json({
    level: detail,
  });
}

module.exports = {
  renderLearningIndex,
  renderLearningDetail,
  getIqroLevelsAction,
  getIqroLevelDetailAction,
};
