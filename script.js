// --- MASUKKAN URL WEB APP ANDA DI SINI ---
const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbzYR2Vaft5ODIjVEk1qmznJcIG0T7JjUF1hNjGc6hw8NA4oNkMEOb05ul9L6id0GvHljA/exec";

// ==========================================
// 1. FETCH DROPDOWN DARI GOOGLE SPREADSHEET
// ==========================================
window.onload = async function() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getDropdown");
        let result = await response.json();
        if (result.status === 'success') {
            populateDropdown('golongan', result.data.golongan);
            populateDropdown('jabatan', result.data.jabatan);
            populateDropdown('ruangan', result.data.ruangan);
            populateDropdown('fakultas', result.data.fakultas);
            populateDropdown('jurusan', result.data.jurusan);
        }
    } catch (error) {
        console.error("Gagal menarik data pengaturan", error);
    }
};

function populateDropdown(id, dataArray) {
    let select = document.getElementById(id);
    if (!select || !dataArray) return;
    select.innerHTML = '<option value="">Pilih...</option>';
    dataArray.forEach(item => {
        let opt = document.createElement('option');
        opt.value = item;
        opt.innerText = item;
        select.appendChild(opt);
    });
}

// ==========================================
// 2. LOGIKA KONDISIONAL FORM & OTOMATISASI
// ==========================================

// A. Kondisional Jumlah Anak
document.getElementById('jml_anak').addEventListener('change', function() {
    let val = parseInt(this.value) || 0;
    document.getElementById('wrap_anak1').style.display = val >= 1 ? 'block' : 'none';
    document.getElementById('wrap_anak2').style.display = val >= 2 ? 'block' : 'none';
    document.getElementById('wrap_anak3').style.display = val >= 3 ? 'block' : 'none';
    
    // Clear value if hidden
    if(val < 1) document.getElementById('anak1').value = '';
    if(val < 2) document.getElementById('anak2').value = '';
    if(val < 3) document.getElementById('anak3').value = '';
});

// B. Kondisional Kelompok Pegawai (Khusus ASN memunculkan NIP, TMT Pangkat, TMT CPNS)
document.getElementById('kelompok_pegawai').addEventListener('change', function() {
    let isASN = (this.value === 'ASN');
    document.getElementById('wrap_nip').style.display = isASN ? 'block' : 'none';
    document.getElementById('wrap_tmt_pangkat').style.display = isASN ? 'block' : 'none';
    document.getElementById('wrap_tmt_cpns').style.display = isASN ? 'block' : 'none';
    
    if(!isASN) {
        document.getElementById('nip').value = '';
        document.getElementById('tmt_pangkat').value = '';
        document.getElementById('tmt_cpns').value = '';
    }
});

// C. TMT CPNS Otomatis dari NIP (Angka ke 9: 4 tahun, 2 bulan, tgl 01)
// Format NIP: YYYYMMDD YYYYMM 1/2 001
document.getElementById('nip').addEventListener('input', function() {
    let nipClean = this.value.replace(/\s+/g, ''); // Hapus spasi jika user mengetik dengan spasi
    if (nipClean.length >= 14) {
        let yyyy = nipClean.substring(8, 12);
        let mm = nipClean.substring(12, 14);
        // Pastikan bulan valid (01 - 12)
        if(parseInt(mm) >= 1 && parseInt(mm) <= 12) {
            document.getElementById('tmt_cpns').value = `${yyyy}-${mm}-01`;
        }
    }
});

// D. TMT Pensiun Otomatis (Tanggal Lahir + BUP = Tanggal 1 Bulan Berikutnya)
function hitungTmtPensiun() {
    let tglLahir = document.getElementById('tanggal_lahir').value;
    let bup = document.getElementById('bup').value;
    
    if (tglLahir && bup) {
        let birth = new Date(tglLahir);
        let bupInt = parseInt(bup);
        
        let pensiunYear = birth.getFullYear() + bupInt;
        // getMonth() dimulai dari 0 (Jan). Karena aturannya bulan BERIKUTNYA, maka +1.
        // Format object Date: Date(Year, Month, 1) -> otomatis lompat ke awal bulan depannya
        let pensiunDate = new Date(pensiunYear, birth.getMonth() + 1, 1);
        
        let y = pensiunDate.getFullYear();
        let m = String(pensiunDate.getMonth() + 1).padStart(2, '0');
        let d = String(pensiunDate.getDate()).padStart(2, '0');
        
        document.getElementById('tmt_pensiun').value = `${y}-${m}-${d}`;
    }
}
document.getElementById('tanggal_lahir').addEventListener('input', hitungTmtPensiun);
document.getElementById('bup').addEventListener('change', hitungTmtPensiun);

// E. Masa Kerja Otomatis (Masuk RS -> Hari Ini)
document.getElementById('masuk_rs').addEventListener('input', function() {
    let startDate = new Date(this.value);
    let endDate = new Date(); // Hari ini
    
    if (startDate > endDate || isNaN(startDate)) {
        document.getElementById('masa_kerja').value = "";
        return;
    }
    
    let years = endDate.getFullYear() - startDate.getFullYear();
    let months = endDate.getMonth() - startDate.getMonth();
    let days = endDate.getDate() - startDate.getDate();
    
    if (days < 0) {
        months--;
        let prevMonth = new Date(endDate.getFullYear(), endDate.getMonth(), 0);
        days += prevMonth.getDate();
    }
    if (months < 0) {
        years--;
        months += 12;
    }
    
    document.getElementById('masa_kerja').value = `${years} Tahun ${months} Bulan ${days} Hari`;
});

// ==========================================
// 3. WIZARD NAVIGATION & VALIDATION
// ==========================================
let currentTab = 0;
showTab(currentTab);

function showTab(n) {
    let tabs = document.getElementsByClassName("tab");
    tabs[n].style.display = "block";
    
    document.getElementById("prevBtn").style.display = (n == 0) ? "none" : "inline";
    
    if (n == (tabs.length - 1)) {
        document.getElementById("nextBtn").innerHTML = "Simpan Data";
        document.getElementById("nextBtn").style.backgroundColor = "#28a745";
    } else {
        document.getElementById("nextBtn").innerHTML = "Selanjutnya";
        document.getElementById("nextBtn").style.backgroundColor = "#007BFF";
    }
    fixStepIndicator(n);
}

function nextPrev(n) {
    let tabs = document.getElementsByClassName("tab");
    if (n == 1 && !validateForm()) return false;
    tabs[currentTab].style.display = "none";
    currentTab = currentTab + n;
    
    if (currentTab >= tabs.length) {
        submitData();
        currentTab = currentTab - n; 
        tabs[currentTab].style.display = "block";
        return false;
    }
    showTab(currentTab);
}

function validateForm() {
    let tabs, inputs, selects, i, valid = true;
    tabs = document.getElementsByClassName("tab");
    
    // Validasi input text/date
    inputs = tabs[currentTab].getElementsByTagName("input");
    for (i = 0; i < inputs.length; i++) {
        // Jangan validasi elemen yang sedang disembunyikan (display: none)
        let isVisible = inputs[i].closest('.form-group').style.display !== 'none';
        if (isVisible && inputs[i].hasAttribute("required") && inputs[i].value == "") {
            inputs[i].className += " invalid";
            valid = false;
        } else {
            inputs[i].classList.remove("invalid");
        }
    }

    // Validasi dropdown select (jika ada req)
    selects = tabs[currentTab].getElementsByTagName("select");
    for (i = 0; i < selects.length; i++) {
        let isVisible = selects[i].closest('.form-group').style.display !== 'none';
        if (isVisible && selects[i].hasAttribute("required") && selects[i].value == "") {
            selects[i].className += " invalid";
            valid = false;
        } else {
            selects[i].classList.remove("invalid");
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

// ==========================================
// 4. SUBMISSION KE GOOGLE APPS SCRIPT
// ==========================================
async function submitData() {
    const nextBtn = document.getElementById('nextBtn');
    const prevBtn = document.getElementById('prevBtn');
    
    nextBtn.disabled = true; 
    prevBtn.disabled = true;
    nextBtn.innerText = "Mengirim...";

    // Mengambil 37 ID (termasuk input teks dan select option dropdown)
    const textIds = [
        'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
        'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
        'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
        'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
        'ruangan','tmt_nota','jenjang','fakultas','jurusan','asal_pendidikan',
        'bpjs_kesehatan','ketenagakerjaan_taspen','npwp'
    ];
    
    let payload = {};
    textIds.forEach(id => {
        let el = document.getElementById(id);
        if(el) payload[id] = el.value;
    });

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

    try {
        let response = await fetch(APPS_SCRIPT_URL, {
            method: 'POST',
            body: JSON.stringify(payload)
        });
        let result = await response.json();
        alert(result.message);
        
        if(result.status === 'success') {
            document.getElementById('pegawaiForm').reset();
            
            // Trigger Reset UI
            document.getElementById('jml_anak').dispatchEvent(new Event('change'));
            document.getElementById('kelompok_pegawai').dispatchEvent(new Event('change'));
            document.getElementById('masa_kerja').value = '';
            document.getElementById('tmt_pensiun').value = '';

            // Reset Tab ke 1
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
