// Ganti URL di bawah ini dengan URL Web App dari Google Apps Script Anda
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzj_idRXjp2pLTm6R5JfnmMjlw3fTJGI77EcU7R1fe18eqi4jlvXlb4E2Rzmx90LccE_Q/exec";

// Fungsi untuk mengubah File fisik menjadi format Base64 string
const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve({
            base64: reader.result.split(',')[1], // Mengambil isi teks base64-nya saja
            mimeType: file.type
        });
        reader.onerror = error => reject(error);
    });
};

// Event Listener saat tombol "Simpan Data" ditekan
document.getElementById('pegawaiForm').addEventListener('submit', async function(e) {
    e.preventDefault(); // Mencegah halaman reload
    
    // Deklarasi elemen UI
    const submitBtn = document.getElementById('submitBtn');
    const statusMessage = document.getElementById('statusMessage');
    
    // Ubah tampilan tombol saat proses loading
    submitBtn.disabled = true;
    submitBtn.innerText = "Mengunggah data & file... Mohon tunggu";
    statusMessage.style.display = "none";

    // 1. Ambil data teks dari input HTML
    const payload = {
        id_pegawai: document.getElementById('id_pegawai').value,
        nama: document.getElementById('nama').value,
        // Tambahkan variabel lainnya di sini sesuai ID input yang Anda buat di HTML
    };

    try {
        // 2. Ambil elemen file dari HTML
        const fotoFile = document.getElementById('foto').files[0];
        const ktpFile = document.getElementById('ktp').files[0];
        // Tambahkan elemen file lainnya di sini...

        // 3. Konversi file yang dipilih menjadi Base64 sebelum dikirim
        // Peringatan: Pastikan ukuran total file tidak melebihi ~50MB agar tidak ditolak Apps Script
        if (fotoFile) payload.foto = await fileToBase64(fotoFile);
        if (ktpFile) payload.ktp = await fileToBase64(ktpFile);
        // Lakukan hal yang sama untuk file lainnya...

        // 4. Kirim data (payload) ke Google Apps Script via metode POST
        const response = await fetch(APPS_SCRIPT_URL, {
            method: "POST",
            body: JSON.stringify(payload)
        });

        // 5. Baca balasan (response) dari Google Apps Script
        const result = await response.json();

        if (result.status === "success") {
            // Jika berhasil
            statusMessage.innerText = "Sukses! " + result.message;
            statusMessage.style.color = "#155724"; // Warna teks hijau gelap
            statusMessage.style.backgroundColor = "#d4edda"; // Background hijau terang
            document.getElementById('pegawaiForm').reset(); // Kosongkan form
        } else {
            // Jika gagal dari sisi server
            throw new Error(result.message);
        }

    } catch (error) {
        // Tangkap error jika gagal koneksi atau error di skrip
        console.error(error);
        statusMessage.innerText = "Gagal: " + error.message;
        statusMessage.style.color = "#721c24"; // Warna teks merah gelap
        statusMessage.style.backgroundColor = "#f8d7da"; // Background merah terang
    } finally {
        // Kembalikan kondisi UI seperti semula setelah proses selesai
        statusMessage.style.display = "block";
        submitBtn.disabled = false;
        submitBtn.innerText = "Simpan Data";
    }
});
