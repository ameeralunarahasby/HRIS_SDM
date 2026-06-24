const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzj_idRXjp2pLTm6R5JfnmMjlw3fTJGI77EcU7R1fe18eqi4jlvXlb4E2Rzmx90LccE_Q/exec";

document.getElementById('pegawaiForm').addEventListener('submit', async (e) => {
    e.preventDefault();
    const btn = document.getElementById('btn');
    btn.disabled = true; btn.innerText = "Mengirim...";

    // 1. Ambil semua input teks
    const textIds = ['id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','nip','status_pegawai','kelompok_pegawai','golongan','tmt_pangkat','kelompok_jabatan','jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun','status_keluarga','no_kk','pasangan','jml_anak','anak1','anak2','anak3','alamat','jenjang','fakultas','jurusan','asal_pendidikan','ruangan','tmt_nota','bpjs_kesehatan','ketenagakerjaan_taspen','npwp','no_hp','email'];
    
    let payload = {};
    textIds.forEach(id => payload[id] = document.getElementById(id).value);

    // 2. Proses File menjadi Base64
    const fileIds = ['file_foto','file_ktp','file_kk','file_ijazah','file_transkrip','file_pangkat','file_jabatan','file_nota','file_bpjs','file_ketenagakerjaan_taspen','file_npwp'];
    
    for (let id of fileIds) {
        let fileInput = document.getElementById(id);
        if (fileInput.files.length > 0) {
            let file = fileInput.files[0];
            payload[id] = await new Promise(resolve => {
                let reader = new FileReader();
                reader.onload = () => resolve({base64: reader.result.split(',')[1], mimeType: file.type});
                reader.readAsDataURL(file);
            });
        }
    }

    // 3. Kirim ke Google Apps Script
    try {
        let response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        let result = await response.json();
        alert(result.message);
        if(result.status === 'success') document.getElementById('pegawaiForm').reset();
    } catch(err) {
        alert("Gagal mengirim data: " + err);
    } finally {
        btn.disabled = false; btn.innerText = "Simpan Data";
    }
});
