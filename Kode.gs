// =============================================================================
// ⚙️ KONFIGURASI UTAMA (Silakan Ubah Bagian Ini)
// =============================================================================

// 1. GANTI dengan ID Folder Google Drive Anda (Tempat folder data pegawai akan dibuat)
const FOLDER_UTAMA_ID = "1W0lBY5AxQpl0F4DdnsV3qoBLewjcFtwW"; 

// 2. Tentukan nama Sheet tempat menyimpan database utama pegawai
const NAMA_SHEET_DATABASE = "Data Pegawai"; 

// 3. Tentukan nama Sheet tempat data pilihan dropdown berada
const NAMA_SHEET_PENGATURAN = "Pengaturan";


// =============================================================================
// 1. GET DATA UNTUK DROPDOWN (Fungsi doGet)
// =============================================================================
function doGet(e) {
  if (e.parameter.action === 'getDropdown') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(NAMA_SHEET_PENGATURAN);
    
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({
        status: 'error', 
        message: 'Sheet Pengaturan tidak ditemukan'
      })).setMimeType(ContentService.MimeType.JSON);
    }
    
    var data = sheet.getDataRange().getValues();
    var dropdowns = { golongan: [], jabatan: [], ruangan: [], fakultas: [], jurusan: [] };
    
    // Looping data mulai baris ke-2 (index 1) karena baris ke-1 adalah Header
    for (var i = 1; i < data.length; i++) { 
      var kelompok = data[i][1] ? data[i][1].toString().toLowerCase().trim() : "";
      var keterangan = data[i][2] ? data[i][2].toString() : "";
      
      if (dropdowns.hasOwnProperty(kelompok)) {
        dropdowns[kelompok].push(keterangan);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', 
      data: dropdowns
    })).setMimeType(ContentService.MimeType.JSON);
  }
}


// =============================================================================
// 2. POST DATA & UPLOAD FILE KE GOOGLE DRIVE (Fungsi doPost)
// =============================================================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var namaPegawai = payload.nama_pegawai || "Tanpa_Nama";
    var nip = payload.nip || "";
    
    // --- Langkah A: Siapkan Folder Penyimpanan Pegawai ---
    var rootFolder = DriveApp.getFolderById(FOLDER_UTAMA_ID);
    // Membuat nama sub-folder unik berdasarkan Nama & NIP pegawai
    var subFolderName = namaPegawai + (nip ? "_" + nip : "");
    var folders = rootFolder.getFoldersByName(subFolderName);
    var targetFolder;
    
    // Jika folder pegawai sudah ada, gunakan folder tersebut. Jika belum, buat baru.
    if (folders.hasNext()) {
      targetFolder = folders.next();
    } else {
      targetFolder = rootFolder.createFolder(subFolderName);
    }
    
    // --- Langkah B: Siapkan Spreadsheet & Sheet Tujuan ---
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(NAMA_SHEET_DATABASE);
    if (!sheet) {
      // Jika sheet database belum ada, buat otomatis
      sheet = ss.insertSheet(NAMA_SHEET_DATABASE);
    }
    
    // --- Langkah C: Susunan Header Kolom Google Sheets ---
    // Pastikan ID/Key di bawah ini sama persis dengan atribut "id" atau "name" di form HTML Anda
    var headers = [
      'nama_pegawai', 'nip', 'nik', 'tempat_lahir', 'tanggal_lahir', 
      'jenis_kelamin', 'agama', 'status_perkawinan', 'jml_anak', 'kelompok_pegawai', 
      'golongan', 'jabatan', 'ruangan', 'fakultas', 'jurusan', 'status_pegawai', 
      'tgl_sk_awal', 'tmt_pegawai', 'masa_kerja', 'tmt_pensiun', 'alamat_ktp', 
      'alamat_domisili', 'no_hp', 'email_aktif', 'pendidikan_terakhir', 'asal_pendidikan',
      'bpjs_kesehatan', 'ketenagakerjaan_taspen', 'npwp',
      'file_foto', 'file_ktp', 'file_kk', 'file_ijazah', 'file_transkrip', 'file_pangkat',
      'file_jabatan', 'file_nota', 'file_bpjs', 'file_ketenagakerjaan_taspen', 'file_npwp'
    ];
    
    // Jika sheet masih kosong/baru, tulis nama-nama header di baris pertama
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    // --- Langkah D: Proses Pengisian Data & Konversi File ---
    var rowData = [];
    headers.forEach(function(header) {
      var val = payload[header] || "";
      
      // Jika mendeteksi ada objek file dalam bentuk Base64
      if (typeof val === 'object' && val.base64) {
         try {
            var blob = Utilities.base64Decode(val.base64);
            // Format nama file: NamaDokumen_NamaPegawai (Contoh: file_foto_Budi_Setiawan)
            var fileName = header + "_" + namaPegawai.toString().replace(/\s+/g, '_');
            
            var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
            var file = targetFolder.createFile(fileBlob); 
            
            // Mengubah value data base64 menjadi Link URL Google Drive aktif
            val = file.getUrl(); 
         } catch (errFile) {
            val = "Gagal upload: " + errFile.message;
         }
      }
      rowData.push(val);
    });
    
    // Memasukkan satu baris data pegawai baru ke spreadsheet
    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', 
      message: 'Data & File Berhasil Disimpan ke Folder ' + subFolderName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error', 
      message: 'Terjadi kesalahan sistem: ' + err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
