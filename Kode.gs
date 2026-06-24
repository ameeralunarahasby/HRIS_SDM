// =============================================================================
// ⚙️ KONFIGURASI UTAMA
// =============================================================================
const FOLDER_UTAMA_ID = "1W0lBY5AxQpl0F4DdnsV3qoBLewjcFtwW";
const NAMA_SHEET_DATABASE = "Data Pegawai";
const NAMA_SHEET_PENGATURAN = "Pengaturan";

// SUSUNAN KOLOM UTAMA SPREADSHEET (SINKRON DENGAN ATTRIBUT FORM)
const HEADERS_DATABASE = [
  'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
  'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
  'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
  'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
  'ruangan','tmt_nota','jenjang','fakultas','jurusan','asal_pendidikan',
  'bpjs_kesehatan','ketenagakerjaan_taspen','npwp',
  'file_foto','file_ktp','file_kk','file_ijazah','file_transkrip','file_pangkat',
  'file_jabatan','file_nota','file_bpjs','file_ketenagakerjaan_taspen','file_npwp'
];

// =============================================================================
// 1. FUNGSI GET DATA (doGet)
// =============================================================================
function doGet(e) {
  var action = e.parameter.action;
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  
  // A. Tarik Data Dropdown untuk Form
  if (action === 'getDropdown') {
    var sheet = ss.getSheetByName(NAMA_SHEET_PENGATURAN);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet Pengaturan tidak ditemukan'})).setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    var dropdowns = { golongan: [], jabatan: [], ruangan: [], ... { fakultas: [], jurusan: [] } };
    for (var i = 1; i < data.length; i++) { 
      var kelompok = data[i][1] ? data[i][1].toString().toLowerCase().trim() : "";
      var keterangan = data[i][2] ? data[i][2].toString() : "";
      if (dropdowns.hasOwnProperty(kelompok)) {
        dropdowns[kelompok].push(keterangan);
      }
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'success', data: dropdowns})).setMimeType(ContentService.MimeType.JSON);
  }
  
  // B. Tarik Semua Data Pegawai untuk Dashboard Tabel
  if (action === 'getPegawai') {
    var sheet = ss.getSheetByName(NAMA_SHEET_DATABASE);
    if (!sheet) {
      return ContentService.createTextOutput(JSON.stringify({status: 'success', data: []})).setMimeType(ContentService.MimeType.JSON);
    }
    var data = sheet.getDataRange().getValues();
    if (data.length <= 1) {
      return ContentService.createTextOutput(JSON.stringify({status: 'success', data: []})).setMimeType(ContentService.MimeType.JSON);
    }
    
    var sheetHeaders = data[0];
    var result = [];
    for (var i = 1; i < data.length; i++) {
      var row = data[i];
      var obj = {};
      for (var j = 0; j < sheetHeaders.length; j++) {
        obj[sheetHeaders[j]] = row[j];
      }
      result.push(obj);
    }
    return ContentService.createTextOutput(JSON.stringify({status: 'success', data: result})).setMimeType(ContentService.MimeType.JSON);
  }
}

// =============================================================================
// 2. FUNGSI POST DATA - ADD, EDIT, DELETE (doPost)
// =============================================================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var action = payload.action || "add"; // Default 'add' jika dari index.html lama
    
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName(NAMA_SHEET_DATABASE);
    if (!sheet) {
      sheet = ss.insertSheet(NAMA_SHEET_DATABASE);
    }
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(HEADERS_DATABASE);
    }
    
    var data = sheet.getDataRange().getValues();

    // ---------------- PROSES AMBIL / BUAT FOLDER DRIVE ----------------
    function dapatkanFolderPegawai(nama, nip) {
      var rootFolder = DriveApp.getFolderById(FOLDER_UTAMA_ID);
      var subFolderName = nama + (nip ? "_" + nip : "");
      var folders = rootFolder.getFoldersByName(subFolderName);
      return folders.hasNext() ? folders.next() : rootFolder.createFolder(subFolderName);
    }

    // ---------------- A. TAMBAH PEGAWAI BARU ----------------
    if (action === "add") {
      var targetFolder = dapatkanFolderPegawai(payload.nama || "Tanpa_Nama", payload.nip || "");
      var rowData = [];
      
      HEADERS_DATABASE.forEach(function(header) {
        var val = payload[header] || "";
        if (typeof val === 'object' && val.base64) {
          try {
            var blob = Utilities.base64Decode(val.base64);
            var fileName = header + "_" + (payload.nama || "file").toString().replace(/\s+/g, '_');
            var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
            var file = targetFolder.createFile(fileBlob); 
            val = file.getUrl(); 
          } catch (fErr) { val = "Gagal upload: " + fErr.message; }
        }
        rowData.push(val);
      });
      sheet.appendRow(rowData);
      return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data Berhasil Disimpan!'})).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------- B. EDIT DATA PEGAWAI ----------------
    if (action === "edit") {
      var idPegawai = payload.id_pegawai;
      var rowIndex = -1;
      
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === idPegawai.toString()) {
          rowIndex = i + 1;
          break;
        }
      }
      
      if (rowIndex === -1) {
        return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'ID Pegawai tidak ditemukan di database!'})).setMimeType(ContentService.MimeType.JSON);
      }
      
      var targetFolder = dapatkanFolderPegawai(payload.nama || "Tanpa_Nama", payload.nip || "");
      
      HEADERS_DATABASE.forEach(function(header, colIdx) {
        if (header === 'id_pegawai') return; // Kunci utama jangan diubah
        
        var val = payload[header];
        if (val !== undefined) {
          if (typeof val === 'object' && val.base64) {
            try {
              var blob = Utilities.base64Decode(val.base64);
              var fileName = header + "_" + (payload.nama || "file").toString().replace(/\s+/g, '_');
              var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
              var file = targetFolder.createFile(fileBlob); 
              val = file.getUrl(); 
            } catch (fErr) { val = "Gagal upload: " + fErr.message; }
          }
          // Jika field file kosong saat edit, biarkan link file lama tetap ada (jangan ditimpa kosong)
          if (header.indexOf('file_') === 0 && !val) return;
          
          sheet.getRange(rowIndex, colIdx + 1).setValue(val);
        }
      });
      return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data Berhasil Diperbarui!'})).setMimeType(ContentService.MimeType.JSON);
    }

    // ---------------- C. HAPUS PEGAWAI ----------------
    if (action === "delete") {
      var idPegawai = payload.id_pegawai;
      var rowIndex = -1;
      for (var i = 1; i < data.length; i++) {
        if (data[i][0].toString() === idPegawai.toString()) {
          rowIndex = i + 1;
          break;
        }
      }
      if (rowIndex !== -1) {
        sheet.deleteRow(rowIndex);
        return ContentService.createTextOutput(JSON.stringify({status: 'success', message: 'Data Berhasil Dihapus!'})).setMimeType(ContentService.MimeType.JSON);
      }
      return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Data tidak ditemukan!'})).setMimeType(ContentService.MimeType.JSON);
    }

  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sistem Error: ' + err.message})).setMimeType(ContentService.MimeType.JSON);
  }
}
