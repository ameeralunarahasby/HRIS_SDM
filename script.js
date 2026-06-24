// --- WIZARD LOGIC ---
let currentTab = 0;
showTab(currentTab);

function showTab(n) {
    let tabs = document.getElementsByClassName("tab");
    tabs[n].style.display = "block";
    
    // Atur tombol
    if (n == 0) {
        document.getElementById("prevBtn").style.display = "none";
    } else {
        document.getElementById("prevBtn").style.display = "inline";
    }
    
    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Simpan Data";
        document.getElementById("nextBtn").style.backgroundColor = "#28a745"; // Hijau untuk submit
    } else {
        document.getElementById("nextBtn").innerHTML = "Selanjutnya";
        document.getElementById("nextBtn").style.backgroundColor = "#007BFF";
    }
    
    fixStepIndicator(n);
}

function nextPrev(n) {
    let tabs = document.getElementsByClassName("tab");
    
    // Validasi form pada tab saat ini sebelum lanjut
    if (n == 1 && !validateForm()) return false;
    
    // Sembunyikan tab saat ini
    tabs[currentTab].style.display = "none";
    
    // Tambah/kurang index tab
    currentTab = currentTab + n;
    
    // Jika sudah mencapai akhir tab, submit form
    if (currentTab >= tabs.length) {
        submitData();
        // Kembalikan current tab agar tidak error selagi menunggu
        currentTab = currentTab - n; 
        tabs[currentTab].style.display = "block";
        return false;
    }
    
    // Tampilkan tab baru
    showTab(currentTab);
}

function validateForm() {
    let tabs, inputs, i, valid = true;
    tabs = document.getElementsByClassName("tab");
    inputs = tabs[currentTab].getElementsByTagName("input");
    
    // Cek semua input pada tab saat ini
    for (i = 0; i < inputs.length; i++) {
        // Jika required tapi kosong
        if (inputs[i].hasAttribute("required") && inputs[i].value == "") {
            inputs[i].className += " invalid";
            valid = false;
        } else {
            inputs[i].classList.remove("invalid");
        }
    }
    
    if (valid) {
        document.getElementsByClassName("step")[currentTab].className += " finish";
    }
    return valid;
}

function fixStepIndicator(n) {
    let steps = document.getElementsByClassName("step");
    for (let i = 0; i < steps.length; i++) {
        steps[i].className = steps[i].className.replace(" active", "");
    }
    steps[n].className += " active";
}

// --- SUBMISSION LOGIC (Google Apps Script) ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzj_idRXjp2pLTm6R5JfnmMjlw3fTJGI77EcU7R1fe18eqi4jlvXlb4E2Rzmx90LccE_Q/exec";

async function submitData() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    nextBtn.disabled = true; 
    prevBtn.disabled = true;
    nextBtn.innerText = "Mengirim...";

    // 1. Ambil semua input teks (37 Fields)
    const textIds = [
        'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','nip',
        'status_pegawai','kelompok_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
        'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
        'status_keluarga','no_kk','pasangan','jml_anak','anak1','anak2','anak3','alamat',
        'jenjang','fakultas','jurusan','asal_pendidikan','ruangan','tmt_nota',
        'bpjs_kesehatan','ketenagakerjaan_taspen','npwp','no_hp','email'
    ];
    
    let payload = {};
    textIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) payload[id] = el.value;
    });

    // 2. Proses File menjadi Base64 (11 Fields)
    const fileIds = [
        'file_foto','file_ktp','file_kk','file_ijazah','file_transkrip','file_pangkat',
        'file_jabatan','file_nota','file_bpjs','file_ketenagakerjaan_taspen','file_npwp'
    ];
    
    for (let id of fileIds) {
        let fileInput = document.getElementById(id);
        if (fileInput && fileInput.files.length > 0) {
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
        
        if(result.status === 'success') {
            document.getElementById('pegawaiForm').reset();
            // Reset Wizard ke Tab 1
            document.getElementsByClassName("tab")[currentTab].style.display = "none";
            currentTab = 0;
            let steps = document.getElementsByClassName("step");
            for (let i = 0; i < steps.length; i++) {
                steps[i].className = steps[i].className.replace(" finish", "");
            }
            showTab(currentTab);
        }
    } catch(err) {
        alert("Gagal mengirim data: " + err);
    } finally {
        nextBtn.disabled = false; 
        prevBtn.disabled = false;
        nextBtn.innerText = "Simpan Data";
    }
}
