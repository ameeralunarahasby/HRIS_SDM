const APPS_SCRIPT_URL = "https://script.google.com/macros/s/AKfycbwExur-8izU76XNR_98CNxq2jSSl9SPUYem3dCNeX2Ps7m6xFRIpJz3quq0_nUNIJy9ZA/exec"; // Ganti dengan URL Web App Anda

let listPegawai = [];
let filteredPegawai = [];
let currentPage = 1;
const rowsPerPage = 25;

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
    
    document.getElementById('search-box').addEventListener('input', jalankanPenyaringan);
    document.getElementById('fltr-status').addEventListener('change', jalankanPenyaringan);
    document.getElementById('fltr-kelompok-peg').addEventListener('change', jalankanPenyaringan);
    document.getElementById('fltr-kelompok-jab').addEventListener('change', jalankanPenyaringan);
};

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
        document.getElementById('pegawai-table-body').innerHTML = `<tr><td colspan="7" style="text-align:center; color:red;">Gagal memuat data!</td></tr>`;
    }
}

function hitungMetrikRingkasan(data) {
    document.getElementById('lbl-total').innerText = data.length;
    document.getElementById('lbl-aktif').innerText = data.filter(p => p.status_pegawai === 'Aktif').length;
    document.getElementById('lbl-pensiun').innerText = data.filter(p => p.status_pegawai && p.status_pegawai.includes('Pensiun')).length;
    document.getElementById('lbl-mutasi').innerText = data.filter(p => p.status_pegawai === 'Mutasi').length;
    document.getElementById('lbl-resign').innerText = data.filter(p => p.status_pegawai === 'Resign').length;
}

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

function tampilkanTabel() {
    let tbody = document.getElementById('pegawai-table-body');
    tbody.innerHTML = "";
    
    if (filteredPegawai.length === 0) {
        tbody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#999; padding:20px;">Tidak ada data yang cocok.</td></tr>`;
        document.getElementById('pagination-controls').innerHTML = "";
        return;
    }
    
    let startIndex = (currentPage - 1) * rowsPerPage;
    let pageData = filteredPegawai.slice(startIndex, startIndex + rowsPerPage);
    
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
    btnPrev.onclick = () => { if(currentPage > 1) { currentPage--; tampilkanTabel(); } };
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
    btnNext.onclick = () => { if(currentPage < totalPages) { currentPage++; tampilkanTabel(); } };
    container.appendChild(btnNext);
}

// FUNGSI LAINNYA (View, Edit, Delete, Helpers) tetap sama seperti sebelumnya...
function bukaView(id) { /* Kode View Sama */ }
function bukaEdit(id) { /* Kode Edit Sama */ }
// ... (Pastikan fungsi prosesHapus, tutupModal, formatTgl, muatDropdown, dan initOtomasiKondisional tetap disertakan di bawah sini)
