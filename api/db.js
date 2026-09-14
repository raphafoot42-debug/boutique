const { Pool } = require('pg');

let usePg = false;
let pool = null;

const connectionString = process.env.POSTGRES_URL || process.env.DATABASE_URL;

if (connectionString) {
  usePg = true;
  pool = new Pool({
    connectionString,
    ssl: process.env.NODE_ENV === 'production' || connectionString.includes('sslmode=require')
      ? { rejectUnauthorized: false }
      : false,
  });
}

const memoryDb = {
  users: [],
  categories: [],
  channels: [],
  messages: [],
  dms: [],
  courses: [],
  progress: [],
  badges: [],
  announcement: { id: "ann_1", text: "" },
  banned_words: [],
  modlog: []
};

const DEFAULT_CATEGORIES = [
  { id: "cat_general", name: "GÉNÉRAL", type: "groupe" },
  { id: "cat_entraide", name: "ENTRAIDE & STRATÉGIES", type: "groupe" },
  { id: "cat_annonces", name: "ANNONCES OFFICIELLES", type: "canal" },
  { id: "cat_ressources", name: "RESSOURCES & GUIDES", type: "canal" }
];

const DEFAULT_CHANNELS = [
  { id: "chan_general", name: "discussions-generales", category_id: "cat_general", type: "groupe", welcome: "Bienvenue dans le salon general !" },
  { id: "chan_presentation", name: "presentations", category_id: "cat_general", type: "groupe", welcome: "Presentez-vous au reste de la communaute." },
  { id: "chan_casino", name: "strategies-casino", category_id: "cat_entraide", type: "groupe", welcome: "Echangez vos meilleurs conseils et astuces d'affiliation." },
  { id: "chan_news", name: "nouveautes", category_id: "cat_annonces", type: "canal", welcome: "Suivez toutes les actualites et mises a jour Sparkidea." },
  { id: "chan_docs", name: "liens-utiles", category_id: "cat_ressources", type: "canal", welcome: "Retrouvez ici tous les liens et outils indispensables." }
];

const DEFAULT_COURSES = [
  {
    id: "course_1",
    title: "1. Deceler et valider les opportunites d'affiliation",
    description: "Comment repérer les programmes affiliation casino les plus rentables, analyser leurs conditions et s'assurer de leur fiabilite.",
    duree: "12 min",
    video_url: "https://www.youtube.com/embed/dQw4w9WgXcQ",
    links: JSON.stringify([{ label: "Checklist de validation", url: "#" }])
  },
  {
    id: "course_2",
    title: "2. Structurer son offre et son tunnel de conversion",
    description: "Guide etapes par etapes pour construire une landing page impactante et transformer vos visiteurs en joueurs actifs.",
    duree: "18 min",
    video_url: "",
    links: JSON.stringify([{ label: "Template HTML Landing", url: "#" }])
  }
];

const DEFAULT_BADGES = [
  { id: "badge_fondeur", label: "Fondateur", color: "#D4AF37" },
  { id: "badge_mod", label: "Moderateur", color: "#3ECF6E" },
  { id: "badge_pro", label: "Affilie Pro", color: "#4F46E5" }
];

async function initDb() {
  if (usePg) {
    const client = await pool.connect();
    try {
      await client.query(`
        CREATE TABLE IF NOT EXISTS users (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          email VARCHAR(255) UNIQUE NOT NULL,
          password_hash VARCHAR(255) NOT NULL,
          role VARCHAR(50) DEFAULT 'membre',
          badge_id VARCHAR(64),
          statut VARCHAR(50) DEFAULT 'online',
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS categories (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          type VARCHAR(50) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS channels (
          id VARCHAR(64) PRIMARY KEY,
          name VARCHAR(255) NOT NULL,
          category_id VARCHAR(64) REFERENCES categories(id) ON DELETE CASCADE,
          type VARCHAR(50) NOT NULL,
          welcome TEXT
        );

        CREATE TABLE IF NOT EXISTS messages (
          id VARCHAR(64) PRIMARY KEY,
          channel_id VARCHAR(64) REFERENCES channels(id) ON DELETE CASCADE,
          author_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          text TEXT,
          image_url TEXT,
          pinned BOOLEAN DEFAULT FALSE,
          reactions JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS dms (
          id VARCHAR(64) PRIMARY KEY,
          user_a_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          user_b_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          text TEXT,
          image_url TEXT,
          reactions JSONB DEFAULT '{}'::jsonb,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );

        CREATE TABLE IF NOT EXISTS courses (
          id VARCHAR(64) PRIMARY KEY,
          title VARCHAR(255) NOT NULL,
          description TEXT,
          duree VARCHAR(50),
          video_url TEXT,
          links JSONB DEFAULT '[]'::jsonb
        );

        CREATE TABLE IF NOT EXISTS progress (
          user_id VARCHAR(64) REFERENCES users(id) ON DELETE CASCADE,
          course_id VARCHAR(64) REFERENCES courses(id) ON DELETE CASCADE,
          done_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
          PRIMARY KEY (user_id, course_id)
        );

        CREATE TABLE IF NOT EXISTS badges (
          id VARCHAR(64) PRIMARY KEY,
          label VARCHAR(255) NOT NULL,
          color VARCHAR(50) NOT NULL
        );

        CREATE TABLE IF NOT EXISTS announcement (
          id VARCHAR(64) PRIMARY KEY,
          text TEXT NOT NULL
        );

        CREATE TABLE IF NOT EXISTS banned_words (
          word VARCHAR(255) PRIMARY KEY
        );

        CREATE TABLE IF NOT EXISTS modlog (
          id VARCHAR(64) PRIMARY KEY,
          action VARCHAR(255) NOT NULL,
          detail TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
        );
      `);

      const catCheck = await client.query('SELECT COUNT(*) FROM categories');
      if (parseInt(catCheck.rows[0].count) === 0) {
        for (const cat of DEFAULT_CATEGORIES) {
          await client.query('INSERT INTO categories (id, name, type) VALUES ($1, $2, $3)', [cat.id, cat.name, cat.type]);
        }
      }

      const chanCheck = await client.query('SELECT COUNT(*) FROM channels');
      if (parseInt(chanCheck.rows[0].count) === 0) {
        for (const chan of DEFAULT_CHANNELS) {
          await client.query('INSERT INTO channels (id, name, category_id, type, welcome) VALUES ($1, $2, $3, $4, $5)',
            [chan.id, chan.name, chan.category_id, chan.type, chan.welcome]);
        }
      }

      const courseCheck = await client.query('SELECT COUNT(*) FROM courses');
      if (parseInt(courseCheck.rows[0].count) === 0) {
        for (const course of DEFAULT_COURSES) {
          await client.query('INSERT INTO courses (id, title, description, duree, video_url, links) VALUES ($1, $2, $3, $4, $5, $6)',
            [course.id, course.title, course.description, course.duree, course.video_url, course.links]);
        }
      }

      const badgeCheck = await client.query('SELECT COUNT(*) FROM badges');
      if (parseInt(badgeCheck.rows[0].count) === 0) {
        for (const badge of DEFAULT_BADGES) {
          await client.query('INSERT INTO badges (id, label, color) VALUES ($1, $2, $3)', [badge.id, badge.label, badge.color]);
        }
      }

    } finally {
      client.release();
    }
  } else {
    if (memoryDb.categories.length === 0) memoryDb.categories = [...DEFAULT_CATEGORIES];
    if (memoryDb.channels.length === 0) memoryDb.channels = [...DEFAULT_CHANNELS];
    if (memoryDb.courses.length === 0) memoryDb.courses = [...DEFAULT_COURSES];
    if (memoryDb.badges.length === 0) memoryDb.badges = [...DEFAULT_BADGES];
  }
}

function generateId() {
  return Math.random().toString(36).substring(2, 10) + Date.now().toString(36);
}

module.exports = {
  usePg,
  pool,
  memoryDb,
  initDb,
  generateId
};
