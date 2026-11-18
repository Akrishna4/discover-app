import Database from 'better-sqlite3'
import path from 'path'
import fs from 'fs'

const DATA_DIR = path.join(process.cwd(), 'data')
const DB_PATH = path.join(DATA_DIR, 'coy.db')

if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true })
}

const db = new Database(DB_PATH)

db.pragma('journal_mode = WAL')
db.pragma('foreign_keys = ON')

db.exec(`
  CREATE TABLE IF NOT EXISTS profiles (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    age INTEGER NOT NULL,
    photo TEXT NOT NULL,
    bio TEXT NOT NULL,
    location TEXT NOT NULL,
    interests_json TEXT NOT NULL
  );

  CREATE TABLE IF NOT EXISTS swipes (
    from_user TEXT NOT NULL,
    to_user TEXT NOT NULL,
    action TEXT NOT NULL CHECK(action IN ('like', 'pass')),
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    PRIMARY KEY (from_user, to_user)
  );

  CREATE TABLE IF NOT EXISTS matches (
    user_a TEXT NOT NULL,
    user_b TEXT NOT NULL,
    created_at TEXT NOT NULL DEFAULT (datetime('now')),
    UNIQUE(user_a, user_b)
  );
`)

// Seed profiles
const seedProfiles = db.prepare(`
  INSERT OR IGNORE INTO profiles (id, name, age, photo, bio, location, interests_json)
  VALUES (?, ?, ?, ?, ?, ?, ?)
`)

const profiles: [string, string, number, string, string, string, string][] = [
  ['p01', 'Aarav Sharma', 22, 'https://picsum.photos/seed/p01/600/800', 'CS undergrad obsessed with distributed systems and midnight chai.', 'IIT Delhi', JSON.stringify(['distributed systems', 'chess', 'hindi rap', 'photography', 'cycling'])],
  ['p02', 'Priya Nair', 24, 'https://picsum.photos/seed/p02/600/800', 'Product designer at a fintech. Loves street food and Carnatic music.', 'Bengaluru', JSON.stringify(['UI/UX', 'Carnatic music', 'street food', 'pottery'])],
  ['p03', 'Rohan Mehta', 23, 'https://picsum.photos/seed/p03/600/800', 'MBA student trying to build the next big thing between case studies.', 'IIM Ahmedabad', JSON.stringify(['startups', 'cricket', 'trekking', 'biryani'])],
  ['p04', 'Ananya Iyer', 21, 'https://picsum.photos/seed/p04/600/800', 'Marine biology enthusiast, amateur chef and terrible dancer.', 'Chennai', JSON.stringify(['marine biology', 'cooking', 'dancing', 'classical literature'])],
  ['p05', 'Kabir Singh', 25, 'https://picsum.photos/seed/p05/600/800', 'Filmmaker and coffee addict. Currently writing a screenplay about robots.', 'Mumbai', JSON.stringify(['filmmaking', 'coffee', 'screenwriting', 'jazz', 'yoga'])],
  ['p06', 'Siya Gupta', 22, 'https://picsum.photos/seed/p06/600/800', 'Electronics nerd who solders circuits by day and writes poetry by night.', 'BITS Pilani', JSON.stringify(['electronics', 'poetry', 'astronomy', 'gaming'])],
  ['p07', 'Arjun Verma', 26, 'https://picsum.photos/seed/p07/600/800', 'Backend engineer, weekend rock climber, full-time foodie.', 'Hyderabad', JSON.stringify(['backend dev', 'rock climbing', 'food', 'travel'])],
  ['p08', 'Meera Pillai', 23, 'https://picsum.photos/seed/p08/600/800', 'Journalist who chases stories and sunsets in equal measure.', 'Pune', JSON.stringify(['journalism', 'photography', 'sunsets', 'swimming', 'books'])],
  ['p09', 'Dev Bose', 24, 'https://picsum.photos/seed/p09/600/800', 'Jazz pianist and machine learning researcher.', 'Kolkata', JSON.stringify(['jazz', 'machine learning', 'chess', 'football'])],
  ['p10', 'Tara Reddy', 22, 'https://picsum.photos/seed/p10/600/800', 'Data science undergrad with a soft spot for Tollywood and filter coffee.', 'NIT Warangal', JSON.stringify(['data science', 'Tollywood', 'filter coffee', 'badminton'])],
  ['p11', 'Ishaan Kapoor', 27, 'https://picsum.photos/seed/p11/600/800', 'Architect by training, startup person by accident. Loves brutalist buildings.', 'Delhi', JSON.stringify(['architecture', 'startups', 'brutalism', 'skateboarding'])],
  ['p12', 'Riya Joshi', 21, 'https://picsum.photos/seed/p12/600/800', 'Computer engineering student who bakes sourdough and watches F1.', 'VJTI Mumbai', JSON.stringify(['programming', 'sourdough baking', 'F1', 'gaming', 'cycling'])],
  ['p13', 'Nikhil Rao', 25, 'https://picsum.photos/seed/p13/600/800', 'SWE at a unicorn. Weekend long-distance runner and reluctant vegetarian.', 'Bengaluru', JSON.stringify(['running', 'cooking', 'music', 'open source'])],
  ['p14', 'Pooja Desai', 23, 'https://picsum.photos/seed/p14/600/800', 'Fashion designer inspired by traditional textile crafts. Big Bollywood fan.', 'Ahmedabad', JSON.stringify(['fashion design', 'textiles', 'Bollywood', 'travel', 'yoga'])],
  ['p15', 'Vikram Nambiar', 28, 'https://picsum.photos/seed/p15/600/800', 'Marine engineer turned product manager. Spends weekends scuba diving.', 'Kochi', JSON.stringify(['scuba diving', 'product management', 'kayaking', 'coffee'])],
  ['p16', 'Diya Chaturvedi', 22, 'https://picsum.photos/seed/p16/600/800', 'Physics PhD student who reads sci-fi and plays tabla.', 'IIT Bombay', JSON.stringify(['physics', 'sci-fi', 'tabla', 'climbing'])],
  ['p17', 'Aditya Pandey', 24, 'https://picsum.photos/seed/p17/600/800', 'Civil services aspirant with a passion for Urdu ghazals and street photography.', 'Lucknow', JSON.stringify(['Urdu ghazals', 'street photography', 'history', 'cricket'])],
  ['p18', 'Nisha Kulkarni', 23, 'https://picsum.photos/seed/p18/600/800', 'Viticulture student by day, amateur sommelier by night.', 'Nashik', JSON.stringify(['wine', 'viticulture', 'trekking', 'poetry', 'chess'])],
  ['p19', 'Samar Khan', 26, 'https://picsum.photos/seed/p19/600/800', 'Graphic novelist and heritage walks enthusiast.', 'Jaipur', JSON.stringify(['graphic novels', 'architecture', 'heritage walks', 'cycling'])],
  ['p20', 'Lavanya Subramanian', 21, 'https://picsum.photos/seed/p20/600/800', 'Competitive programmer with a not-so-secret love for Bharatanatyam.', 'BITS Hyderabad', JSON.stringify(['competitive programming', 'Bharatanatyam', 'anime', 'reading'])],
  ['p21', 'Rahul Tripathi', 25, 'https://picsum.photos/seed/p21/600/800', 'Classical musician and philosophy student.', 'Varanasi', JSON.stringify(['sitar', 'philosophy', 'Ganga ghats', 'meditation'])],
  ['p22', 'Kritika Malhotra', 24, 'https://picsum.photos/seed/p22/600/800', 'Environmental lawyer fighting climate change one PIL at a time.', 'Chandigarh', JSON.stringify(['environment', 'law', 'cycling', 'Punjabi folk music', 'trekking'])],
  ['p23', 'Farhan Mirza', 27, 'https://picsum.photos/seed/p23/600/800', 'Documentary filmmaker documenting vanishing crafts.', 'Mumbai', JSON.stringify(['documentary', 'crafts', 'chai', 'travel', 'Urdu poetry'])],
  ['p24', 'Shreya Agarwal', 22, 'https://picsum.photos/seed/p24/600/800', 'Robotics researcher who watches anime between lab sessions.', 'IIT Madras', JSON.stringify(['robotics', 'anime', 'swimming', 'cooking'])],
  ['p25', 'Karan Bhatt', 23, 'https://picsum.photos/seed/p25/600/800', 'Government data analyst moonlighting as a stand-up comedian.', 'Gandhinagar', JSON.stringify(['data analysis', 'stand-up comedy', 'cricket', 'reading'])],
  ['p26', 'Aditi Saxena', 24, 'https://picsum.photos/seed/p26/600/800', 'UX researcher obsessed with accessibility and masala chai.', 'Bhopal', JSON.stringify(['UX research', 'accessibility', 'masala chai', 'reading', 'gardening'])],
  ['p27', 'Zara Ahmed', 23, 'https://picsum.photos/seed/p27/600/800', 'Bioinformatics grad student and weekend calligrapher.', 'Hyderabad', JSON.stringify(['bioinformatics', 'calligraphy', 'hiking', 'books'])],
  ['p28', 'Surya Krishnaswamy', 26, 'https://picsum.photos/seed/p28/600/800', 'Textile engineer with a side hustle in handloom revival.', 'Coimbatore', JSON.stringify(['handloom', 'textile engineering', 'carnatic music', 'travel'])],
  ['p29', 'Mansi Rawat', 22, 'https://picsum.photos/seed/p29/600/800', 'Adventure sports junkie studying hotel management. Paraglides on weekends.', 'Dehradun', JSON.stringify(['paragliding', 'trekking', 'hospitality', 'photography'])],
  ['p30', 'Tejas Nair', 25, 'https://picsum.photos/seed/p30/600/800', 'Space tech startup founder who stargazes when not fundraising.', 'Thiruvananthapuram', JSON.stringify(['space tech', 'startups', 'stargazing', 'football', 'cooking'])],
  ['p31', 'Bhavna Choksi', 21, 'https://picsum.photos/seed/p31/600/800', 'Fine arts student who paints portraits and programs generative art.', 'Vadodara', JSON.stringify(['fine arts', 'generative art', 'poetry', 'gaming'])],
  ['p32', 'Ankur Dasgupta', 28, 'https://picsum.photos/seed/p32/600/800', 'Neuroscience researcher. Plays football, reads Tagore, brews his own beer.', 'Kolkata', JSON.stringify(['neuroscience', 'football', 'Tagore', 'home brewing'])],
]

const seedProfilesTx = db.transaction(() => {
  for (const p of profiles) {
    seedProfiles.run(...p)
  }
})
seedProfilesTx()

// Seed liked-me swipes (8-10 profiles as having ALREADY liked "me")
const seedSwipe = db.prepare(`
  INSERT OR IGNORE INTO swipes (from_user, to_user, action, created_at)
  VALUES (?, 'me', 'like', datetime('now'))
`)

export const likedMeIds = ['p01', 'p03', 'p05', 'p07', 'p09', 'p11', 'p13', 'p15', 'p17']

const seedSwipesTx = db.transaction(() => {
  for (const id of likedMeIds) {
    seedSwipe.run(id)
  }
})
seedSwipesTx()

export function resetDb(): void {
  db.exec(`DELETE FROM swipes; DELETE FROM matches;`)
  const resetSwipesTx = db.transaction(() => {
    for (const id of likedMeIds) {
      seedSwipe.run(id)
    }
  })
  resetSwipesTx()
}

export default db
