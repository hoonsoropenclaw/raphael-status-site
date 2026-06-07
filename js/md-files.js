/* js/md-files.js — 核心MD檔卡片邏輯 */

(function () {
    'use strict';

    // ── toggle ──────────────────────────────────────────────────────
    window.toggleFile = function (name) {
        var grid = document.getElementById('files-grid');
        if (!grid) return;
        var cards = grid.querySelectorAll('.file-card');
        for (var i = 0; i < cards.length; i++) {
            var c = cards[i];
            if (c.dataset.file === name) {
                var isOpen = c.classList.contains('open');
                c.classList.toggle('open', !isOpen);
                c.querySelector('.file-card-arrow').textContent = isOpen ? '▼' : '▲';
                var body = c.querySelector('.file-card-body');
                if (body) body.style.display = isOpen ? 'none' : 'block';
                if (!isOpen) c.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            } else {
                c.classList.remove('open');
                var arrow = c.querySelector('.file-card-arrow');
                if (arrow) arrow.textContent = '▼';
                var body = c.querySelector('.file-card-body');
                if (body) body.style.display = 'none';
            }
        }
    };

    // ── copy ────────────────────────────────────────────────────────
    window.copyContent = function (name) {
        var card = document.querySelector('.file-card[data-file="' + name + '"]');
        if (!card) return;
        var content = card.querySelector('.file-content');
        if (!content) return;
        var text = content.textContent;
        var btn = card.querySelector('.copy-btn');
        var orig = btn ? btn.innerHTML : '';

        var finish = function () {
            if (btn) {
                btn.innerHTML = '✓ 已複製';
                btn.style.background = '#10b981';
                setTimeout(function () {
                    btn.innerHTML = orig;
                    btn.style.background = '';
                }, 1800);
            }
        };

        if (navigator.clipboard && navigator.clipboard.writeText) {
            navigator.clipboard.writeText(text).then(finish).catch(function () { fallbackCopy(text); finish(); });
        } else {
            fallbackCopy(text);
            finish();
        }
    };

    function fallbackCopy(text) {
        var ta = document.createElement('textarea');
        ta.value = text;
        ta.style.cssText = 'position:fixed;opacity:0;top:0;left:0';
        document.body.appendChild(ta);
        ta.select();
        document.execCommand('copy');
        document.body.removeChild(ta);
    }

    // ── render ──────────────────────────────────────────────────────
    window.renderMdFiles = function (filesData) {
        var grid = document.getElementById('files-grid');
        var syncTime = document.getElementById('sync-time');
        if (!grid) return;

        if (!filesData || filesData.length === 0) {
            grid.innerHTML = '<div class="empty-state">核心MD檔內容將在下次排程同步後顯示<br><small>每日 09:00 自動同步更新</small></div>';
            if (syncTime) syncTime.textContent = '等待同步...';
            return;
        }

        var latest = filesData.reduce(function (a, b) {
            return parseInt(a.mtime) > parseInt(b.mtime) ? a : b;
        });
        var d = new Date(parseInt(latest.mtime) * 1000);
        if (syncTime) syncTime.textContent = '最後同步: ' + d.toLocaleString('zh-TW', { hour: '2-digit', minute: '2-digit', second: '2-digit' }) + ' · ' + filesData.length + ' 個檔案';

        var FILE_META = {
            "SOUL.md":      { icon: "💜", dot: "dot-purple" },
            "USER.md":      { icon: "👤", dot: "dot-blue" },
            "HEARTBEAT.md": { icon: "💓", dot: "dot-red" },
            "AGENTS.md":    { icon: "🤖", dot: "dot-green" },
            "IDENTITY.md":  { icon: "🪪", dot: "dot-cyan" },
            "TOOLS.md":     { icon: "🔧", dot: "dot-orange" },
            "MEMORY.md":    { icon: "🧠", dot: "dot-yellow" },
        };

        var html = '';
        for (var j = 0; j < filesData.length; j++) {
            var f = filesData[j];
            var meta = FILE_META[f.name] || { icon: '📄', dot: 'dot-blue' };
            var preview = f.preview || '(無預覽)';
            var safeContent = escapeHtml(f.content || '');
            var dot = meta.dot || 'dot-blue';

            html += '<div class="file-card" data-file="' + f.name + '" onclick="toggleFile(\'' + f.name + '\')">' +
                '<div class="file-card-header">' +
                    '<div class="file-card-icon ' + dot + '">' + meta.icon + '</div>' +
                    '<div class="file-card-info">' +
                        '<div class="file-card-name">' + f.name + '</div>' +
                        '<div class="file-card-path">~/.hermes/memories/' + f.name + '</div>' +
                        '<div class="file-card-preview">' + escapeHtml(preview) + '</div>' +
                    '</div>' +
                    '<div class="file-card-arrow">▼</div>' +
                '</div>' +
                '<div class="file-card-body">' +
                    '<div class="file-card-toolbar">' +
                        '<button class="copy-btn" onclick="event.stopPropagation();copyContent(\'' + f.name + '\')">📋 複製內容</button>' +
                        '<span class="file-label">展開後可複製全部內容</span>' +
                    '</div>' +
                    '<div class="file-content">' + safeContent + '</div>' +
                '</div>' +
            '</div>';
        }
        grid.innerHTML = html;
    };

    function escapeHtml(text) {
        var d = document.createElement('div');
        d.textContent = text;
        return d.innerHTML;
    }

    // ── init (called by loadTab after HTML injection) ─────────────────
    // Uses a flag to ensure only one XHR is in flight at a time.
    var __xhrInFlight = false;

    window.mdFilesInit = function () {
        var grid = document.getElementById('files-grid');
        if (!grid) return;
        if (__xhrInFlight) return;

        __xhrInFlight = true;
        var xhr = new XMLHttpRequest();
        xhr.open('GET', 'assets/md-files.json', true);
        xhr.onload = function () {
            __xhrInFlight = false;
            if (xhr.status === 200) {
                try {
                    var data = JSON.parse(xhr.responseText);
                    window.renderMdFiles(data);
                    return;
                } catch (e) { /* fall through */ }
            }
            var grid2 = document.getElementById('files-grid');
            if (grid2) grid2.innerHTML = '<div class="empty-state">核心MD檔內容將在下次排程同步後顯示<br><small>每日 09:00 自動同步更新</small></div>';
            var st = document.getElementById('sync-time');
            if (st) st.textContent = '等待同步...';
        };
        xhr.onerror = function () {
            __xhrInFlight = false;
            var st = document.getElementById('sync-time');
            if (st) st.textContent = '讀取失敗';
        };
        xhr.send();
    };

}());