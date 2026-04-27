-- R&D Hub Database Seed Data
-- Run this after schema.sql to populate the database with mock data for testing

-- Note: The users are already created in schema.sql with these credentials:
-- ahmad.rnd / password123
-- siti.rnd / password123
-- budi.viewer / password123

-- Insert Mock Projects
INSERT INTO projects (id, name, description, category, status, created_by, created_at, updated_at) VALUES
(1, 'Smart ERP System', 'Pengembangan sistem ERP terintegrasi untuk manajemen inventory, purchasing, dan finance', 'Enterprise Application', 'In Progress', 1, '2024-01-20 10:00:00', '2024-02-10 14:30:00'),
(2, 'IoT Monitoring Dashboard', 'Dashboard real-time untuk monitoring sensor suhu, kelembaban, dan kualitas udara di pabrik', 'IoT & Automation', 'In Progress', 2, '2024-02-01 09:00:00', '2024-02-12 16:20:00'),
(3, 'Mobile Attendance App', 'Aplikasi mobile untuk absensi karyawan dengan GPS tracking dan face recognition', 'Mobile Development', 'Completed', 1, '2023-11-15 08:00:00', '2024-01-10 11:00:00');

-- Insert Mock Documentation
INSERT INTO documentation (id, project_id, title, content, author_id, views, created_at, updated_at) VALUES
(1, 1, 'Setup Database PostgreSQL untuk ERP', '<h2>Instalasi PostgreSQL 15</h2><p>Langkah-langkah instalasi database untuk sistem ERP:</p><ol><li>Download PostgreSQL 15 dari website resmi</li><li>Install dengan configuration default</li><li>Create database ''erp_db''</li></ol><h3>Konfigurasi Connection String</h3><pre>postgresql://admin:password@localhost:5432/erp_db</pre>', 1, 45, '2024-01-21 10:30:00', '2024-01-21 10:30:00'),
(2, 1, 'Desain UI/UX Dashboard ERP', '<h2>Dashboard Utama</h2><p>Desain menggunakan Material Design dengan color scheme biru dan hijau.</p><h3>Fitur Utama:</h3><ul><li>Real-time sales chart</li><li>Inventory summary cards</li><li>Quick actions panel</li></ul>', 2, 78, '2024-01-25 14:00:00', '2024-02-05 09:15:00'),
(3, 1, 'Implementasi Module Purchasing', '<h2>Module Purchasing</h2><p>Fitur untuk mengelola pembelian barang dari supplier.</p><h3>Komponen:</h3><ul><li>Purchase Order (PO)</li><li>Approval Workflow</li><li>Vendor Management</li></ul>', 1, 34, '2024-02-01 08:30:00', '2024-02-01 08:30:00'),
(4, 2, 'Setup MQTT Broker', '<h2>Konfigurasi MQTT</h2><p>Setup Mosquitto MQTT broker untuk komunikasi IoT devices.</p><pre>mosquitto -c mosquitto.conf</pre>', 2, 23, '2024-02-02 10:00:00', '2024-02-02 10:00:00'),
(5, 2, 'Integrasi Sensor DHT22', '<h2>Sensor Suhu & Kelembaban</h2><p>Wiring dan konfigurasi sensor DHT22 pada ESP32.</p><h3>Pin Configuration:</h3><ul><li>VCC → 3.3V</li><li>GND → GND</li><li>DATA → GPIO4</li></ul>', 2, 56, '2024-02-05 14:20:00', '2024-02-05 14:20:00'),
(6, 3, 'Face Recognition API', '<h2>Implementasi Face Recognition</h2><p>Menggunakan library face-api.js untuk deteksi wajah pada mobile app.</p><h3>Steps:</h3><ol><li>Install dependencies</li><li>Load pre-trained models</li><li>Capture image from camera</li><li>Process and verify</li></ol>', 1, 89, '2023-12-10 09:00:00', '2023-12-10 09:00:00');

-- Insert Mock Logbook Entries
INSERT INTO logbook_entries (id, date, author_id, activity_description, attachments, hours_spent, created_at) VALUES
(1, '2024-02-12', 1, 'Testing modul purchasing di ERP, berhasil implement PO creation dan approval workflow. Menemukan bug di calculation total harga saat ada diskon item.', 
'[{"type":"image","url":"/uploads/logbook/po-form.png","caption":"Form Purchase Order"},{"type":"image","url":"/uploads/logbook/approval.png","caption":"Approval Workflow"}]', 
6.5, '2024-02-12 17:00:00'),
(2, '2024-02-12', 2, 'Konfigurasi sensor DHT22 untuk IoT monitoring. Sudah berhasil kirim data ke MQTT broker dan tampil di dashboard real-time.', 
'[{"type":"image","url":"/uploads/logbook/sensor-wiring.png","caption":"Wiring Diagram DHT22"},{"type":"image","url":"/uploads/logbook/mqtt-data.png","caption":"MQTT Data Stream"},{"type":"image","url":"/uploads/logbook/dashboard-live.png","caption":"Live Dashboard Display"}]', 
7.0, '2024-02-12 17:30:00'),
(3, '2024-02-11', 1, 'Meeting dengan team untuk review progress ERP system. Diskusi tentang integrasi payment gateway dan reporting module.', '[]', 3.0, '2024-02-11 16:00:00'),
(4, '2024-02-10', 2, 'Troubleshooting koneksi WiFi pada ESP32. Ternyata masalah pada konfigurasi router, bukan pada devices.', 
'[{"type":"image","url":"/uploads/logbook/esp32-debug.png","caption":"Serial Monitor Output"}]', 
5.5, '2024-02-10 17:45:00'),
(5, '2024-02-09', 1, 'Coding fitur auto-calculation untuk diskon bertingkat di module purchasing. Testing dengan berbagai skenario diskon.', '[]', 8.0, '2024-02-09 18:00:00');

-- Insert Mock Error Reports
INSERT INTO error_reports (id, title, description, status, severity, before_images, after_images, solution, reported_by, solved_by, created_at, resolved_at) VALUES
(1, 'Login Error - Session Timeout Too Fast', 
'User komplain session timeout hanya 5 menit, terlalu cepat untuk workflow yang panjang. Perlu extend ke minimal 30 menit.', 
'Solved', 'Medium', 
'[{"url":"/uploads/errors/session-timeout-error.png","caption":"Error message yang muncul setelah 5 menit"}]',
'[{"url":"/uploads/errors/session-extended-config.png","caption":"Konfigurasi session timeout di server"},{"url":"/uploads/errors/no-more-timeout.png","caption":"User bisa kerja 30 menit tanpa logout"}]',
'Update JWT expiration time dari 300s ke 1800s di backend config',
1, 1, '2024-02-08 09:00:00', '2024-02-08 11:30:00'),

(2, 'Dashboard Chart Tidak Muncul di Browser Firefox', 
'Chart sales di dashboard tidak render di Firefox, tapi normal di Chrome. Kemungkinan compatibility issue dengan library chart.', 
'In Progress', 'High', 
'[{"url":"/uploads/errors/chart-blank-firefox.png","caption":"Chart kosong di Firefox"}]',
NULL, NULL, 2, NULL, '2024-02-11 14:00:00', NULL),

(3, 'Upload Gambar Gagal untuk File > 2MB', 
'Error 413 Payload Too Large saat upload gambar yang lebih dari 2MB.', 
'Pending', 'Low', 
'[{"url":"/uploads/errors/upload-413-error.png","caption":"Error 413 saat upload"}]',
NULL, NULL, 1, NULL, '2024-02-12 16:00:00', NULL),

(4, 'MQTT Connection Drop pada Sensor 3', 
'Sensor DHT22 nomor 3 sering disconnect dari MQTT broker setiap 2-3 jam. Sensor lain normal.', 
'In Progress', 'Medium', 
'[{"url":"/uploads/errors/mqtt-disconnect.png","caption":"MQTT Broker Log"}]',
'[{"url":"/uploads/errors/sensor-rewired.png","caption":"Sensor setelah di-rewire"}]',
'Ternyata kabel power sensor longgar. Setelah di-crimp ulang, koneksi stabil.',
2, 2, '2024-02-09 10:30:00', '2024-02-09 15:00:00');

-- Reset sequences to continue from current max ID
SELECT setval('projects_id_seq', (SELECT MAX(id) FROM projects));
SELECT setval('documentation_id_seq', (SELECT MAX(id) FROM documentation));
SELECT setval('logbook_entries_id_seq', (SELECT MAX(id) FROM logbook_entries));
SELECT setval('error_reports_id_seq', (SELECT MAX(id) FROM error_reports));

-- Display summary
SELECT 'Seed data inserted successfully!' AS message;
SELECT 
    (SELECT COUNT(*) FROM users) AS total_users,
    (SELECT COUNT(*) FROM projects) AS total_projects,
    (SELECT COUNT(*) FROM documentation) AS total_documentation,
    (SELECT COUNT(*) FROM logbook_entries) AS total_logbook_entries,
    (SELECT COUNT(*) FROM error_reports) AS total_error_reports;
