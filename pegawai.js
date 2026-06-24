const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec";

let listPegawai = [];
let filteredPegawai = [];
let currentPage = 1;
const rowsPerPage = 25;

// Batasan ID Input text/select form
const ALL_KEYS = [
    'id_pegawai','nik','nama','tempat_lahir','tanggal_lahir','status_keluarga','no_kk',
    'pasangan','jml_anak','anak1','anak2','anak3','alamat','no_hp','email',
    'kelompok_pegawai','nip','status_pegawai','golongan','tmt_pangkat','kelompok_jabatan',
    'jabatan','tmt_jabatan','masuk_rs','masa_kerja','tmt_cpns','bup','tmt_pensiun',
    'ruangan','tmt_nota','jenjang','fakultas','jurusan','asal_pendidikan',
    'bpjs_kesehatan','ketenagakerjaan_taspen','npwp'
];

window.onload = async function() {
    initOtomasiKondisional();
    await muatDropdown();
    await ambilDataPegawai();
    
    // Pasang Event Listeners Filter
    document.getElementById('search-box').addEventListener('input', jalankanPenyaringan);
    document.getElementById('fltr-status').addEventListener('change', jalankanPenyaringan);
    document.getElementById('fltr-kelompok-peg').addEventListener('change', jalankanPenyaringan);
    document.getElementById('fltr-kelompok-jab').addEventListener('change', jalankanPenyaringan);
};

// 1. AMBIL DATA PEGAWAI DARI GOOGLE SHEETS
async function ambilDataPegawai() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getPegawai");
        let result = await response.json();
        if (result.status === 'success') {
            listPegawai = result.data;
            hitungMetrikRingkasan(listPegawai);
            jalankanPenyaringan();
        }
    } catch (err) {
        console.error("Gagal mengambil database pegawai", err);
        document.getElementById('pegawai-table-body').innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat data dari server!</td></tr>`;
    }
}

// 2. HITUNG RINGKASAN METRIK KOTAK ANGKA
function hitungMetrikRingkasan(data) {
    document.getElementById('lbl-total').innerText = data.length;
    document.getElementById('lbl-aktif').innerText = data.filter(p => p.status_pegawai === 'Aktif').length;
    document.getElementById('lbl-pensiun').innerText = data.filter(p => p.status_pegawai && p.status_pegawai.includes('Pensiun')).length;
    document.getElementById('lbl-mutasi').innerText = data.filter(p => p.status_pegawai === 'Mutasi').length;
    document.getElementById('lbl-resign').innerText = data.filter(p => p.status_pegawai === 'Resign').length;
}

// 3. FUNGSI FILTER & SEARCH REAL-TIME
function jalankanPenyaringan() {
    let q = document.getElementById('search-box').value.toLowerCase().trim();
    let fStatus = document.getElementById('fltr-status').value;
    let fKelPeg = document.getElementById('fltr-kelompok-peg').value;
    let fKelJab = document.getElementById('fltr-kelompok-jab').value;
    
    filteredPegawai = listPegawai.filter(p => {
        let matchQuery = !q || (p.nama && p.nama.toLowerCase().includes(q)) || (p.nik && p.nik.toString().includes(q));
        let matchStatus = !fStatus || p.status_pegawai === fStatus;
        let matchKelPeg = !fKelPeg || p.kelompok_pegawai === fKelPeg;
        let matchKelJab = !fKelJab || p.kelompok_jabatan === fKelJab;
        return matchQuery && matchStatus && matchKelPeg && matchKelJab;
    });
    
    currentPage = 1;
    tampilkanTabel();
}

// 4. METODE RENDER DATA TABEL BERPASANGAN & PAGINATION (25 BARIS)
function tampilkanTabel() {
    let tbody = document.getElementById('pegawai-table-body');
    tbody.innerHTML = "";
    
    if (filteredPegawai.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">Tidak ada data pegawai yang cocok.</td></tr>`;
        document.getElementById('pagination-controls').innerHTML = "";
        return;
    }
    
    let startIndex = (currentPage - 1) * rowsPerPage;
    let endIndex = startIndex + rowsPerPage;
    let pageData = filteredPegawai.slice(startIndex, endIndex);
    
    pageData.forEach(p => {
        let tr = document.createElement('tr');
        tr.innerHTML = `
            <td><b>${p.nik || '-'}</b><div class="sub-text">${p.nip || '-'}</div></td>
            <td><b>${p.nama || '-'}</b><div class="sub-text">${p.ruangan || '-'}</div></td>
            <td>${p.golongan || '-'}<div class="sub-text">${formatTgl(p.tmt_pangkat)}</div></td>
            <td>${p.jabatan || '-'}<div class="sub-text">${formatTgl(p.tmt_jabatan)}</div></td>
            <td>${formatTgl(p.masuk_rs)}<div class="sub-text">${p.masa_kerja || '-'}</div></td>
            <td>${p.bup || '-'} Thn<div class="sub-text">${formatTgl(p.tmt_pensiun)}</div></td>
            <td>
                <button class="btn-action btn-view" onclick="bukaView('${p.id_pegawai}')">View</button>
                <button class="btn-action btn-edit" onclick="bukaEdit('${p.id_pegawai}')">Edit</button>
                <button class="btn-action btn-delete" onclick="prosesHapus('${p.id_pegawai}', '${p.nama}')">Hapus</button>
            </td>
        `;
        tbody.appendChild(tr);
    });
    
    renderKontrolNavigasi();
}

function renderKontrolNavigasi() {
    let container = document.getElementById('pagination-controls');
    container.innerHTML = "";
    
    let totalPages = Math.ceil(filteredPegawai.length / rowsPerPage);
    if(totalPages <= 1) return;
    
    let btnPrev = document.createElement('button');
    btnPrev.innerText = "Sebelumnya";
    btnPrev.disabled = currentPage === 1;
    btnPrev.onclick = () => { currentPage--; tampilkanTabel(); };
    container.appendChild(btnPrev);
    
    for (let i = 1; i <= totalPages; i++) {
        let btnPage = document.createElement('button');
        btnPage.innerText = i;
        if(i === currentPage) btnPage.className = "active";
        btnPage.onclick = () => { currentPage = i; tampilkanTabel(); };
        container.appendChild(btnPage);
    }
    
    let btnNext = document.createElement('button');
    btnNext.innerText = "Selanjutnya";
    btnNext.disabled = currentPage === totalPages;
    btnNext.onclick = () => { currentPage++; tampilkanTabel(); };
    container.appendChild(btnNext);
}

// 5. AKSI VIEW LENGKAP PEGAWAI
function bukaView(id) {
    let p = listPegawai.find(x => x.id_pegawai.toString() === id.toString());
    if(!p) return;
    
    let container = document.getElementById('view-detail-content');
    container.innerHTML = "";
    
    for (let key in p) {
        let label = key.toUpperCase().replace(/_/g, " ");
        let value = p[key];
        
        if (key.indexOf('file_') === 0 || key.indexOf('url_') === 0) {
            value = value ? `<a href="${value}" target="_blank" style="color:#007BFF; font-weight:bold;">Lihat Dokumen ↗</a>` : "-";
        } else if (value && (key.includes('tanggal') || key.includes('tmt') || key.includes('masuk'))) {
            value = formatTgl(value);
        }
        
        container.innerHTML += `
            <div class="view-detail-item">
                <span class="view-label">${label}</span>: 
                <span class="view-val">${value || '-'}</span>
            </div>
        `;
    }
    document.getElementById('modal-view').style.display = 'block';
}

// 6. AKSI EDIT DATA PEGAWAI (Kecuali ID PEGAWAI)
function bukaEdit(id) {
    let p = listPegawai.find(x => x.id_pegawai.toString() === id.toString());
    if(!p) return;
    
    ALL_KEYS.forEach(k => {
        let el = document.getElementById(k);
        if(el) {
            if(el.type === 'date' && p[k]) {
                el.value = p[k].toString().split('T')[0];
            } else {
                el.value = p[k] || "";
            }
        }
    });
    
    // TriggerUI Kondisional setelah value terisi
    document.getElementById('jml_anak').dispatchEvent(new Event('change'));
    document.getElementById('kelompok_pegawai').dispatchEvent(new Event('change'));
    
    document.getElementById('modal-edit').style.display = 'block';
}

// SIMPAN PERUBAHAN FORM EDIT (POST KE API METHOD EDIT)
document.getElementById('editPegawaiForm').onsubmit = async function(e) {
    e.preventDefault();
    let btnSubmit = document.getElementById('btnEditSimpan');
    btnSubmit.disabled = true;
    btnSubmit.innerText = "Memperbarui...";
    
    let payload = { action: 'edit' };
    ALL_KEYS.forEach(k => {
        let el = document.getElementById(k);
        if(el) payload[k] = el.value;
    });
    
    // Proses Konversi File Baru jika Ada yang Diupload saat Edit
    const fileIds = ['file_foto','file_ktp','file_kk','file_ijazah','file_pangkat','file_jabatan'];
    for(let id of fileIds) {
        let fInput = document.getElementById(id);
        if(fInput && fInput.files.length > 0) {
            let file = fInput.files[0];
            payload[id] = await new Promise(res => {
                let rdr = new FileReader();
                rdr.onload = () => res({base64: rdr.result.split(',')[1], mimeType: file.type});
                rdr.readAsDataURL(file);
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
            tutupModal('modal-edit');
            document.getElementById('editPegawaiForm').reset();
            await ambilDataPegawai(); // Refresh isi tabel data
        }
    } catch (err) {
        alert("Gagal memperbarui data: " + err);
    } finally {
        btnSubmit.disabled = false;
        btnSubmit.innerText = "Simpan Perubahan";
    }
};

// 7. AKSI HAPUS DATA PEGAWAI
async function prosesHapus(id, nama) {
    if (confirm(`Apakah Anda yakin ingin menghapus data pegawai "${nama}" permanen dari database?`)) {
        try {
            let response = await fetch(APPS_SCRIPT_URL, {
                method: 'POST',
                body: JSON.stringify({ action: 'delete', id_pegawai: id })
            });
            let result = await response.json();
            alert(result.message);
            if(result.status === 'success') {
                await ambilDataPegawai(); // Refresh tabel
            }
        } catch (err) {
            alert("Gagal menghapus data: " + err);
        }
    }
}

// ================= FUNGSI PEMBANTU (HELPER) =================
function tutupModal(id) { document.getElementById(id).style.display = 'none'; }

function formatTgl(isoStr) {
    if(!isoStr) return "-";
    let d = new Date(isoStr);
    if(isNaN(d)) return isoStr;
    return d.toLocaleDateString('id-ID', {day: '2-digit', month: 'short', year: 'numeric'});
}

async function muatDropdown() {
    try {
        let response = await fetch(APPS_SCRIPT_URL + "?action=getDropdown");
        let res = await response.json();
        if (res.status === 'success') {
            let bind = (id, arr) => {
                let s = document.getElementById(id); if(!s || !arr) return;
                s.innerHTML = '<option value="">Pilih...</option>';
                arr.forEach(i => { s.innerHTML += `<option value="${i}">${i}</option>`; });
            };
            bind('golongan', res.data.golongan); bind('jabatan', res.data.jabatan);
            bind('ruangan', res.data.ruangan); bind('fakultas', res.data.fakultas); bind('jurusan', res.data.jurusan);
        }
    } catch(e) { console.error("Dropdown gagal dimuat", e); }
}

function initOtomasiKondisional() {
    // A. Otomasi Jumlah Anak
    document.getElementById('jml_anak').addEventListener('change', function() {
        let v = parseInt(this.value) || 0;
        document.getElementById('w_anak1').style.display = v >= 1 ? 'block' : 'none';
        document.getElementById('w_anak2').style.display = v >= 2 ? 'block' : 'none';
        document.getElementById('w_anak3').style.display = v >= 3 ? 'block' : 'none';
    });
    // B. Otomasi Kelompok Pegawai
    document.getElementById('kelompok_pegawai').addEventListener('change', function() {
        let isASN = (this.value === 'ASN');
        document.getElementById('w_nip').style.display = isASN ? 'block' : 'none';
        document.getElementById('w_tmt_pangkat').style.display = isASN ? 'block' : 'none';
        document.getElementById('w_tmt_cpns').style.display = isASN ? 'block' : 'none';
    });
    // C. TMT CPNS dari NIP
    document.getElementById('nip').addEventListener('input', function() {
        let n = this.value.replace(/\s+/g, '');
        if (n.length >= 14) {
            let y = n.substring(8, 12), m = n.substring(12, 14);
            if(parseInt(m) >= 1 && parseInt(m) <= 12) document.getElementById('tmt_cpns').value = `${y}-${m}-01`;
        }
    });
    // D. TMT Pensiun
    let hitungPensiun = () => {
        let tl = document.getElementById('tanggal_lahir').value, b = document.getElementById('bup').value;
        if (tl && b) {
            let dt = new Date(tl);
            let pDate = new Date(dt.getFullYear() + parseInt(b), dt.getMonth() + 1, 1);
            let y = pDate.getFullYear(), m = String(pDate.getMonth() + 1).padStart(2, '0'), d = String(pDate.getDate()).padStart(2, '0');
            document.getElementById('tmt_pensiun').value = `${y}-${m}-${d}`;
        }
    };
    document.getElementById('tanggal_lahir').addEventListener('input', hitungPensiun);
    document.getElementById('bup').addEventListener('change', hitungPensiun);
    // E. Masa Kerja
    document.getElementById('masuk_rs').addEventListener('input', function() {
        let s = new Date(this.value), e = new Date();
        if (s > e || isNaN(s)) { document.getElementById('masa_kerja').value = ""; return; }
        let y = e.getFullYear() - s.getFullYear(), m = e.getMonth() - s.getMonth(), d = e.getDate() - s.getDate();
        if (d < 0) { m--; d += new Date(e.getFullYear(), e.getMonth(), 0).getDate(); }
        if (m < 0) { y--; m += 12; }
        document.getElementById('masa_kerja').value = `${y} Tahun ${m} Bulan ${d} Hari`;
    });
}
