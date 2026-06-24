// ==========================================
// 1. GET DATA UNTUK DROPDOWN
// ==========================================
function doGet(e) {
  if (e.parameter.action === 'getDropdown') {
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Pengaturan");
    if (!sheet) return ContentService.createTextOutput(JSON.stringify({status: 'error', message: 'Sheet Pengaturan tidak ditemukan'})).setMimeType(ContentService.MimeType.JSON);
    
    var data = sheet.getDataRange().getValues();
    var dropdowns = { golongan: [], jabatan: [], ruangan: [], fakultas: [], jurusan: [] };
    
    // Looping data mulai baris ke-2 (index 1)
    for (var i = 1; i < data.length; i++) { 
      var kelompok = data[i][1] ? data[i][1].toString().toLowerCase().trim() : "";
      var keterangan = data[i][2] ? data[i][2].toString() : "";
      if (dropdowns.hasOwnProperty(kelompok)) {
        dropdowns[kelompok].push(keterangan);
      }
    }
    
    return ContentService.createTextOutput(JSON.stringify({status: 'success', data: dropdowns}))
      .setMimeType(ContentService.MimeType.JSON);
  }
}

// ==========================================
// 2. POST DATA & UPLOAD FILE KE GOOGLE DRIVE
// ==========================================
function doPost(e) {
  try {
    var payload = JSON.parse(e.postData.contents);
    var ss = SpreadsheetApp.getActiveSpreadsheet();
    var sheet = ss.getSheetByName("Data Pegawai");
    
    // 1. Folder Utama (Pastikan ID ini benar)
    var folderId = "184coQUbsiGaTx8LhE9T3b067_SeMQytO";
    var rootFolder = DriveApp.getFolderById(folderId);

    // 2. Tentukan nama sub-folder (ID - Nama)
    var idPegawai = payload['id_pegawai'] || "ID_Kosong";
    var namaPegawai = payload['nama'] || "TanpaNama";
    var subFolderName = idPegawai + " - " + namaPegawai;
    
    // 3. LOGIKA BARU: Cari folder dan pastikan BUKAN di tong sampah (Trash)
    var subFolders = rootFolder.getFoldersByName(subFolderName);
    var targetFolder = null;
    
    while (subFolders.hasNext()) {
      var f = subFolders.next();
      if (!f.isTrashed()) { // <-- Mencegah folder hantu di tong sampah
        targetFolder = f;
        break;
      }
    }
    
    // Jika tidak ada folder yang aktif, buat baru
    if (!targetFolder) {
      targetFolder = rootFolder.createFolder(subFolderName);
    }

    // 4. Kunci urutan Header
    var headers = [
      'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
      'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
      'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
      'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
      'ruangan','tmt_nota','jenjang','fakultas','jurusan','asal_pendidikan',
      'bpjs_kesehatan','ketenagakerjaan_taspen','npwp',
      'file_foto','file_ktp','file_kk','file_ijazah','file_transkrip','file_pangkat',
      'file_jabatan','file_nota','file_bpjs','file_ketenagakerjaan_taspen','file_npwp'
    ];
    
    if (sheet.getLastRow() === 0) {
      sheet.appendRow(headers);
    }

    var rowData = [];
    headers.forEach(function(header) {
      var val = payload[header] || "";
      
      // Jika mendeteksi ada file Base64, simpan ke targetFolder
      if (typeof val === 'object' && val.base64) {
         try {
            var blob = Utilities.base64Decode(val.base64);
            var fileName = header + "_" + namaPegawai;
            var fileBlob = Utilities.newBlob(blob, val.mimeType, fileName);
            
            // SIMPAN DI DALAM TARGET FOLDER
            var file = targetFolder.createFile(fileBlob); 
            val = file.getUrl(); 
         } catch (errFile) {
            val = "Gagal upload: " + errFile.message;
         }
      }
      rowData.push(val);
    });
    
    sheet.appendRow(rowData);

    return ContentService.createTextOutput(JSON.stringify({
      status: 'success', 
      message: 'Data & File Berhasil Disimpan ke Folder: ' + subFolderName
    })).setMimeType(ContentService.MimeType.JSON);
    
  } catch (err) {
    return ContentService.createTextOutput(JSON.stringify({
      status: 'error', 
      message: err.message
    })).setMimeType(ContentService.MimeType.JSON);
  }
}
