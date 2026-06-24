<!DOCTYPE html>
<html lang="id">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Sistem Unggah File Cloud</title>
    <style>
        * {
            box-sizing: border-box;
            margin: 0;
            padding: 0;
            font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
        }
        body {
            background: linear-gradient(135deg, #f5f7fa 0%, #c3cfe2 100%);
            display: flex;
            justify-content: center;
            align-items: center;
            height: 100vh;
        }
        .container {
            background-color: #ffffff;
            padding: 40px;
            border-radius: 12px;
            box-shadow: 0 8px 24px rgba(0, 0, 0, 0.1);
            text-align: center;
            max-width: 450px;
            width: 90%;
        }
        .icon {
            width: 80px;
            height: 80px;
            background-color: #e8f0fe;
            border-radius: 50%;
            display: flex;
            justify-content: center;
            align-items: center;
            margin: 0 auto 20px;
        }
        .icon svg {
            fill: #1a73e8;
            width: 40px;
            height: 40px;
        }
        h2 {
            color: #333333;
            margin-bottom: 10px;
            font-size: 24px;
        }
        p {
            color: #666666;
            font-size: 14px;
            margin-bottom: 30px;
            line-height: 1.5;
        }
        .btn-upload {
            display: inline-block;
            background-color: #1a73e8;
            color: white;
            text-decoration: none;
            padding: 14px 28px;
            border-radius: 25px;
            font-weight: bold;
            font-size: 16px;
            transition: background-color 0.3s, transform 0.2s;
            box-shadow: 0 4px 12px rgba(26, 115, 232, 0.3);
        }
        .btn-upload:hover {
            background-color: #1557b0;
            transform: translateY(-2px);
        }
        .btn-upload:active {
            transform: translateY(0);
        }
        .footer {
            margin-top: 25px;
            font-size: 11px;
            color: #999999;
        }
    </style>
</head>
<body>

    <div class="container">
        <!-- Icon Awan / Upload -->
        <div class="icon">
            <svg viewBox="0 0 24 24">
                <path d="M19.35 10.04C18.67 6.59 15.64 4 12 4 9.11 4 6.6 5.64 5.35 8.04 2.34 8.36 0 10.91 0 14c0 3.31 2.69 6 6 6h13c2.76 0 5-2.24 5-5 0-2.64-2.05-4.78-4.65-4.96zM14 13v4h-4v-4H7l5-5 5 5h-3z"/>
            </svg>
        </div>
        
        <h2>Unggah File ke Google Drive</h2>
        <p>Silakan klik tombol di bawah untuk mengirim file atau dokumen Anda aman langsung ke penyimpanan cloud.</p>
        
        <!-- TOMBOL UTAMA: Ganti URL di bawah dengan link Google Form kamu -->
        <a href="https://forms.gle/LygU4N5VwdJuKLr5A" target="_blank" class="btn-upload">
            Mulai Unggah File
        </a>
        
        <div class="footer">
            Didukung oleh Google Form & GitHub Pages
        </div>
    </div>

</body>
</html>
