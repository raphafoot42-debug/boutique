const express = require('express');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { pool, usePg, memoryDb, initDb, generateId } = require('./db.js');

const app = express();

const JWT_SECRET = process.env.JWT_SECRET || 'sparkidea_secret_jwt_key_2026';

app.use(cors({ origin: true, credentials: true }));
app.use(express.json({ limit: '10mb' }));
app.use(cookieParser());
app.use(express.static('.'));
app.use(express.static('dist'));
app.use(express.static('public'));

let dbInitialized = false;
app.use(async (req, res, next) => {
  if (!dbInitialized) {
    try {
      await initDb();
      dbInitialized = true;
    } catch (e) {
      console.error("DB init failed:", e);
    }
  }
  next();
});

function authenticateToken(req, res, next) {
  let token = req.cookies.sparkidea_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }

  if (!token) return res.status(401).json({ error: "Non authentifie" });

  jwt.verify(token, JWT_SECRET, (err, user) => {
    if (err) return res.status(403).json({ error: "Session invalide ou expiree" });
    req.user = user;
    next();
  });
}

function optionalAuth(req, res, next) {
  let token = req.cookies.sparkidea_token;
  if (!token && req.headers.authorization) {
    const parts = req.headers.authorization.split(' ');
    if (parts.length === 2 && parts[0] === 'Bearer') {
      token = parts[1];
    }
  }
  if (token) {
    jwt.verify(token, JWT_SECRET, (err, user) => {
      if (!err) req.user = user;
      next();
    });
  } else {
    next();
  }
}

function requireAdmin(req, res, next) {
  if (!req.user || req.user.role !== 'admin') {
    return res.status(403).json({ error: "Acces reserve aux administrateurs" });
  }
  next();
}

async function logModAction(action, detail) {
  const logItem = { id: generateId(), action, detail, created_at: new Date().toISOString() };
  if (usePg) {
    await pool.query('INSERT INTO modlog (id, action, detail, created_at) VALUES ($1, $2, $3, NOW())', [logItem.id, action, detail]);
  } else {
    memoryDb.modlog.unshift(logItem);
  }
}

// AUTH ROUTES
app.post('/api/auth/register', async (req, res) => {
  try {
    const { name, email, password } = req.body;
    if (!name || !email || !password) {
      return res.status(400).json({ error: "Nom, email et mot de passe requis." });
    }

    const cleanEmail = email.trim().toLowerCase();
    const cleanName = name.trim();

    let existingUser = null;
    let isFirstUser = false;

    if (usePg) {
      const userRes = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (userRes.rows.length > 0) existingUser = userRes.rows[0];
      const countRes = await pool.query('SELECT COUNT(*) FROM users');
      isFirstUser = parseInt(countRes.rows[0].count) === 0;
    } else {
      existingUser = memoryDb.users.find(u => u.email === cleanEmail);
      isFirstUser = memoryDb.users.length === 0;
    }

    if (existingUser) {
      return res.status(400).json({ error: "Cet email est deja utilise." });
    }

    const role = isFirstUser ? 'admin' : 'membre';
    const password_hash = await bcrypt.hash(password, 10);
    const userId = generateId();

    const newUser = {
      id: userId,
      name: cleanName,
      email: cleanEmail,
      password_hash,
      role,
      badge_id: isFirstUser ? 'badge_fondeur' : null,
      statut: 'online',
      created_at: new Date().toISOString()
    };

    if (usePg) {
      await pool.query(
        'INSERT INTO users (id, name, email, password_hash, role, badge_id, statut, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
        [newUser.id, newUser.name, newUser.email, newUser.password_hash, newUser.role, newUser.badge_id, newUser.statut]
      );
    } else {
      memoryDb.users.push(newUser);
    }

    await logModAction("Inscription", `${newUser.name} (${newUser.email}) - rôle ${newUser.role}`);

    const payload = { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('sparkidea_token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.json({ token, user: { id: newUser.id, name: newUser.name, email: newUser.email, role: newUser.role, badge_id: newUser.badge_id, statut: newUser.statut } });
  } catch (err) {
    console.error("Register error:", err);
    res.status(500).json({ error: "Erreur serveur lors de l'inscription." });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) {
      return res.status(400).json({ error: "Email et mot de passe requis." });
    }

    const cleanEmail = email.trim().toLowerCase();
    let user = null;

    if (usePg) {
      const resDb = await pool.query('SELECT * FROM users WHERE email = $1', [cleanEmail]);
      if (resDb.rows.length > 0) user = resDb.rows[0];
    } else {
      user = memoryDb.users.find(u => u.email === cleanEmail);
    }

    if (!user) {
      return res.status(400).json({ error: "Identifiants incorrects." });
    }

    const validPwd = await bcrypt.compare(password, user.password_hash);
    if (!validPwd) {
      return res.status(400).json({ error: "Identifiants incorrects." });
    }

    if (usePg) {
      await pool.query("UPDATE users SET statut = 'online' WHERE id = $1", [user.id]);
    } else {
      user.statut = 'online';
    }

    const payload = { id: user.id, name: user.name, email: user.email, role: user.role };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '7d' });

    res.cookie('sparkidea_token', token, { httpOnly: true, maxAge: 7 * 24 * 3600 * 1000 });
    return res.json({ token, user: { id: user.id, name: user.name, email: user.email, role: user.role, badge_id: user.badge_id, statut: 'online' } });
  } catch (err) {
    console.error("Login error:", err);
    res.status(500).json({ error: "Erreur serveur lors de la connexion." });
  }
});

app.get('/api/auth/me', authenticateToken, async (req, res) => {
  try {
    let user = null;
    if (usePg) {
      const dbRes = await pool.query('SELECT id, name, email, role, badge_id, statut, created_at FROM users WHERE id = $1', [req.user.id]);
      if (dbRes.rows.length > 0) user = dbRes.rows[0];
    } else {
      const found = memoryDb.users.find(u => u.id === req.user.id);
      if (found) {
        user = { id: found.id, name: found.name, email: found.email, role: found.role, badge_id: found.badge_id, statut: found.statut, created_at: found.created_at };
      }
    }

    if (!user) return res.status(404).json({ error: "Utilisateur non trouve" });
    res.json({ user });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la recuperation du profil." });
  }
});

app.post('/api/auth/logout', authenticateToken, async (req, res) => {
  try {
    if (usePg) {
      await pool.query("UPDATE users SET statut = 'offline' WHERE id = $1", [req.user.id]);
    } else {
      const u = memoryDb.users.find(x => x.id === req.user.id);
      if (u) u.statut = 'offline';
    }
  } catch(e) {}

  res.clearCookie('sparkidea_token');
  res.json({ message: "Deconnecte avec succes." });
});

// USERS API
app.get('/api/users', authenticateToken, async (req, res) => {
  try {
    let users = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT id, name, email, role, badge_id, statut, created_at FROM users ORDER BY name ASC');
      users = dbRes.rows;
    } else {
      users = memoryDb.users.map(u => ({ id: u.id, name: u.name, email: u.email, role: u.role, badge_id: u.badge_id, statut: u.statut, created_at: u.created_at }));
    }
    res.json(users);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des utilisateurs." });
  }
});

app.patch('/api/users/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { role, statut, badge_id } = req.body;
    const targetId = req.params.id;

    if (usePg) {
      if (role !== undefined) await pool.query('UPDATE users SET role = $1 WHERE id = $2', [role, targetId]);
      if (statut !== undefined) await pool.query('UPDATE users SET statut = $1 WHERE id = $2', [statut, targetId]);
      if (badge_id !== undefined) await pool.query('UPDATE users SET badge_id = $1 WHERE id = $2', [badge_id, targetId]);
    } else {
      const u = memoryDb.users.find(x => x.id === targetId);
      if (u) {
        if (role !== undefined) u.role = role;
        if (statut !== undefined) u.statut = statut;
        if (badge_id !== undefined) u.badge_id = badge_id;
      }
    }

    await logModAction("Modification membre", `ID ${targetId} mis a jour.`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur lors de la mise a jour de l'utilisateur." });
  }
});

// CATEGORIES & CHANNELS API
app.get('/api/categories', authenticateToken, async (req, res) => {
  try {
    let categories = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT * FROM categories');
      categories = dbRes.rows;
    } else {
      categories = memoryDb.categories;
    }
    res.json(categories);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement categories" });
  }
});

app.post('/api/categories', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, type } = req.body;
    if (!name || !type) return res.status(400).json({ error: "Nom et type requis" });

    const newCat = { id: generateId(), name, type };

    if (usePg) {
      await pool.query('INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)', [newCat.id, newCat.name, newCat.type]);
    } else {
      memoryDb.categories.push(newCat);
    }

    await logModAction("Categorie creee", name);
    res.json(newCat);
  } catch (err) {
    res.status(500).json({ error: "Erreur creation categorie" });
  }
});

app.delete('/api/categories/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const catId = req.params.id;
    if (usePg) {
      await pool.query('DELETE FROM categories WHERE id = $1', [catId]);
    } else {
      memoryDb.categories = memoryDb.categories.filter(c => c.id !== catId);
      memoryDb.channels = memoryDb.channels.filter(c => c.category_id !== catId);
    }
    await logModAction("Categorie supprimee", catId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression categorie" });
  }
});

app.get('/api/channels', authenticateToken, async (req, res) => {
  try {
    let channels = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT * FROM channels');
      channels = dbRes.rows;
    } else {
      channels = memoryDb.channels;
    }
    res.json(channels);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement salons" });
  }
});

app.post('/api/channels', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { name, category_id, type, welcome } = req.body;
    if (!name || !category_id || !type) return res.status(400).json({ error: "Informations manquantes" });

    const cleanName = name.toLowerCase().replace(/\s+/g, "-");
    const newChan = { id: generateId(), name: cleanName, category_id, type, welcome: welcome || "" };

    if (usePg) {
      await pool.query('INSERT INTO channels (id, name, category_id, type, welcome) VALUES ($1, $2, $3, $4, $5)',
        [newChan.id, newChan.name, newChan.category_id, newChan.type, newChan.welcome]);
    } else {
      memoryDb.channels.push(newChan);
    }

    await logModAction("Salon cree", `#${cleanName}`);
    res.json(newChan);
  } catch (err) {
    res.status(500).json({ error: "Erreur creation salon" });
  }
});

app.delete('/api/channels/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const chanId = req.params.id;
    if (usePg) {
      await pool.query('DELETE FROM channels WHERE id = $1', [chanId]);
    } else {
      memoryDb.channels = memoryDb.channels.filter(c => c.id !== chanId);
      memoryDb.messages = memoryDb.messages.filter(m => m.channel_id !== chanId);
    }
    await logModAction("Salon supprime", chanId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression salon" });
  }
});

// MESSAGES & DMS API
app.get('/api/messages/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    let messages = [];

    if (usePg) {
      const dbRes = await pool.query(`
        SELECT m.*, u.name as author, u.role as author_role, u.badge_id as author_badge
        FROM messages m
        JOIN users u ON m.author_id = u.id
        WHERE m.channel_id = $1
        ORDER BY m.created_at ASC
      `, [channelId]);
      messages = dbRes.rows;
    } else {
      messages = memoryDb.messages.filter(m => m.channel_id === channelId).map(m => {
        const u = memoryDb.users.find(x => x.id === m.author_id) || { name: 'Utilisateur', role: 'membre', badge_id: null };
        return {
          ...m,
          author: u.name,
          author_role: u.role,
          author_badge: u.badge_id
        };
      });
    }

    res.json(messages);
  } catch (err) {
    res.status(500).json({ error: "Erreur lors du chargement des messages." });
  }
});

app.post('/api/messages/:channelId', authenticateToken, async (req, res) => {
  try {
    const { channelId } = req.params;
    const { text, image_url } = req.body;

    if (!text && !image_url) {
      return res.status(400).json({ error: "Message vide." });
    }

    let bannedWords = [];
    if (usePg) {
      const bwRes = await pool.query('SELECT word FROM banned_words');
      bannedWords = bwRes.rows.map(r => r.word);
    } else {
      bannedWords = memoryDb.banned_words;
    }

    if (text) {
      const lower = text.toLowerCase();
      const found = bannedWords.find(w => w && lower.includes(w.toLowerCase()));
      if (found) {
        return res.status(400).json({ error: `Contenu interdit detecte (mot : "${found}").` });
      }
    }

    const newMsg = {
      id: generateId(),
      channel_id: channelId,
      author_id: req.user.id,
      text: text || "",
      image_url: image_url || "",
      pinned: false,
      reactions: {},
      created_at: new Date().toISOString()
    };

    if (usePg) {
      await pool.query(
        'INSERT INTO messages (id, channel_id, author_id, text, image_url, pinned, reactions, created_at) VALUES ($1, $2, $3, $4, $5, $6, $7, NOW())',
        [newMsg.id, newMsg.channel_id, newMsg.author_id, newMsg.text, newMsg.image_url, false, JSON.stringify({})]
      );
    } else {
      memoryDb.messages.push(newMsg);
    }

    res.json({
      ...newMsg,
      author: req.user.name,
      author_role: req.user.role
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur envoi message." });
  }
});

app.delete('/api/messages/:id', authenticateToken, async (req, res) => {
  try {
    const msgId = req.params.id;
    let msg = null;

    if (usePg) {
      const dbRes = await pool.query('SELECT * FROM messages WHERE id = $1', [msgId]);
      if (dbRes.rows.length > 0) msg = dbRes.rows[0];
    } else {
      msg = memoryDb.messages.find(m => m.id === msgId);
    }

    if (!msg) return res.status(404).json({ error: "Message introuvable." });
    if (msg.author_id !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: "Non autorise a supprimer ce message." });
    }

    if (usePg) {
      await pool.query('DELETE FROM messages WHERE id = $1', [msgId]);
    } else {
      memoryDb.messages = memoryDb.messages.filter(m => m.id !== msgId);
    }

    await logModAction("Message supprime", `ID ${msgId}`);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression message." });
  }
});

app.get('/api/dms/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;
    let dms = [];

    if (usePg) {
      const dbRes = await pool.query(`
        SELECT d.*, ua.name as author_name, ua.role as author_role
        FROM dms d
        JOIN users ua ON d.user_a_id = ua.id
        WHERE (d.user_a_id = $1 AND d.user_b_id = $2)
           OR (d.user_a_id = $2 AND d.user_b_id = $1)
        ORDER BY d.created_at ASC
      `, [currentUserId, targetUserId]);
      dms = dbRes.rows;
    } else {
      dms = memoryDb.dms.filter(d =>
        (d.user_a_id === currentUserId && d.user_b_id === targetUserId) ||
        (d.user_a_id === targetUserId && d.user_b_id === currentUserId)
      ).map(d => {
        const ua = memoryDb.users.find(u => u.id === d.user_a_id) || { name: 'Utilisateur', role: 'membre' };
        return {
          ...d,
          author_name: ua.name,
          author_role: ua.role
        };
      });
    }

    res.json(dms);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement messages prives." });
  }
});

app.post('/api/dms/:userId', authenticateToken, async (req, res) => {
  try {
    const targetUserId = req.params.userId;
    const currentUserId = req.user.id;
    const { text, image_url } = req.body;

    if (!text && !image_url) return res.status(400).json({ error: "Message vide." });

    const newDm = {
      id: generateId(),
      user_a_id: currentUserId,
      user_b_id: targetUserId,
      text: text || "",
      image_url: image_url || "",
      reactions: {},
      created_at: new Date().toISOString()
    };

    if (usePg) {
      await pool.query(
        'INSERT INTO dms (id, user_a_id, user_b_id, text, image_url, reactions, created_at) VALUES ($1, $2, $3, $4, $5, $6, NOW())',
        [newDm.id, newDm.user_a_id, newDm.user_b_id, newDm.text, newDm.image_url, JSON.stringify({})]
      );
    } else {
      memoryDb.dms.push(newDm);
    }

    res.json({
      ...newDm,
      author_name: req.user.name,
      author_role: req.user.role
    });
  } catch (err) {
    res.status(500).json({ error: "Erreur envoi message prive." });
  }
});

// COURSES & PROGRESS API
app.get('/api/courses', authenticateToken, async (req, res) => {
  try {
    let courses = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT * FROM courses ORDER BY id ASC');
      courses = dbRes.rows.map(c => ({
        ...c,
        links: typeof c.links === 'string' ? JSON.parse(c.links) : (c.links || [])
      }));
    } else {
      courses = memoryDb.courses.map(c => ({
        ...c,
        links: typeof c.links === 'string' ? JSON.parse(c.links) : (c.links || [])
      }));
    }
    res.json(courses);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement formations." });
  }
});

app.post('/api/courses', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { title, description, duree, video_url, links } = req.body;
    if (!title) return res.status(400).json({ error: "Titre de formation requis." });

    const newCourse = {
      id: generateId(),
      title,
      description: description || "",
      duree: duree || "10 min",
      video_url: video_url || "",
      links: Array.isArray(links) ? links : []
    };

    if (usePg) {
      await pool.query(
        'INSERT INTO courses (id, title, description, duree, video_url, links) VALUES ($1, $2, $3, $4, $5, $6)',
        [newCourse.id, newCourse.title, newCourse.description, newCourse.duree, newCourse.video_url, JSON.stringify(newCourse.links)]
      );
    } else {
      memoryDb.courses.push(newCourse);
    }

    await logModAction("Formation ajoutee", title);
    res.json(newCourse);
  } catch (err) {
    res.status(500).json({ error: "Erreur creation formation." });
  }
});

app.delete('/api/courses/:id', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const courseId = req.params.id;
    if (usePg) {
      await pool.query('DELETE FROM courses WHERE id = $1', [courseId]);
    } else {
      memoryDb.courses = memoryDb.courses.filter(c => c.id !== courseId);
      memoryDb.progress = memoryDb.progress.filter(p => p.course_id !== courseId);
    }
    await logModAction("Formation supprimee", courseId);
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression formation." });
  }
});

app.get('/api/progress', authenticateToken, async (req, res) => {
  try {
    let completedIds = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT course_id FROM progress WHERE user_id = $1', [req.user.id]);
      completedIds = dbRes.rows.map(r => r.course_id);
    } else {
      completedIds = memoryDb.progress.filter(p => p.user_id === req.user.id).map(p => p.course_id);
    }
    res.json(completedIds);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement progression." });
  }
});

app.post('/api/progress', authenticateToken, async (req, res) => {
  try {
    const { course_id } = req.body;
    if (!course_id) return res.status(400).json({ error: "ID formation requis" });

    let isDone = false;
    if (usePg) {
      const checkRes = await pool.query('SELECT * FROM progress WHERE user_id = $1 AND course_id = $2', [req.user.id, course_id]);
      if (checkRes.rows.length > 0) {
        await pool.query('DELETE FROM progress WHERE user_id = $1 AND course_id = $2', [req.user.id, course_id]);
        isDone = false;
      } else {
        await pool.query('INSERT INTO progress (user_id, course_id, done_at) VALUES ($1, $2, NOW())', [req.user.id, course_id]);
        isDone = true;
      }
    } else {
      const idx = memoryDb.progress.findIndex(p => p.user_id === req.user.id && p.course_id === course_id);
      if (idx >= 0) {
        memoryDb.progress.splice(idx, 1);
        isDone = false;
      } else {
        memoryDb.progress.push({ user_id: req.user.id, course_id, done_at: new Date().toISOString() });
        isDone = true;
      }
    }

    res.json({ course_id, done: isDone });
  } catch (err) {
    res.status(500).json({ error: "Erreur bascule progression." });
  }
});

// ANNOUNCEMENT & BADGES
app.get('/api/announcement', optionalAuth, async (req, res) => {
  try {
    let announcement = { text: "" };
    if (usePg) {
      const dbRes = await pool.query('SELECT text FROM announcement LIMIT 1');
      if (dbRes.rows.length > 0) announcement = dbRes.rows[0];
    } else {
      announcement = memoryDb.announcement;
    }
    res.json(announcement);
  } catch (err) {
    res.status(500).json({ error: "Erreur chargement annonce." });
  }
});

app.post('/api/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    const { text } = req.body;
    if (usePg) {
      await pool.query('DELETE FROM announcement');
      if (text) await pool.query('INSERT INTO announcement (id, text) VALUES ($1, $2)', [generateId(), text]);
    } else {
      memoryDb.announcement = { id: generateId(), text: text || "" };
    }
    await logModAction("Annonce mise a jour", text || "(supprimee)");
    res.json({ text });
  } catch (err) {
    res.status(500).json({ error: "Erreur annonce." });
  }
});

app.delete('/api/announcement', authenticateToken, requireAdmin, async (req, res) => {
  try {
    if (usePg) {
      await pool.query('DELETE FROM announcement');
    } else {
      memoryDb.announcement = { id: "", text: "" };
    }
    await logModAction("Annonce supprimee", "");
    res.json({ success: true });
  } catch (err) {
    res.status(500).json({ error: "Erreur suppression annonce." });
  }
});

app.get('/api/badges', authenticateToken, async (req, res) => {
  try {
    let badges = [];
    if (usePg) {
      const dbRes = await pool.query('SELECT * FROM badges');
      badges = dbRes.rows;
    } else {
      badges = memoryDb.badges;
    }
    res.json(badges);
  } catch (err) {
    res.status(500).json({ error: "Erreur badges" });
  }
});

app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: "Erreur interne du serveur." });
});

module.exports = app;

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server Sparkidea API running on http://localhost:${PORT}`);
  });
}
