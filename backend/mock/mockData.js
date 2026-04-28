/**
 * Mock Data Store
 * In-memory data used when running in MOCK_MODE (no database / .env configured).
 * All mutations (POST/PUT/DELETE) operate on these arrays at runtime.
 */

const bcrypt = require('bcrypt');

// Pre-hashed password for "password123" — generated once at module load
// We use a sync hash here only in mock mode (startup cost is acceptable)
const DEFAULT_HASH = bcrypt.hashSync('password123', 10);

// ─── Users ───────────────────────────────────────────────────────────────────
const users = [
    {
        id: 1,
        username: 'admin',
        password_hash: DEFAULT_HASH,
        full_name: 'Administrator',
        email: 'admin@example.com',
        role: 'Admin',
        status: 'Active',
        created_at: new Date('2024-01-01T00:00:00Z'),
        last_login: new Date('2024-06-01T08:00:00Z'),
        must_change_password: false,
        password_changed_at: null,
    },
    {
        id: 2,
        username: 'rnd_user',
        password_hash: DEFAULT_HASH,
        full_name: 'Budi Santoso',
        email: 'budi@example.com',
        role: 'R&D',
        status: 'Active',
        created_at: new Date('2024-02-10T00:00:00Z'),
        last_login: new Date('2024-06-10T09:00:00Z'),
        must_change_password: false,
        password_changed_at: null,
    },
    {
        id: 3,
        username: 'viewer',
        password_hash: DEFAULT_HASH,
        full_name: 'Siti Rahayu',
        email: 'siti@example.com',
        role: 'Viewer',
        status: 'Active',
        created_at: new Date('2024-03-15T00:00:00Z'),
        last_login: new Date('2024-06-12T10:30:00Z'),
        must_change_password: false,
        password_changed_at: null,
    },
];

// ─── Projects ────────────────────────────────────────────────────────────────
const projects = [
    {
        id: 1,
        name: 'Sistem Monitoring IoT',
        description: 'Platform monitoring perangkat IoT secara real-time menggunakan MQTT dan dashboard web.',
        category: 'IoT',
        thumbnail: null,
        status: 'Active',
        created_by: 2,
        creator_name: 'Budi Santoso',
        doc_count: 2,
        is_member: true,
        created_at: new Date('2024-03-01T00:00:00Z'),
        updated_at: new Date('2024-06-01T00:00:00Z'),
    },
    {
        id: 2,
        name: 'Aplikasi HRD Digital',
        description: 'Sistem manajemen sumber daya manusia berbasis web untuk kebutuhan internal perusahaan.',
        category: 'Software',
        thumbnail: null,
        status: 'Active',
        created_by: 2,
        creator_name: 'Budi Santoso',
        doc_count: 1,
        is_member: true,
        created_at: new Date('2024-04-15T00:00:00Z'),
        updated_at: new Date('2024-06-10T00:00:00Z'),
    },
    {
        id: 3,
        name: 'Riset Material Komposit',
        description: 'Penelitian dan pengembangan material komposit ringan untuk aplikasi aerospace.',
        category: 'Research',
        thumbnail: null,
        status: 'Completed',
        created_by: 2,
        creator_name: 'Budi Santoso',
        doc_count: 3,
        is_member: false,
        created_at: new Date('2024-01-20T00:00:00Z'),
        updated_at: new Date('2024-05-20T00:00:00Z'),
    },
];

// ─── Project Members ──────────────────────────────────────────────────────────
const projectMembers = [
    { id: 1, project_id: 1, user_id: 2, role: 'owner',  joined_at: new Date('2024-03-01T00:00:00Z'), username: 'rnd_user',  full_name: 'Budi Santoso'  },
    { id: 2, project_id: 1, user_id: 3, role: 'member', joined_at: new Date('2024-03-10T00:00:00Z'), username: 'viewer',    full_name: 'Siti Rahayu'   },
    { id: 3, project_id: 2, user_id: 2, role: 'owner',  joined_at: new Date('2024-04-15T00:00:00Z'), username: 'rnd_user',  full_name: 'Budi Santoso'  },
    { id: 4, project_id: 3, user_id: 2, role: 'owner',  joined_at: new Date('2024-01-20T00:00:00Z'), username: 'rnd_user',  full_name: 'Budi Santoso'  },
];

// ─── Documentation ────────────────────────────────────────────────────────────
const documentation = [
    {
        id: 1,
        project_id: 1,
        title: 'Arsitektur Sistem',
        content: '# Arsitektur Sistem IoT\n\nSistem terdiri dari layer sensor, gateway MQTT, dan dashboard web.',
        file_url: null,
        created_by: 2,
        creator_name: 'Budi Santoso',
        created_at: new Date('2024-03-05T00:00:00Z'),
        updated_at: new Date('2024-03-05T00:00:00Z'),
    },
    {
        id: 2,
        project_id: 1,
        title: 'Panduan Instalasi',
        content: '# Panduan Instalasi\n\n1. Clone repository\n2. Jalankan `npm install`\n3. Konfigurasi `.env`',
        file_url: null,
        created_by: 2,
        creator_name: 'Budi Santoso',
        created_at: new Date('2024-03-10T00:00:00Z'),
        updated_at: new Date('2024-03-10T00:00:00Z'),
    },
    {
        id: 3,
        project_id: 2,
        title: 'Spesifikasi Kebutuhan',
        content: '# Spesifikasi Kebutuhan\n\nDokumen ini menjelaskan kebutuhan fungsional dan non-fungsional sistem HRD.',
        file_url: null,
        created_by: 2,
        creator_name: 'Budi Santoso',
        created_at: new Date('2024-04-20T00:00:00Z'),
        updated_at: new Date('2024-04-20T00:00:00Z'),
    },
    {
        id: 4,
        project_id: 3,
        title: 'Laporan Pengujian Material',
        content: '# Laporan Pengujian\n\nHasil uji tarik dan tekan material komposit serat karbon.',
        file_url: null,
        created_by: 2,
        creator_name: 'Budi Santoso',
        created_at: new Date('2024-02-01T00:00:00Z'),
        updated_at: new Date('2024-02-01T00:00:00Z'),
    },
];

// ─── Logbook ──────────────────────────────────────────────────────────────────
const logbook = [
    {
        id: 1,
        project_id: 1,
        user_id: 2,
        author_name: 'Budi Santoso',
        date: new Date('2024-03-15'),
        activity: 'Setup environment MQTT broker menggunakan Mosquitto.',
        notes: 'Berhasil connect perangkat sensor suhu.',
        created_at: new Date('2024-03-15T14:00:00Z'),
    },
    {
        id: 2,
        project_id: 1,
        user_id: 2,
        author_name: 'Budi Santoso',
        date: new Date('2024-03-20'),
        activity: 'Pengembangan dashboard real-time menggunakan Chart.js.',
        notes: 'Integrasi WebSocket berhasil.',
        created_at: new Date('2024-03-20T15:00:00Z'),
    },
    {
        id: 3,
        project_id: 2,
        user_id: 2,
        author_name: 'Budi Santoso',
        date: new Date('2024-05-01'),
        activity: 'Design database schema untuk modul absensi.',
        notes: 'Schema disetujui tim.',
        created_at: new Date('2024-05-01T10:00:00Z'),
    },
];

// ─── Error Reports ────────────────────────────────────────────────────────────
const errorReports = [
    {
        id: 1,
        project_id: 1,
        title: 'Koneksi MQTT Terputus Saat Beban Tinggi',
        description: 'Broker MQTT terputus ketika jumlah client melebihi 100 koneksi simultan.',
        severity: 'High',
        status: 'Open',
        reported_by: 2,
        reporter_name: 'Budi Santoso',
        created_at: new Date('2024-04-10T09:00:00Z'),
        updated_at: new Date('2024-04-10T09:00:00Z'),
    },
    {
        id: 2,
        project_id: 2,
        title: 'Form Validasi Tidak Berjalan di Safari',
        description: 'Validasi client-side pada form absensi tidak berfungsi di browser Safari 17.',
        severity: 'Medium',
        status: 'In Progress',
        reported_by: 3,
        reporter_name: 'Siti Rahayu',
        created_at: new Date('2024-05-15T11:00:00Z'),
        updated_at: new Date('2024-05-20T11:00:00Z'),
    },
];

// ─── Activity Log ─────────────────────────────────────────────────────────────
const activityLog = [
    {
        id: 1,
        user_id: 1,
        username: 'admin',
        full_name: 'Administrator',
        action: 'LOGIN',
        resource_type: null,
        resource_id: null,
        metadata: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mock Browser',
        timestamp: new Date('2024-06-01T08:00:00Z'),
    },
    {
        id: 2,
        user_id: 2,
        username: 'rnd_user',
        full_name: 'Budi Santoso',
        action: 'create',
        resource_type: 'project',
        resource_id: 1,
        metadata: JSON.stringify({ name: 'Sistem Monitoring IoT' }),
        ip_address: '127.0.0.1',
        user_agent: 'Mock Browser',
        timestamp: new Date('2024-03-01T10:00:00Z'),
    },
    {
        id: 3,
        user_id: 2,
        username: 'rnd_user',
        full_name: 'Budi Santoso',
        action: 'LOGIN',
        resource_type: null,
        resource_id: null,
        metadata: null,
        ip_address: '127.0.0.1',
        user_agent: 'Mock Browser',
        timestamp: new Date('2024-06-10T09:00:00Z'),
    },
];

// ─── Settings ─────────────────────────────────────────────────────────────────
const settings = [
    { id: 1, key: 'app_name',          value: 'R&D Hub (Mock Mode)', updated_at: new Date() },
    { id: 2, key: 'app_description',   value: 'Platform dokumentasi riset dan pengembangan', updated_at: new Date() },
    { id: 3, key: 'allow_registration',value: 'false', updated_at: new Date() },
    { id: 4, key: 'max_upload_size',   value: '10', updated_at: new Date() },
];

// ─── Counters for auto-increment IDs ─────────────────────────────────────────
const counters = {
    users:          users.length,
    projects:       projects.length,
    projectMembers: projectMembers.length,
    documentation:  documentation.length,
    logbook:        logbook.length,
    errorReports:   errorReports.length,
    activityLog:    activityLog.length,
    settings:       settings.length,
};

const nextId = (entity) => ++counters[entity];

module.exports = {
    users,
    projects,
    projectMembers,
    documentation,
    logbook,
    errorReports,
    activityLog,
    settings,
    nextId,
};
