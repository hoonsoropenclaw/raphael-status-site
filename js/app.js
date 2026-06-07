
// Hermes Status Site - app.js
// 2026-06-07 修復:移除重複 showTab 定義(loadTab 已在 index.html inline 定義)
// 這個檔案只放與「非 tab 切換」相關的全域行為

// 舊版為了向後相容保留 showTab 名稱(其他 inline 可能引用)
function showTab(name) {
    if (typeof loadTab === 'function') loadTab(name);
}

// ── Auto-refresh dashboard clock ──
function refreshDashboard() {
    const el = document.getElementById('dashboard-time');
    if (el) el.textContent = new Date().toLocaleString('zh-TW');
}
setInterval(refreshDashboard, 5000);

// ── Console error monitor (開發用) ──
window.addEventListener('error', (e) => {
    console.error('[global error]', e.message, e.filename, e.lineno);
});
