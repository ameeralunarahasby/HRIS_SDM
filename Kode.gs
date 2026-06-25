// =============================================================================
// ⚙️ KONFIGURASI UTAMA
// =============================================================================
const FOLDER_UTAMA_ID = "1W0lBY5AxQpl0F4DdnsV3qoBLewjcFtwW"; 
const NAMA_SHEET_DATABASE = "Data Pegawai"; 
const NAMA_SHEET_PENGATURAN = "Pengaturan"; 

// Struktur Kolom (Harus Konsisten Antara Form Baru, Edit, dan Headers di Sheets)
const formKeys = [
  'id_pegawai', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'nip', 'status_pegawai', 
  'kelompok_pegawai', 'golongan', 'tmt_pangkat', 'kelompok_jabatan', 'jabatan', 'tmt_jabatan', 
  'masuk_rs', 'masa_kerja', 'tmt_cpns', 'bup', 'tmt_pensiun', 'status_keluarga', 'no_kk', 
  'pasangan', 'jml_anak', 'anak1', 'anak2', 'anak3', 'alamat', 'jenjang', 'fakultas', 
  'jurusan', 'asal_pendidikan', 'ruangan', 'tmt_nota', 'bpjs_kesehatan', 'ketenagakerjaan_taspen', 
  'npwp', 'no_hp', 'email', 'file_foto', 'file_ktp', 'file_kk', 'file_ijazah', 'file_transkrip', 
  'file_pangkat', 'file_jabatan', 'file_nota', 'file_bpjs', 'file_ketenagakerjaan_taspen', 'file_npwp'
];

const sheetHeaders = [
  'id_pegawai', 'nik', 'nama', 'tempat_lahir', 'tanggal_lahir', 'nip', 'status_pegawai', 
  'kelompok_pegawai', 'golongan', 'tmt_pangkat', 'kelompok_jabatan', 'jabatan', 'tmt_jabatan', 
  'masuk_rs', 'masa_kerja', 'tmt_cpns', 'bup', 'tmt_pensiun', 'status_keluarga', 'no_kk', 
  'pasangan', 'jml_anak', 'anak1', 'anak2', 'anak3', 'alamat', 'jenjang', 'fakultas', 
  'jurusan', 'asal_pendidikan', 'ruangan', 'tmt_nota', 'bpjs_kesehatan', 'ketenagakerjaan_taspen', 
  'npwp', 'no_hp', 'email', 'url_foto', 'url_ktp', 'url_kk', 'url_ijazah', 'url_transkrip', 
  'url_pangkat', 'url_jabatan', 'url_nota', 'url_bpjs', 'url_ketenagakerjaan_taspen', 'url_npwp'
];

// =============================================================================
// 1. GET DATA (Fungsi doGet)
// =============================================================================
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // A. Mengambil Data Dropdown Pengaturan
  if (action === 'getDropdown') { 
    var sheet = ss.getSheetByName(NAMA_SHEET_PENGATURAN); 
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet tidak ditemukan'})).setMimeType(ContentService.MimeType.JSON);
    var data = sheet.getDataRange().getValues(); 
    var dropdowns = { golongan: [], jabatan: [], ruangan: [], fakultas: [], jurusan: [] }; 
    for (var i = 1; i < data.length; i++) { 
      var kelompok = data[i][1] ? data[i][1].toString().toLowerCase().trim() : ""; 
      var keterangan = data[i][2] ? data[i][2].toString() : "";
      if (dropdowns.hasOwnProperty(kelompok)) dropdowns[kelompok].push(keterangan); 
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'success', data: dropdowns})).setMimeType(ContentService.MimeType.JSON); 
  }
  
  // B. Mengambil Semua Data Pegawai untuk Dashboard
  if (action === 'getPegawai') {
    var sheet = ss.getSheetByName(NAMA_SHEET_DATABASE);
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({status: 'success', data: []})).setMimeType(ContentService.MimeType.JSON);
    
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) return ContentService.createTextOutput(JSON.stringify({status: 'success', data: []})).setMimeType(ContentService.MimeType.JSON);
    
    var headers = data[0];
    var rows = [];
    for (var i = 1; i < data.length; i++) {
      var obj = {};
      for (var j = 0; j < headers.length; j++) {
        // Mengubah objek Date ke format string YYYY-MM-DD agar mudah dibaca HTML input
        if (data[i][j] instanceof Date) {
          obj[headers[j]] = Utilities.formatDate(data[i][j], Session.getScriptTimeZone(), "yyyy-MM-dd");
        } else {
          obj[headers[j]] = data[i][j];
        }
      }
      rows.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'success', data: rows})).setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// 2. POST DATA / UPDATE / DELETE (Fungsi doPost)
// =============================================================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || 'create'; // Default ke create jika tidak ada parameter aksi
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(NAMA_SHEET_DATABASE);
    if (!sheet) sheet = ss.insertSheet(NAMA_SHEET_DATABASE); 
    
    if (sheet.getLastRow() === 0) sheet.appendRow(sheetHeaders);

    var idPegawai = payload.id_pegawai;
    var namaPegawai = payload.nama || "Tanpa_Nama";
    var nip = payload.nip || "";

    // ------------------ PROSES HAPUS DATA ------------------
    if (action === 'delete') {
      var data = sheet.getDataRange().getValues();
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === idPegawai.toString()) {
          sheet.deleteRow(i + 1);
          return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data Pegawai Berhasil Dihapus!'})).setMimeType(ContentService.MimeType.JSON);
        }
      }
      return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'ID Pegawai tidak ditemukan'})).setMimeType(ContentService.MimeType.JSON);
    }

    // ------------------ PROSES EDIT / UPDATE DATA ------------------
    if (action === 'update') {
      var data = sheet.getDataRange().getValues();
      var rowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === idPegawai.toString()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Data Pegawai gagal diperbarui, ID tidak ditemukan'})).setMimeType(ContentService.MimeType.JSON);
      }

      var rootFolder = DriveApp.getFolderById(FOLDER_UTAMA_ID); 
      var subFolderName = namaPegawai + (nip ? "_" + nip : ""); 
      var folders = rootFolder.getFoldersByName(subFolderName); 
      var targetFolder = folders.hasNext() ? folders.next() : rootFolder.createFolder(subFolderName); 

      for (var j = 0; j < sheetHeaders.length; j++) {
        var header = sheetHeaders[j];
        var key = formKeys[j];
        var val = payload[key] !== undefined ? payload[key] : (payload[header] || "");

        if (val && typeof val === 'object' && val.base64) {
          try {
            var blob = Utilities.base64Decode(val.base64); 
            var fileName = key + "_" + namaPegawai.toString().replace(/\s+/g, '_'); 
            var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
            var file = targetFolder.createFile(fileBlob); 
            val = file.getUrl();
          } catch (fErr) { val = "Gagal upload: " + fErr.message; }
        } else if (val === "" && header.indexOf('url_') === 0) {
          // Jika saat edit berkas dikosongkan, gunakan url berkas lama agar tidak terhapus
          val = data[rowIndex - 1][j];
        }

        if (header === 'id_pegawai') val = idPegawai; // Kunci ID jangan berubah
        sheet.getRange(rowIndex, j + 1).setValue(val);
      }

      return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data Pegawai Berhasil Diperbarui!'})).setMimeType(ContentService.MimeType.JSON);
    }

    // ------------------ PROSES TAMBAH BARU (CREATE) ------------------
    if (action === 'create') {
      var rootFolder = DriveApp.getFolderById(FOLDER_UTAMA_ID); 
      var subFolderName = namaPegawai + (nip ? "_" + nip : ""); 
      var folders = rootFolder.getFoldersByName(subFolderName); 
      var targetFolder = folders.hasNext() ? folders.next() : rootFolder.createFolder(subFolderName); 

      var rowData = [];
      formKeys.forEach(function(key) { 
        var val = payload[key] || "";
        if (typeof val === 'object' && val.base64) { 
          try {
            var blob = Utilities.base64Decode(val.base64);
            var fileName = key + "_" + namaPegawai.toString().replace(/\s+/g, '_'); 
            var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
            var file = targetFolder.createFile(fileBlob); 
            val = file.getUrl();
          } catch (errFile) { val = "Gagal upload: " + errFile.message; }
        }
        rowData.push(val);
      });
      sheet.appendRow(rowData); 
      return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data & File Berhasil Disimpan!'})).setMimeType(ContentService.MimeType.JSON); 
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Terjadi kesalahan: ' + err.message})).setMimeType(ContentService.MimeType.JSON); 
  }
}
