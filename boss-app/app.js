// Khilonfast Boss Panel — vanilla JS, framework yok (tek ekran, düşük bakım riski).

const API_BASE = 'https://khilonfast.com/api';
const ONESIGNAL_APP_ID = '65674df9-154d-4521-b420-a3445fccb7f2';
const POLL_MS = 15000;
const TOKEN_KEY = 'boss_token';

const $ = (sel) => document.querySelector(sel);

function getToken() { return localStorage.getItem(TOKEN_KEY); }
function setToken(t) { localStorage.setItem(TOKEN_KEY, t); }
function clearToken() { localStorage.removeItem(TOKEN_KEY); }

async function apiFetch(path, opts = {}) {
  const token = getToken();
  const headers = Object.assign({ 'Content-Type': 'application/json' }, opts.headers || {});
  if (token) headers.Authorization = 'Bearer ' + token;
  const res = await fetch(API_BASE + path, Object.assign({}, opts, { headers }));
  if (res.status === 401) {
    clearToken();
    showLogin();
    throw new Error('Unauthorized');
  }
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || 'İstek başarısız');
  return body;
}

function showLogin() {
  $('#feed-screen').classList.add('hidden');
  $('#login-screen').classList.remove('hidden');
}

function showFeed() {
  $('#login-screen').classList.add('hidden');
  $('#feed-screen').classList.remove('hidden');
  startPolling();
  maybeShowPushBanner();
}

function fmtMoney(amount, currency) {
  return new Intl.NumberFormat('tr-TR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(amount) + ' ' + (currency || 'TRY');
}

function fmtTime(iso) {
  if (!iso) return '';
  const d = new Date(iso.replace(' ', 'T'));
  return d.toLocaleString('tr-TR', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' });
}

async function doLogin() {
  const pin = $('#pin-input').value.trim();
  const errorEl = $('#login-error');
  errorEl.textContent = '';
  if (pin.length < 4) {
    errorEl.textContent = 'PIN girin.';
    return;
  }
  try {
    const res = await fetch(API_BASE + '/boss/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ pin }),
    });
    const body = await res.json();
    if (!res.ok) {
      errorEl.textContent = body.error || 'Giriş başarısız';
      return;
    }
    setToken(body.token);
    $('#pin-input').value = '';
    showFeed();
  } catch (e) {
    errorEl.textContent = 'Bağlantı hatası: ' + e.message;
  }
}

function renderList(containerId, items, renderItem, emptyText) {
  const el = $(containerId);
  if (!items || items.length === 0) {
    el.innerHTML = '<div class="empty">' + emptyText + '</div>';
    return;
  }
  el.innerHTML = items.map(renderItem).join('');
}

async function loadFeed() {
  try {
    const data = await apiFetch('/boss/feed');
    $('#feed-time').textContent = 'Güncellendi: ' + new Date().toLocaleTimeString('tr-TR');

    renderList('#pending-transfers-list', data.pending_transfers, (o) => `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${o.order_number}</div>
          <div class="item-sub">${o.customer_name || o.email || ''} · ${fmtTime(o.created_at)}</div>
        </div>
        <div class="item-amount">${fmtMoney(o.total_amount, o.currency)}</div>
      </div>
    `, 'Bekleyen havale onayı yok.');

    renderList('#recent-orders-list', data.recent_orders, (o) => `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${o.order_number}</div>
          <div class="item-sub">${o.customer_name || o.email || ''} · ${o.payment_method || ''} · ${fmtTime(o.created_at)}</div>
        </div>
        <div class="item-amount">${fmtMoney(o.total_amount, o.currency)}</div>
      </div>
    `, 'Henüz sipariş yok.');

    renderList('#campaigns-list', data.campaigns, (c) => `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${c.name}</div>
          <div class="item-sub">${c.sent}/${c.total} gönderildi</div>
        </div>
        <span class="badge ${c.status === 'sending' ? 'badge-warning' : 'badge-lime'}">${c.status === 'sending' ? 'Gönderiliyor' : 'Tamamlandı'}</span>
      </div>
    `, 'Aktif kampanya yok.');

    renderList('#automation-alerts-list', data.automation_alerts, (a) => `
      <div class="item">
        <div class="item-main">
          <div class="item-title">${a.automation_name || 'Otomasyon'}</div>
          <div class="item-sub">${a.contact_email || ''} · ${(a.last_error || '').slice(0, 80)}</div>
        </div>
        <span class="badge badge-danger">${fmtTime(a.completed_at)}</span>
      </div>
    `, 'Hata yok. 🎉');
  } catch (e) {
    if (e.message !== 'Unauthorized') console.error('[feed]', e.message);
  }
}

let pollTimer = null;
function startPolling() {
  loadFeed();
  if (pollTimer) clearInterval(pollTimer);
  pollTimer = setInterval(loadFeed, POLL_MS);
}

function maybeShowPushBanner() {
  if (!window.OneSignal) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    const permission = await OneSignal.Notifications.permission;
    if (!permission) {
      $('#push-banner').classList.remove('hidden');
    }
  });
}

function initOneSignal() {
  if (ONESIGNAL_APP_ID.startsWith('REPLACE_')) return;
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.init({ appId: ONESIGNAL_APP_ID, allowLocalhostAsSecureOrigin: true });
  });
}

$('#login-btn').addEventListener('click', doLogin);
$('#pin-input').addEventListener('keydown', (e) => { if (e.key === 'Enter') doLogin(); });
$('#enable-push-btn').addEventListener('click', () => {
  window.OneSignalDeferred = window.OneSignalDeferred || [];
  window.OneSignalDeferred.push(async function (OneSignal) {
    await OneSignal.Notifications.requestPermission();
    $('#push-banner').classList.add('hidden');
  });
});

$('#test-notify-btn').addEventListener('click', async (e) => {
  const btn = e.target;
  const original = btn.textContent;
  btn.textContent = 'Gönderiliyor…';
  btn.disabled = true;
  try {
    const result = await apiFetch('/boss/test-notify', { method: 'POST' });
    btn.textContent = result.ok ? '✅ Gönderildi' : '❌ ' + (result.reason || 'Bilinmeyen hata');
  } catch (err) {
    btn.textContent = '❌ ' + err.message;
  } finally {
    setTimeout(() => { btn.textContent = original; btn.disabled = false; }, 4000);
  }
});

initOneSignal();
if (getToken()) {
  showFeed();
} else {
  showLogin();
}
