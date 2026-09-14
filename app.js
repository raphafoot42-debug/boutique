// Global State
let me = null;
let users = [];
let categories = [];
let channels = [];
let messages = {};
let dms = {};
let courses = [];
let progress = [];
let badges = [];
let announcement = { text: "" };

let activeView = 'groupes';
let activeChannel = null;
let activeDmUser = null;
let activeTab = 'membres';
let sidebarOpen = false;
let pollingTimer = null;
let pendingImageBase64 = null;

const ICON_PATHS = {
  chat: '<path d="M21 11.5a8.38 8.38 0 0 1-.9 3.8 8.5 8.5 0 0 1-7.6 4.7 8.38 8.38 0 0 1-3.8-.9L3 21l1.9-5.7a8.38 8.38 0 0 1-.9-3.8 8.5 8.5 0 0 1 4.7-7.6 8.38 8.38 0 0 1 3.8-.9h.5a8.48 8.48 0 0 1 8 8v.5z"/>',
  megaphone: '<path d="M3 11v2a1 1 0 0 0 1 1h2l4 4V6l-4 4H4a1 1 0 0 0-1 1z"/><path d="M14 8a4 4 0 0 1 0 8"/><path d="M17 5a8 8 0 0 1 0 14"/>',
  mail: '<rect x="3" y="5" width="18" height="14" rx="2"/><path d="M3 7l9 6 9-6"/>',
  cap: '<path d="M2 9l10-5 10 5-10 5-10-5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/><path d="M22 9v7"/>',
  settings: '<circle cx="12" cy="12" r="3"/><path d="M19.4 15a1.65 1.65 0 0 0 .33 1.82l.06.06a2 2 0 0 1 0 2.83 2 2 0 0 1-2.83 0l-.06-.06a1.65 1.65 0 0 0-1.82-.33 1.65 1.65 0 0 0-1 1.51V21a2 2 0 0 1-2 2 2 2 0 0 1-2-2v-.09A1.65 1.65 0 0 0 9 19.4a1.65 1.65 0 0 0-1.82.33l-.06.06a2 2 0 0 1-2.83 0 2 2 0 0 1 0-2.83l.06-.06a1.65 1.65 0 0 0 .33-1.82 1.65 1.65 0 0 0-1.51-1H3a2 2 0 0 1-2-2 2 2 0 0 1 2-2h.09A1.65 1.65 0 0 0 4.6 9a1.65 1.65 0 0 0-.33-1.82l-.06-.06a2 2 0 0 1 0-2.83 2 2 0 0 1 2.83 0l.06.06a1.65 1.65 0 0 0 1.82.33H9a1.65 1.65 0 0 0 1-1.51V3a2 2 0 0 1 2-2 2 2 0 0 1 2 2v.09a1.65 1.65 0 0 0 1 1.51 1.65 1.65 0 0 0 1.82-.33l.06-.06a2 2 0 0 1 2.83 0 2 2 0 0 1 0 2.83l-.06.06a1.65 1.65 0 0 0-.33 1.82V9a1.65 1.65 0 0 0 1.51 1H21a2 2 0 0 1 2 2 2 2 0 0 1-2 2h-.09a1.65 1.65 0 0 0-1.51 1z"/>',
  pin: '<line x1="12" y1="17" x2="12" y2="22"/><path d="M5 17h14l-1.5-6H6.5L5 17z"/><path d="M9 11V4h6v7"/>',
  plus: '<line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>',
  trash: '<polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/>',
  image: '<rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/>',
  smile: '<circle cx="12" cy="12" r="10"/><path d="M8 14s1.5 2 4 2 4-2 4-2"/><line x1="9" y1="9" x2="9.01" y2="9"/><line x1="15" y1="9" x2="15.01" y2="9"/>',
  search: '<circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/>',
  check: '<polyline points="20 6 9 17 4 12"/>',
  lock: '<rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/>',
  menu: '<line x1="3" y1="12" x2="21" y2="12"/><line x1="3" y1="6" x2="21" y2="6"/><line x1="3" y1="18" x2="21" y2="18"/>',
  user: '<path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>',
  shield: '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>'
};

function icon(name, extraStyle){
  return '<svg viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:-0.15em;flex-shrink:0;' + (extraStyle||'') + '">' + (ICON_PATHS[name]||'') + '</svg>';
}

function escapeHtml(str){
  return String(str || '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
}

window.setAuthMode = function(mode) {
  document.getElementById('authError').style.display = 'none';
  if (mode === 'login') {
    document.getElementById('tabLoginBtn').classList.add('active');
    document.getElementById('tabRegisterBtn').classList.remove('active');
    document.getElementById('authLoginForm').style.display = 'block';
    document.getElementById('authRegisterForm').style.display = 'none';
  } else {
    document.getElementById('tabRegisterBtn').classList.add('active');
    document.getElementById('tabLoginBtn').classList.remove('active');
    document.getElementById('authLoginForm').style.display = 'none';
    document.getElementById('authRegisterForm').style.display = 'block';
  }
};

async function apiFetch(url, options = {}) {
  options.headers = options.headers || {};
  if (!options.headers['Content-Type'] && options.body) {
    options.headers['Content-Type'] = 'application/json';
  }
  options.credentials = 'include';
  const res = await fetch(url, options);
  const data = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(data.error || 'Erreur serveur');
  }
  return data;
}

async function initAuth() {
  try {
    const data = await apiFetch('/api/auth/me');
    me = data.user;
    showApp();
  } catch(e) {
    showLogin();
  }
}

function showLogin() {
  if (pollingTimer) clearInterval(pollingTimer);
  document.getElementById('login').style.display = 'flex';
  document.getElementById('app').style.display = 'none';
  document.getElementById('adminOverlay').style.display = 'none';
}

async function showApp() {
  document.getElementById('login').style.display = 'none';
  document.getElementById('app').style.display = 'block';
  await loadAppData();
  if (!pollingTimer) {
    pollingTimer = setInterval(pollAppData, 3000);
  }
}

window.handleAuthLogin = async function(e) {
  e.preventDefault();
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  const email = document.getElementById('loginEmail').value;
  const password = document.getElementById('loginPassword').value;
  try {
    const data = await apiFetch('/api/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password })
    });
    me = data.user;
    showApp();
  } catch(err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
};

window.handleAuthRegister = async function(e) {
  e.preventDefault();
  const errEl = document.getElementById('authError');
  errEl.style.display = 'none';
  const name = document.getElementById('regName').value;
  const email = document.getElementById('regEmail').value;
  const password = document.getElementById('regPassword').value;
  try {
    const data = await apiFetch('/api/auth/register', {
      method: 'POST',
      body: JSON.stringify({ name, email, password })
    });
    me = data.user;
    showApp();
  } catch(err) {
    errEl.textContent = err.message;
    errEl.style.display = 'block';
  }
};

window.logout = async function() {
  try { await apiFetch('/api/auth/logout', { method: 'POST' }); } catch(e){}
  me = null;
  showLogin();
};

async function loadAppData() {
  try {
    const [catsData, chansData, usersData, coursesData, progData, annData, badgesData] = await Promise.all([
      apiFetch('/api/categories'),
      apiFetch('/api/channels'),
      apiFetch('/api/users'),
      apiFetch('/api/courses'),
      apiFetch('/api/progress'),
      apiFetch('/api/announcement'),
      apiFetch('/api/badges')
    ]);

    categories = catsData;
    channels = chansData;
    users = usersData;
    courses = coursesData;
    progress = progData;
    announcement = annData;
    badges = badgesData;

    if (!activeChannel && channels.length > 0) {
      activeChannel = channels[0].id;
    }

    if (activeChannel) {
      messages[activeChannel] = await apiFetch('/api/messages/' + activeChannel);
    }
    if (activeDmUser) {
      dms[activeDmUser] = await apiFetch('/api/dms/' + activeDmUser);
    }

    renderApp();
  } catch(e) {
    console.error("Erreur chargement donnees:", e);
  }
}

async function pollAppData() {
  if (!me) return;
  try {
    const [chansData, usersData, annData] = await Promise.all([
      apiFetch('/api/channels'),
      apiFetch('/api/users'),
      apiFetch('/api/announcement')
    ]);
    channels = chansData;
    users = usersData;
    announcement = annData;

    if (activeChannel && (activeView === 'groupes' || activeView === 'canaux')) {
      messages[activeChannel] = await apiFetch('/api/messages/' + activeChannel);
    }
    if (activeDmUser && activeView === 'dm') {
      dms[activeDmUser] = await apiFetch('/api/dms/' + activeDmUser);
    }

    renderApp();
  } catch(e) {}
}

function badgeHtml(user) {
  if (!user || !user.badge_id) return '';
  const b = badges.find(x => x.id === user.badge_id);
  if (!b) return '';
  return '<span class="member-badge" style="background:' + b.color + '22; color:' + b.color + '; border:1px solid ' + b.color + '44;">' + escapeHtml(b.label) + '</span>';
}

function avatarHtml(user) {
  const initial = user && user.name ? user.name.charAt(0).toUpperCase() : '?';
  return '<div class="avatar">' + initial + '</div>';
}

function statusDot(user) {
  const isOnline = user && user.statut === 'online';
  return '<span class="status-dot ' + (isOnline ? 'online' : 'offline') + '"></span>';
}

window.setView = function(v) {
  activeView = v;
  if (v === 'dm' && !activeDmUser && users.length > 0) {
    const other = users.find(u => u.id !== me.id);
    if (other) activeDmUser = other.id;
  }
  loadAppData();
};

window.setChannel = function(id) {
  activeChannel = id;
  loadAppData();
};

window.setDmUser = function(id) {
  activeDmUser = id;
  loadAppData();
};

function renderApp() {
  const app = document.getElementById('app');
  const activeChan = channels.find(c => c.id === activeChannel);
  const activeDm = users.find(u => u.id === activeDmUser);

  let navHtml = '<header class="topbar">' +
    '<div style="display:flex; align-items:center; gap:12px;">' +
      '<button class="menu-btn" onclick="sidebarOpen = !sidebarOpen; renderApp();">' + icon('menu') + '</button>' +
      '<div class="logo-box">S</div>' +
      '<div class="brand-title">Sparkidea</div>' +
    '</div>' +

    '<nav class="nav-links">' +
      '<button class="nav-btn ' + (activeView === 'groupes' ? 'active' : '') + '" onclick="setView(\'groupes\')">' + icon('chat') + ' Groupes</button>' +
      '<button class="nav-btn ' + (activeView === 'canaux' ? 'active' : '') + '" onclick="setView(\'canaux\')">' + icon('megaphone') + ' Canaux</button>' +
      '<button class="nav-btn ' + (activeView === 'formations' ? 'active' : '') + '" onclick="setView(\'formations\')">' + icon('cap') + ' Formations</button>' +
      '<button class="nav-btn ' + (activeView === 'dm' ? 'active' : '') + '" onclick="setView(\'dm\')">' + icon('mail') + ' Messages Prives</button>' +
    '</nav>' +

    '<div style="display:flex; align-items:center; gap:10px;">' +
      (me && me.role === 'admin' ? '<button class="btn-outline" style="padding:6px 12px; font-size:12px;" onclick="openAdmin()">' + icon('shield') + ' Admin</button>' : '') +
      '<div style="display:flex; align-items:center; gap:6px; font-size:12px; color:var(--text-sec);">' +
        avatarHtml(me) +
        '<span>' + escapeHtml(me ? me.name : '') + '</span>' +
        '<button style="background:none; border:none; color:var(--text-sec); cursor:pointer; margin-left:6px;" onclick="logout()" title="Deconnexion">&cross;</button>' +
      '</div>' +
    '</div>' +
  '</header>';

  let announcementHtml = '';
  if (announcement && announcement.text) {
    announcementHtml = '<div style="background:var(--gold-bg); border-bottom:1px solid var(--gold-dim); padding:8px 16px; font-size:12.5px; color:var(--gold); display:flex; align-items:center; justify-content:space-between;">' +
      '<div>📢 <strong>Annonce :</strong> ' + escapeHtml(announcement.text) + '</div>' +
    '</div>';
  }

  let sidebarHtml = '';
  if (activeView === 'groupes' || activeView === 'canaux') {
    const cats = categories.filter(c => c.type === (activeView === 'groupes' ? 'groupe' : 'canal'));
    sidebarHtml = '<div class="sidebar ' + (sidebarOpen ? 'open' : '') + '">' +
      '<div class="sidebar-head">' + (activeView === 'groupes' ? 'Groupes de discussion' : 'Canaux d\'information') + '</div>' +
      '<div style="flex:1; overflow-y:auto; padding:10px 8px;">' +
        cats.map(cat => {
          const chanList = channels.filter(ch => ch.category_id === cat.id);
          return '<div style="margin-bottom:12px;">' +
            '<div class="cat-title">' + escapeHtml(cat.name) + '</div>' +
            chanList.map(ch =>
              '<div class="chan ' + (ch.id === activeChannel ? 'active' : '') + '" onclick="setChannel(\'' + ch.id + '\')">' +
                (activeView === 'canaux' ? icon('megaphone') : '#') + '&nbsp;' + escapeHtml(ch.name) +
              '</div>'
            ).join('') +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  } else if (activeView === 'dm') {
    const otherUsers = users.filter(u => u.id !== me.id);
    sidebarHtml = '<div class="sidebar ' + (sidebarOpen ? 'open' : '') + '">' +
      '<div class="sidebar-head">Membres</div>' +
      '<div style="flex:1; overflow-y:auto; padding:8px;">' +
        otherUsers.map(u =>
          '<div class="chan ' + (u.id === activeDmUser ? 'active' : '') + '" onclick="setDmUser(\'' + u.id + '\')" style="display:flex; align-items:center; gap:8px;">' +
            statusDot(u) +
            '<span>' + escapeHtml(u.name) + '</span>' +
          '</div>'
        ).join('') +
      '</div>' +
    '</div>';
  }

  let mainContentHtml = '';

  if (activeView === 'groupes' || activeView === 'canaux') {
    const msgList = (activeChannel && messages[activeChannel]) || [];
    mainContentHtml = '<div class="chat-area">' +
      '<div class="chat-header">' +
        '<div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:6px;">' +
          (activeView === 'canaux' ? icon('megaphone') : '#') + ' ' + escapeHtml(activeChan ? activeChan.name : 'Salon') +
        '</div>' +
        '<div style="font-size:12px; color:var(--text-sec);">' + escapeHtml(activeChan ? activeChan.welcome || '' : '') + '</div>' +
      '</div>' +

      '<div class="messages-list" id="messagesContainer">' +
        (msgList.length === 0 ? '<div style="text-align:center; padding:40px; color:var(--text-sec); font-size:13px;">Aucun message pour l\'instant. Soyez le premier a ecrire !</div>' : '') +
        msgList.map(m =>
          '<div class="message-row">' +
            '<div class="avatar">' + (m.author ? m.author.charAt(0).toUpperCase() : '?') + '</div>' +
            '<div style="flex:1;">' +
              '<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">' +
                '<span style="font-weight:700; font-size:13px;">' + escapeHtml(m.author || 'Membre') + '</span>' +
                (m.author_badge ? badgeHtml({ badge_id: m.author_badge }) : '') +
                '<span style="font-size:10.5px; color:var(--text-sec);">' + new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</span>' +
                (m.pinned ? '<span style="color:var(--gold); font-size:11px;">📌 Epingle</span>' : '') +
              '</div>' +
              '<div style="font-size:13.5px; line-height:1.4; word-break:break-word;">' + escapeHtml(m.text) + '</div>' +
              (m.image_url ? '<img src="' + m.image_url + '" style="max-width:300px; border-radius:8px; margin-top:6px; display:block;">' : '') +
            '</div>' +
            ((m.author_id === me.id || me.role === 'admin') ?
              '<button style="background:none; border:none; color:var(--text-sec); cursor:pointer;" onclick="deleteMsg(\'' + m.id + '\')" title="Supprimer">' + icon('trash') + '</button>'
            : '') +
          '</div>'
        ).join('') +
      '</div>' +

      '<div class="chat-input-box">' +
        (pendingImageBase64 ? '<div style="margin-bottom:6px; font-size:11px; color:var(--gold);">📷 Image jointe prete</div>' : '') +
        '<div style="display:flex; gap:8px;">' +
          '<input type="file" id="imgFileInput" accept="image/*" style="display:none;" onchange="handleImageUpload(event)">' +
          '<button class="btn-outline" style="padding:8px 12px;" onclick="document.getElementById(\'imgFileInput\').click()">' + icon('image') + '</button>' +
          '<input id="chatInput" placeholder="Envoyer un message..." style="flex:1;" onkeydown="if(event.key===\'Enter\') sendChannelMessage()">' +
          '<button class="btn-gold" style="padding:8px 18px;" onclick="sendChannelMessage()">Envoyer</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else if (activeView === 'dm') {
    const dmList = (activeDmUser && dms[activeDmUser]) || [];
    mainContentHtml = '<div class="chat-area">' +
      '<div class="chat-header">' +
        '<div style="font-weight:700; font-size:15px; display:flex; align-items:center; gap:6px;">' +
          '💬 Discussion privee avec ' + escapeHtml(activeDm ? activeDm.name : 'Membre') +
        '</div>' +
      '</div>' +

      '<div class="messages-list">' +
        (dmList.length === 0 ? '<div style="text-align:center; padding:40px; color:var(--text-sec); font-size:13px;">Aucun message prive pour le moment.</div>' : '') +
        dmList.map(m =>
          '<div class="message-row">' +
            '<div class="avatar">' + (m.author_name ? m.author_name.charAt(0).toUpperCase() : '?') + '</div>' +
            '<div style="flex:1;">' +
              '<div style="display:flex; align-items:center; gap:6px; margin-bottom:2px;">' +
                '<span style="font-weight:700; font-size:13px;">' + escapeHtml(m.author_name || 'Membre') + '</span>' +
                '<span style="font-size:10.5px; color:var(--text-sec);">' + new Date(m.created_at).toLocaleTimeString([], {hour: '2-digit', minute:'2-digit'}) + '</span>' +
              '</div>' +
              '<div style="font-size:13.5px; line-height:1.4;">' + escapeHtml(m.text) + '</div>' +
              (m.image_url ? '<img src="' + m.image_url + '" style="max-width:300px; border-radius:8px; margin-top:6px; display:block;">' : '') +
            '</div>' +
          '</div>'
        ).join('') +
      '</div>' +

      '<div class="chat-input-box">' +
        '<div style="display:flex; gap:8px;">' +
          '<input id="dmInput" placeholder="Envoyer un message prive..." style="flex:1;" onkeydown="if(event.key===\'Enter\') sendDmMessage()">' +
          '<button class="btn-gold" style="padding:8px 18px;" onclick="sendDmMessage()">Envoyer</button>' +
        '</div>' +
      '</div>' +
    '</div>';
  } else if (activeView === 'formations') {
    mainContentHtml = '<div style="flex:1; overflow-y:auto; padding:24px;">' +
      '<h2 class="ff-display" style="font-size:22px; margin-top:0;">📚 Formations & Tutoriels</h2>' +
      '<div style="display:grid; grid-template-columns:repeat(auto-fill, minmax(280px, 1fr)); gap:16px; margin-top:16px;">' +
        courses.map(c => {
          const isDone = progress.includes(c.id);
          return '<div class="card" style="background:var(--bg-elev); border:1px solid var(--border); border-radius:12px; padding:18px; display:flex; flex-direction:column; justify-content:space-between;">' +
            '<div>' +
              '<div style="display:flex; justify-content:space-between; align-items:flex-start; margin-bottom:8px;">' +
                '<span style="font-size:11px; background:var(--bg-elev2); padding:3px 8px; border-radius:4px; color:var(--text-sec);">⏱️ ' + escapeHtml(c.duree) + '</span>' +
                (isDone ? '<span style="color:#3ECF6E; font-size:12px; font-weight:700;">✓ Termine</span>' : '') +
              '</div>' +
              '<h3 style="font-size:15px; font-weight:700; margin:6px 0;">' + escapeHtml(c.title) + '</h3>' +
              '<p style="font-size:12.5px; color:var(--text-sec); line-height:1.4;">' + escapeHtml(c.description) + '</p>' +
            '</div>' +
            '<div style="margin-top:16px; display:flex; gap:8px;">' +
              '<button class="btn-gold" style="flex:1; font-size:12px; padding:8px 0;" onclick="openCourseModal(\'' + c.id + '\')">Voir le cours</button>' +
              '<button class="btn-outline" style="padding:8px 12px; font-size:12px;" onclick="toggleCourseProgress(\'' + c.id + '\')">' +
                (isDone ? 'Marquer a revoir' : 'Marquer fait') +
              '</button>' +
            '</div>' +
          '</div>';
        }).join('') +
      '</div>' +
    '</div>';
  }

  app.innerHTML = navHtml + announcementHtml +
    '<div class="main-layout" style="display:flex; height:calc(100vh - 54px);">' +
      sidebarHtml +
      mainContentHtml +
    '</div>';
}

window.sendChannelMessage = async function() {
  const input = document.getElementById('chatInput');
  const text = input.value.trim();
  if (!text && !pendingImageBase64) return;
  try {
    await apiFetch('/api/messages/' + activeChannel, {
      method: 'POST',
      body: JSON.stringify({ text, image_url: pendingImageBase64 || "" })
    });
    input.value = '';
    pendingImageBase64 = null;
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.sendDmMessage = async function() {
  const input = document.getElementById('dmInput');
  const text = input.value.trim();
  if (!text || !activeDmUser) return;
  try {
    await apiFetch('/api/dms/' + activeDmUser, {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    input.value = '';
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.deleteMsg = async function(id) {
  if (!confirm('Supprimer ce message ?')) return;
  try {
    await apiFetch('/api/messages/' + id, { method: 'DELETE' });
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.toggleCourseProgress = async function(courseId) {
  try {
    await apiFetch('/api/progress', {
      method: 'POST',
      body: JSON.stringify({ course_id: courseId })
    });
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.handleImageUpload = function(e) {
  const file = e.target.files[0];
  if (!file) return;
  const reader = new FileReader();
  reader.onload = (ev) => {
    pendingImageBase64 = ev.target.result;
    renderApp();
  };
  reader.readAsDataURL(file);
};

window.openCourseModal = function(courseId) {
  const course = courses.find(c => c.id === courseId);
  if (!course) return;
  const isDone = progress.includes(courseId);

  const modalBack = document.createElement('div');
  modalBack.className = 'modal-back';
  modalBack.id = 'courseModal';
  modalBack.innerHTML = '<div class="modal" style="width:100%; max-width:640px; background:var(--bg-elev); padding:24px; border-radius:14px; max-height:90vh; overflow-y:auto;">' +
    '<div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:16px;">' +
      '<h2 style="font-size:18px; margin:0;">' + escapeHtml(course.title) + '</h2>' +
      '<button onclick="document.getElementById(\'courseModal\').remove()" style="background:none; border:none; color:var(--text-sec); font-size:20px; cursor:pointer;">&times;</button>' +
    '</div>' +

    (course.video_url ?
      '<div style="position:relative; padding-bottom:56.25%; height:0; overflow:hidden; border-radius:8px; margin-bottom:16px; background:#000;">' +
        '<iframe src="' + course.video_url + '" style="position:absolute; top:0; left:0; width:100%; height:100%; border:none;" allowfullscreen></iframe>' +
      '</div>'
    : '') +

    '<p style="font-size:13.5px; color:var(--text-sec); line-height:1.5;">' + escapeHtml(course.description) + '</p>' +

    (course.links && course.links.length > 0 ?
      '<div style="margin-top:16px;">' +
        '<div style="font-weight:700; font-size:12px; text-transform:uppercase; color:var(--text-sec); margin-bottom:8px;">Ressources :</div>' +
        course.links.map(l => '<a href="' + l.url + '" target="_blank" style="display:block; color:var(--gold); font-size:13px; margin-bottom:4px;">🔗 ' + escapeHtml(l.label) + '</a>').join('') +
      '</div>'
    : '') +

    '<div style="margin-top:24px; display:flex; justify-content:flex-end; gap:12px;">' +
      '<button class="btn-gold" style="padding:10px 20px; font-size:13px;" onclick="toggleCourseProgress(\'' + course.id + '\'); document.getElementById(\'courseModal\').remove();">' +
        (isDone ? 'Marquer a revoir' : 'Valider ce cours') +
      '</button>' +
    '</div>' +
  '</div>';
  document.body.appendChild(modalBack);
};

window.openAdmin = function() {
  document.getElementById('adminOverlay').style.display = 'flex';
  renderAdmin();
};

window.closeAdmin = function() {
  document.getElementById('adminOverlay').style.display = 'none';
};

function renderAdmin() {
  const panel = document.getElementById('adminPanel');
  panel.style.cssText = "width:100%; max-width:860px; background:var(--bg-elev); border:1px solid var(--border); border-radius:14px; padding:24px; max-height:85vh; overflow-y:auto; margin:auto;";

  let contentHtml = '';

  if (activeTab === 'membres') {
    contentHtml = '<div style="margin-top:16px;">' +
      '<h3 style="font-size:15px; margin-bottom:12px;">Liste des membres (' + users.length + ')</h3>' +
      users.map(u =>
        '<div style="display:flex; align-items:center; justify-content:space-between; background:var(--bg-elev2); padding:10px 14px; border-radius:8px; margin-bottom:8px;">' +
          '<div style="display:flex; align-items:center; gap:10px;">' +
            avatarHtml(u) +
            '<div>' +
              '<div style="font-weight:700; font-size:13px;">' + escapeHtml(u.name) + ' ' + badgeHtml(u) + '</div>' +
              '<div style="font-size:11px; color:var(--text-sec);">' + escapeHtml(u.email) + ' — Rôle : ' + escapeHtml(u.role) + '</div>' +
            '</div>' +
          '</div>' +
          (u.id !== me.id ?
            '<select style="font-size:12px;" onchange="updateUserRole(\'' + u.id + '\', this.value)">' +
              '<option value="membre" ' + (u.role === 'membre' ? 'selected' : '') + '>Membre</option>' +
              '<option value="admin" ' + (u.role === 'admin' ? 'selected' : '') + '>Admin</option>' +
            '</select>'
          : '<span style="font-size:11px; color:var(--gold);">Vous</span>') +
        '</div>'
      ).join('') +
    '</div>';
  } else if (activeTab === 'salons') {
    contentHtml = '<div style="margin-top:16px;">' +
      '<h3 style="font-size:15px; margin-bottom:12px;">Ajouter une categorie</h3>' +
      '<div style="display:flex; gap:8px; margin-bottom:20px;">' +
        '<input id="newCatName" placeholder="Nom de la categorie" style="flex:1;">' +
        '<select id="newCatType"><option value="groupe">Groupe</option><option value="canal">Canal</option></select>' +
        '<button class="btn-gold" style="padding:8px 16px;" onclick="addCategory()">Créer</button>' +
      '</div>' +

      '<h3 style="font-size:15px; margin-bottom:12px;">Ajouter un salon</h3>' +
      '<div style="display:flex; gap:8px; margin-bottom:20px;">' +
        '<input id="newChanName" placeholder="Nom du salon" style="flex:1;">' +
        '<select id="newChanCat">' + categories.map(c => '<option value="' + c.id + '">' + escapeHtml(c.name) + ' (' + c.type + ')</option>').join('') + '</select>' +
        '<input id="newChanWelcome" placeholder="Message d\'accueil" style="flex:1;">' +
        '<button class="btn-gold" style="padding:8px 16px;" onclick="addChannel()">Créer</button>' +
      '</div>' +
    '</div>';
  } else if (activeTab === 'formations') {
    contentHtml = '<div style="margin-top:16px;">' +
      '<h3 style="font-size:15px; margin-bottom:12px;">Ajouter une formation</h3>' +
      '<input id="newCourseTitle" placeholder="Titre de la formation" style="width:100%; margin-bottom:8px;">' +
      '<textarea id="newCourseDesc" placeholder="Description..." style="width:100%; margin-bottom:8px;"></textarea>' +
      '<div style="display:flex; gap:8px; margin-bottom:12px;">' +
        '<input id="newCourseDuree" placeholder="Duree (ex: 15 min)" style="flex:1;">' +
        '<input id="newCourseVideo" placeholder="URL Video (YouTube embed)" style="flex:2;">' +
      '</div>' +
      '<button class="btn-gold" style="width:100%; padding:10px 0;" onclick="addCourse()">Ajouter la formation</button>' +
    '</div>';
  } else if (activeTab === 'annonce') {
    contentHtml = '<div style="margin-top:16px;">' +
      '<h3 style="font-size:15px; margin-bottom:12px;">Gestion de l\'Annonce Globale</h3>' +
      '<textarea id="announcementText" placeholder="Texte de l\'annonce..." style="width:100%; height:80px; margin-bottom:12px;">' + escapeHtml(announcement ? announcement.text : '') + '</textarea>' +
      '<div style="display:flex; gap:10px;">' +
        '<button class="btn-gold" style="padding:10px 20px;" onclick="saveAnnouncement()">Mettre a jour l\'annonce</button>' +
        '<button class="btn-outline" style="padding:10px 20px;" onclick="deleteAnnouncement()">Supprimer l\'annonce</button>' +
      '</div>' +
    '</div>';
  }

  panel.innerHTML = '<div style="display:flex; justify-content:space-between; align-items:center; border-bottom:1px solid var(--border); padding-bottom:12px;">' +
    '<h2 style="font-size:18px; margin:0;">🛡️ Panneau d\'administration</h2>' +
    '<button onclick="closeAdmin()" style="background:none; border:none; color:var(--text-sec); font-size:22px; cursor:pointer;">&times;</button>' +
  '</div>' +

  '<div class="auth-tabs" style="margin-top:14px; margin-bottom:14px;">' +
    '<div class="auth-tab ' + (activeTab === 'membres' ? 'active' : '') + '" onclick="activeTab=\'membres\'; renderAdmin();">Membres</div>' +
    '<div class="auth-tab ' + (activeTab === 'salons' ? 'active' : '') + '" onclick="activeTab=\'salons\'; renderAdmin();">Salons & Catégories</div>' +
    '<div class="auth-tab ' + (activeTab === 'formations' ? 'active' : '') + '" onclick="activeTab=\'formations\'; renderAdmin();">Formations</div>' +
    '<div class="auth-tab ' + (activeTab === 'annonce' ? 'active' : '') + '" onclick="activeTab=\'annonce\'; renderAdmin();">Annonce</div>' +
  '</div>' +

  contentHtml;
}

window.updateUserRole = async function(userId, role) {
  try {
    await apiFetch('/api/users/' + userId, {
      method: 'PATCH',
      body: JSON.stringify({ role })
    });
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.addCategory = async function() {
  const name = document.getElementById('newCatName').value.trim();
  const type = document.getElementById('newCatType').value;
  if (!name) return;
  try {
    await apiFetch('/api/categories', {
      method: 'POST',
      body: JSON.stringify({ name, type })
    });
    loadAppData();
    renderAdmin();
  } catch(err) {
    alert(err.message);
  }
};

window.addChannel = async function() {
  const name = document.getElementById('newChanName').value.trim();
  const category_id = document.getElementById('newChanCat').value;
  const welcome = document.getElementById('newChanWelcome').value.trim();
  const cat = categories.find(c => c.id === category_id);
  if (!name || !cat) return;
  try {
    await apiFetch('/api/channels', {
      method: 'POST',
      body: JSON.stringify({ name, category_id, type: cat.type, welcome })
    });
    loadAppData();
    renderAdmin();
  } catch(err) {
    alert(err.message);
  }
};

window.addCourse = async function() {
  const title = document.getElementById('newCourseTitle').value.trim();
  const description = document.getElementById('newCourseDesc').value.trim();
  const duree = document.getElementById('newCourseDuree').value.trim();
  const video_url = document.getElementById('newCourseVideo').value.trim();
  if (!title) return;
  try {
    await apiFetch('/api/courses', {
      method: 'POST',
      body: JSON.stringify({ title, description, duree, video_url })
    });
    loadAppData();
    renderAdmin();
  } catch(err) {
    alert(err.message);
  }
};

window.saveAnnouncement = async function() {
  const text = document.getElementById('announcementText').value.trim();
  try {
    await apiFetch('/api/announcement', {
      method: 'POST',
      body: JSON.stringify({ text })
    });
    loadAppData();
  } catch(err) {
    alert(err.message);
  }
};

window.deleteAnnouncement = async function() {
  try {
    await apiFetch('/api/announcement', { method: 'DELETE' });
    loadAppData();
    renderAdmin();
  } catch(err) {
    alert(err.message);
  }
};

window.onload = () => {
  initAuth();
};
