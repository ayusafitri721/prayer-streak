const DAILY_REFLECTIONS = [
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Amal kecil yang konsisten lebih dicintai",
    excerpt:
      "Amalan yang paling dicintai Allah adalah amalan yang dikerjakan terus-menerus walaupun sedikit.",
    sourceLabel: "HR. Bukhari No. 6464",
    href: "/hadis/bukhari/6464",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Waktu adalah amanah yang harus dijaga",
    excerpt:
      "Demi masa. Sesungguhnya manusia berada dalam kerugian, kecuali yang beriman, beramal saleh, saling menasihati dalam kebenaran dan kesabaran.",
    sourceLabel: "QS. Al-'Asr: 1-3",
    href: "/quran/103",
    linkLabel: "Baca suratnya",
  },
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Kekuatan seorang muslim terlihat dari kesungguhannya",
    excerpt:
      "Mukmin yang kuat lebih Allah cintai daripada mukmin yang lemah. Bersungguh-sungguhlah pada hal yang bermanfaat bagimu dan mohonlah pertolongan kepada Allah.",
    sourceLabel: "HR. Muslim No. 2664",
    href: "/hadis/muslim/2664",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Setelah selesai satu urusan, lanjutkan kebaikan berikutnya",
    excerpt:
      "Maka apabila engkau telah selesai dari suatu urusan, tetaplah bekerja keras untuk urusan yang lain, dan hanya kepada Tuhanmu engkau berharap.",
    sourceLabel: "QS. Al-Insyirah: 7-8",
    href: "/quran/94",
    linkLabel: "Baca suratnya",
  },
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Disiplin dimulai dari meninggalkan yang tidak bermanfaat",
    excerpt:
      "Di antara tanda baiknya Islam seseorang adalah ia meninggalkan hal-hal yang tidak bermanfaat baginya.",
    sourceLabel: "HR. Tirmidzi No. 2318",
    href: "/hadis/tirmidzi/2318",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Allah melihat usaha yang kita lakukan",
    excerpt:
      "Katakanlah: bekerjalah kalian, maka Allah akan melihat pekerjaan kalian, begitu juga Rasul-Nya dan orang-orang beriman.",
    sourceLabel: "QS. At-Taubah: 105",
    href: "/quran/9",
    linkLabel: "Baca suratnya",
  },
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Niat yang lurus menjaga kebiasaan tetap bernilai",
    excerpt:
      "Sesungguhnya setiap amal tergantung pada niatnya, dan setiap orang akan mendapatkan sesuai dengan apa yang ia niatkan.",
    sourceLabel: "HR. Bukhari No. 1",
    href: "/hadis/bukhari/1",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Kesulitan tidak berlangsung selamanya",
    excerpt:
      "Karena sesungguhnya bersama kesulitan ada kemudahan. Sesungguhnya bersama kesulitan ada kemudahan.",
    sourceLabel: "QS. Al-Insyirah: 5-6",
    href: "/quran/94",
    linkLabel: "Baca suratnya",
  },
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Orang terbaik adalah yang paling bermanfaat",
    excerpt:
      "Sebaik-baik manusia adalah yang paling bermanfaat bagi manusia lainnya.",
    sourceLabel: "HR. Ibnu Majah No. 224",
    href: "/hadis/ibnu-majah/224",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Minta tambahan ilmu agar langkah tetap terarah",
    excerpt:
      "Dan katakanlah: Ya Tuhanku, tambahkanlah aku ilmu.",
    sourceLabel: "QS. Taha: 114",
    href: "/quran/20",
    linkLabel: "Baca suratnya",
  },
  {
    type: "hadis",
    eyebrow: "Hadis Penguat Hari Ini",
    title: "Konsistensi lahir dari sikap lembut pada diri sendiri",
    excerpt:
      "Permudahlah dan jangan mempersulit. Berilah kabar gembira dan jangan membuat orang lari.",
    sourceLabel: "HR. Bukhari No. 69",
    href: "/hadis/bukhari/69",
    linkLabel: "Baca hadis lengkap",
  },
  {
    type: "ayat",
    eyebrow: "Ayat Penguat Hari Ini",
    title: "Sabar dan salat adalah penolong dalam menjaga ritme",
    excerpt:
      "Mohonlah pertolongan dengan sabar dan salat. Sesungguhnya Allah bersama orang-orang yang sabar.",
    sourceLabel: "QS. Al-Baqarah: 153",
    href: "/quran/2",
    linkLabel: "Baca suratnya",
  },
];

function getDayOfYear() {
  const now = new Date();
  const start = new Date(now.getFullYear(), 0, 0);
  const diff = now - start;
  const oneDay = 1000 * 60 * 60 * 24;
  return Math.floor(diff / oneDay);
}

function getDailyReflection() {
  const index = getDayOfYear() % DAILY_REFLECTIONS.length;
  return DAILY_REFLECTIONS[index];
}

module.exports = {
  getDailyReflection,
};
