import os
import json
import sqlite3
import random
from datetime import datetime
from flask import Flask, render_template, request, redirect, url_for, session, flash, jsonify
from werkzeug.security import generate_password_hash, check_password_hash

app = Flask(__name__)
app.secret_key = 'oceanquest_secret_key_sih_2026'

DATABASE = 'oceanquest.db'

def get_db():
    db = sqlite3.connect(DATABASE)
    db.row_factory = sqlite3.Row
    return db

def init_db():
    """Initializes the database tables and inserts mock and seed data if empty."""
    with get_db() as conn:
        cursor = conn.cursor()
        
        # 1. USERS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS users (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                username TEXT UNIQUE NOT NULL,
                email TEXT UNIQUE NOT NULL,
                password_hash TEXT NOT NULL,
                selected_role TEXT,
                level INTEGER DEFAULT 1,
                xp INTEGER DEFAULT 0,
                points INTEGER DEFAULT 0,
                streak INTEGER DEFAULT 0,
                ocean_iq INTEGER DEFAULT 0,
                is_guest INTEGER DEFAULT 0,
                is_admin INTEGER DEFAULT 0,
                created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            )
        ''')
        
        # 2. MISSIONS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS missions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                title TEXT NOT NULL,
                description TEXT NOT NULL,
                role TEXT NOT NULL,
                difficulty TEXT NOT NULL,
                ocean_conditions TEXT NOT NULL, -- Stored as JSON
                option_a TEXT NOT NULL,
                option_b TEXT NOT NULL,
                option_c TEXT,
                option_d TEXT,
                correct_answer TEXT NOT NULL,
                explanation TEXT NOT NULL,
                xp_reward INTEGER DEFAULT 50,
                points_reward INTEGER DEFAULT 100
            )
        ''')
        
        # 3. GAME SESSIONS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS game_sessions (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                mission_id INTEGER NOT NULL,
                selected_answer TEXT NOT NULL,
                is_correct INTEGER NOT NULL,
                xp_earned INTEGER DEFAULT 0,
                points_earned INTEGER DEFAULT 0,
                completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (mission_id) REFERENCES missions (id)
            )
        ''')
        
        # 4. STAMPS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS stamps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                icon TEXT NOT NULL,
                unlock_requirement TEXT NOT NULL
            )
        ''')
        
        # 5. USER STAMPS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_stamps (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                stamp_id INTEGER NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (stamp_id) REFERENCES stamps (id),
                UNIQUE(user_id, stamp_id)
            )
        ''')
        
        # 6. ACHIEVEMENTS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                description TEXT NOT NULL,
                requirement TEXT NOT NULL
            )
        ''')
        
        # 7. USER ACHIEVEMENTS Table
        cursor.execute('''
            CREATE TABLE IF NOT EXISTS user_achievements (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                user_id INTEGER NOT NULL,
                achievement_id INTEGER NOT NULL,
                unlocked_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
                FOREIGN KEY (user_id) REFERENCES users (id),
                FOREIGN KEY (achievement_id) REFERENCES achievements (id),
                UNIQUE(user_id, achievement_id)
            )
        ''')
        
        conn.commit()

        # Seed initial data if empty
        seed_data(conn)

def seed_data(conn):
    cursor = conn.cursor()
    
    # Check if we already seeded users
    cursor.execute("SELECT count(*) FROM users")
    if cursor.fetchone()[0] == 0:
        # Create Admin
        admin_pass = generate_password_hash("admin123")
        cursor.execute("INSERT INTO users (name, username, email, password_hash, is_admin) VALUES (?, ?, ?, ?, 1)",
                       ("System Administrator", "admin", "admin@oceanquest.org", admin_pass))
        
        # Create Competitor Users for Leaderboard
        mock_users = [
            ("OceanKing", "oceanking", "king@sea.com", 8420, 10, 9500, "captain", 12),
            ("SeaMaster", "seamaster", "sea@fish.com", 7980, 9, 8200, "fisherman", 9),
            ("WaveRider", "waverider", "wave@beach.com", 7450, 8, 7100, "tourism", 6),
            ("EcoGuardian", "ecoguardian", "eco@explore.com", 6200, 6, 5100, "explorer", 5),
            ("AquaScout", "aquascout", "scout@bay.com", 3400, 4, 3200, "fisherman", 3),
            ("SailorSam", "sailorsam", "sam@cargo.com", 1500, 2, 1200, "captain", 1)
        ]
        dummy_pass = generate_password_hash("password123")
        for name, username, email, points, level, xp, role, streak in mock_users:
            cursor.execute('''
                INSERT INTO users (name, username, email, password_hash, points, level, xp, selected_role, streak, ocean_iq) 
                VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 80)
            ''', (name, username, email, dummy_pass, points, level, xp, role, streak))
            
    # Seed Missions
    cursor.execute("SELECT count(*) FROM missions")
    if cursor.fetchone()[0] == 0:
        missions = [
            (
                "Find the Fish",
                "Identify the optimal fishing sector based on local sea state variables.",
                "fisherman",
                "easy",
                json.dumps({
                    "wave_height": 1.2,
                    "wave_direction": "SSW",
                    "wind_speed": 14,
                    "wind_direction": "SW",
                    "sst": 28.3,
                    "fish_zone": "HIGH",
                    "alert": "NONE"
                }),
                "Navigate directly to the high potential zone and drop nets.",
                "Wait and monitor meteorological conditions further.",
                "Sail deeper offshore away from potential zone.",
                "Call shore support for assistance.",
                "A",
                "With wave heights at 1.2m and wind speeds at 14 km/h, conditions are calm and safe. The High fish potential zone represents high phytoplankton content, ideal for fishing.",
                50, 100
            ),
            (
                "Rising Waves Warning",
                "You are navigating a dry cargo carrier off the coast of Maharashtra. Swell wave heights are intensifying.",
                "captain",
                "medium",
                json.dumps({
                    "wave_height": 3.4,
                    "wave_direction": "WNW",
                    "wind_speed": 35,
                    "wind_direction": "NW",
                    "sst": 27.5,
                    "fish_zone": "LOW",
                    "alert": "HIGH WAVE WARNING"
                }),
                "Maintain full speed ahead to cross the sector quickly.",
                "Slow down, adjust headings to take swells at an angle, or seek shelter.",
                "Turn the vessel parallel to the wave crests to maintain track.",
                "Drop main anchors immediately in deep water.",
                "B",
                "High wave warnings suggest waves above 3m. Slowing down reduces structural impact, and taking waves at a 30-45 degree angle prevents pitching/capsizing.",
                75, 150
            ),
            (
                "Storm Approaching",
                "A deep depression has formed in the Bay of Bengal. Your cruise ship and shore tourism zones are in its path.",
                "tourism",
                "hard",
                json.dumps({
                    "wave_height": 4.5,
                    "wave_direction": "E",
                    "wind_speed": 55,
                    "wind_direction": "ENE",
                    "sst": 26.8,
                    "fish_zone": "LOW",
                    "alert": "CYCLONE WARNING"
                }),
                "Suspend all marine tourism operations and evacuate beachgoers.",
                "Continue operations but advise swimmers to stay near shore.",
                "Take tourists out to deep water to experience the storm swell.",
                "Ignore the warning until visual conditions deteriorate.",
                "A",
                "Cyclone warnings indicate storm surge heights and extreme winds. Suspending operations and evacuating low beaches is the only safe procedure to protect lives.",
                75, 150
            ),
            (
                "Tsunami Alert",
                "A magnitude 7.8 undersea earthquake occurs off the Sunda Trench. A tsunami watch has been declared for coastal zones.",
                "explorer",
                "hard",
                json.dumps({
                    "wave_height": 1.5,
                    "wave_direction": "S",
                    "wind_speed": 10,
                    "wind_direction": "S",
                    "sst": 28.0,
                    "fish_zone": "LOW",
                    "alert": "TSUNAMI ALERT"
                }),
                "Instruct all vessels to return to docks and anchor.",
                "Evacuate coastal populations inland to high ground immediately.",
                "Stand on the beach to monitor wave behaviors.",
                "Sail small boats into harbors.",
                "B",
                "Tsunamis are highly dangerous in shallow coastal waters due to breaking energy. Move people to high ground inland. Ships in deep water should stay at sea, not return to docks.",
                75, 150
            ),
            (
                "Safe Tourism Surge",
                "High astronomical tides are coinciding with wind swells, causing sudden beach flooding.",
                "tourism",
                "medium",
                json.dumps({
                    "wave_height": 2.5,
                    "wave_direction": "WSW",
                    "wind_speed": 28,
                    "wind_direction": "WSW",
                    "sst": 28.5,
                    "fish_zone": "LOW",
                    "alert": "HIGH TIDE FLOODING"
                }),
                "Continue catamaran excursions with life jackets.",
                "Restrict beach access, set up red flags, and halt coastal watersports.",
                "Reduce prices to attract more visitors to the tide lines.",
                "Organize shoreline walking tours.",
                "B",
                "High surge flooding makes waves break directly onto beaches, causing strong undertows and sweeps. Setting up red caution flags is key to prevent tourist drownings.",
                50, 100
            ),
            (
                "Protect Marine Life",
                "You are navigating near a marine biosphere reserve in Lakshadweep. Heavy coral systems reside below.",
                "explorer",
                "easy",
                json.dumps({
                    "wave_height": 0.8,
                    "wave_direction": "SSW",
                    "wind_speed": 10,
                    "wind_direction": "S",
                    "sst": 29.4,
                    "fish_zone": "LOW",
                    "alert": "NONE"
                }),
                "Drop heavy steel anchor directly near the coral bed.",
                "Avoid anchoring on live reef, use designated mooring buoys or sand anchors.",
                "Collect coral fragments to study inside dry lab cabinets.",
                "Discharge vessel graywater to lighten weight.",
                "B",
                "Corals are fragile biological structures that take decades to grow. Anchor drag crushes reefs. Using eco-mooring buoys prevents direct habitat destruction.",
                50, 100
            ),
            (
                "Navigation Challenge",
                "Entering a narrow coastal harbor. High waves and cross-currents are reported at the estuary mouth.",
                "captain",
                "hard",
                json.dumps({
                    "wave_height": 2.8,
                    "wave_direction": "W",
                    "wind_speed": 38,
                    "wind_direction": "WSW",
                    "sst": 28.1,
                    "fish_zone": "LOW",
                    "alert": "ROUGH CHANNEL CROSSING"
                }),
                "Align with range lights, slow to maneuverable speed, and maintain draft control.",
                "Full throttle ahead to bypass cross-currents instantly.",
                "Drop anchor right inside the entry channel to assess.",
                "Request commercial flights for helicopter lift.",
                "A",
                "Aligning with harbor range guides is critical. Slowing down maintains control while preventing grounding in shallow channel margins due to high swells.",
                75, 150
            ),
            (
                "Emergency Decision",
                "A sudden squall has formed offshore with severe wind gusts and visibility drops.",
                "fisherman",
                "medium",
                json.dumps({
                    "wave_height": 2.9,
                    "wave_direction": "SW",
                    "wind_speed": 48,
                    "wind_direction": "SSW",
                    "sst": 28.0,
                    "fish_zone": "HIGH",
                    "alert": "SQUALL WARNING"
                }),
                "Return to nearest harbor or seek shelter under island lee immediately.",
                "Keep fishing nets deployed to maximize catch.",
                "Anchor in open water and turn off navigation lights.",
                "Ignore alert and sail further offshore.",
                "A",
                "Squalls create high risk of capsizing and collisions due to poor visibility. Immediate return to harbor or sheltering behind islands is standard safety protocol.",
                50, 100
            )
        ]
        
        cursor.executemany('''
            INSERT INTO missions (title, description, role, difficulty, ocean_conditions, option_a, option_b, option_c, option_d, correct_answer, explanation, xp_reward, points_reward)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', missions)

    # Seed Stamps
    cursor.execute("SELECT count(*) FROM stamps")
    if cursor.fetchone()[0] == 0:
        stamps = [
            ("Fishing Master", "Complete both fisherman missions successfully.", "fa-fish", "fisherman_complete"),
            ("Tsunami Ready", "Provide the correct evacuation answer during a tsunami alert.", "fa-house-chimney-crack", "tsunami_ready"),
            ("Ocean Protector", "Opt for sustainable eco-actions in coral or marine life missions.", "fa-shield-halved", "coral_shield"),
            ("Weather Wise", "Correctly respond to a cyclone or storm surge warning.", "fa-cloud-bolt", "weather_wise"),
            ("Safe Navigator", "Navigate through rough channels or high waves as captain.", "fa-compass", "captain_nav"),
            ("Deep Explorer", "Complete all scientific oceanography challenges.", "fa-magnifying-glass-chart", "explorer_complete")
        ]
        cursor.executemany('''
            INSERT INTO stamps (name, description, icon, unlock_requirement)
            VALUES (?, ?, ?, ?)
        ''', stamps)

    # Seed Achievements
    cursor.execute("SELECT count(*) FROM achievements")
    if cursor.fetchone()[0] == 0:
        achievements = [
            ("First Voyage", "Select your initial role to begin training.", "selected_role"),
            ("Wave Master", "A score of 80% or above on a medium or hard knowledge quiz.", "quiz_master"),
            ("Smart Fisher", "Correct decision during a fishing advisory task.", "correct_fish"),
            ("Navigation Expert", "Correct decision navigating swells or harbors.", "correct_nav"),
            ("Storm Survivor", "Make the correct safety choice during a Cyclone Warning.", "storm_survival"),
            ("Emergency Responder", "Safely evacuate coastal zones during a tsunami threat.", "tsunami_escape"),
            ("Ocean Protector", "Successfully complete an environmental conservation task.", "eco_shield"),
            ("Ocean Guardian", "Collect 5 or more stamps in your Ocean Passport.", "unlocked_5_stamps")
        ]
        cursor.executemany('''
            INSERT INTO achievements (name, description, requirement)
            VALUES (?, ?, ?)
        ''', achievements)
        
    conn.commit()

# Helper levels mapping
def get_level_info(xp):
    # XP thresholds
    # Level 1: 0-499, Level 2: 500-999, etc.
    level = 1
    xp_for_level = 500
    
    while xp >= xp_for_level:
        xp -= xp_for_level
        level += 1
        xp_for_level = 500 + (level - 1) * 100 # scaling XP requirement
        
    xp_needed = xp_for_level
    xp_current = xp
    xp_pct = int((xp_current / xp_needed) * 100)
    
    # Get Level Title Name
    if level <= 2:
        level_name = "Ocean Rookie"
    elif level == 3:
        level_name = "Wave Watcher"
    elif level == 4:
        level_name = "Sea Navigator"
    elif level == 5:
        level_name = "Ocean Scout"
    elif level < 10:
        level_name = "Ocean Guardian"
    else:
        level_name = "Ocean Master"
        
    return level, xp_current, xp_needed, xp_pct, level_name

def check_achievements_and_stamps(user_id):
    """Verifies conditions for unlocking achievements/stamps and performs DB inserts."""
    unlocked_stamps = []
    unlocked_achievements = []
    level_up_occurred = False
    
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Fetch user
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        if not user:
            return unlocked_stamps, unlocked_achievements, level_up_occurred
            
        user_role = user['selected_role']
        
        # Fetch user session logs
        cursor.execute("SELECT * FROM game_sessions WHERE user_id = ?", (user_id,))
        sessions = cursor.fetchall()
        
        completed_mids = [s['mission_id'] for s in sessions if s['is_correct'] == 1]
        
        # STAMP 1: Fishing Master (Fisherman completed missions 1 and 8 successfully)
        if 1 in completed_mids and 8 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'fisherman_complete'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Fishing Master")
                
        # STAMP 2: Tsunami Ready (Correct on mission 4)
        if 4 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'tsunami_ready'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Tsunami Ready")
                
        # STAMP 3: Ocean Protector (Correct on mission 6)
        if 6 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'coral_shield'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Ocean Protector")
                
        # STAMP 4: Weather Wise (Correct on mission 3 or 5)
        if 3 in completed_mids or 5 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'weather_wise'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Weather Wise")
                
        # STAMP 5: Safe Navigator (Correct on mission 2 or 7)
        if 2 in completed_mids or 7 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'captain_nav'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Safe Navigator")
                
        # STAMP 6: Deep Explorer (Explorer correct on 4 and 6)
        if 4 in completed_mids and 6 in completed_mids:
            cursor.execute("SELECT id FROM stamps WHERE unlock_requirement = 'explorer_complete'")
            s_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_stamps (user_id, stamp_id) VALUES (?, ?)", (user_id, s_id))
            if conn.total_changes > 0:
                unlocked_stamps.append("Deep Explorer")
                
        # ACHIEVEMENTS
        
        # 1. First Voyage (Role Selected)
        if user_role:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'selected_role'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("First Voyage")
                
        # 3. Smart Fisher (Correct on 1 or 8)
        if 1 in completed_mids or 8 in completed_mids:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'correct_fish'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Smart Fisher")
                
        # 4. Navigation Expert (Correct on 2 or 7)
        if 2 in completed_mids or 7 in completed_mids:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'correct_nav'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Navigation Expert")
                
        # 5. Storm Survivor (Correct on 3)
        if 3 in completed_mids:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'storm_survival'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Storm Survivor")
                
        # 6. Emergency Responder (Correct on 4)
        if 4 in completed_mids:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'tsunami_escape'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Emergency Responder")
                
        # 7. Ocean Protector (Correct on 6)
        if 6 in completed_mids:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'eco_shield'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Ocean Protector")
                
        # 8. Ocean Guardian (Collect 5 or more stamps)
        cursor.execute("SELECT count(*) FROM user_stamps WHERE user_id = ?", (user_id,))
        stamp_count = cursor.fetchone()[0]
        if stamp_count >= 5:
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'unlocked_5_stamps'")
            ach_id = cursor.fetchone()['id']
            cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach_id))
            if conn.total_changes > 0:
                unlocked_achievements.append("Ocean Guardian")
                
        conn.commit()
        
    return unlocked_stamps, unlocked_achievements

# --- HTTP ROUTES ---

@app.route('/')
def landing():
    return render_template('index.html')

@app.route('/login', methods=['GET', 'POST'])
def login():
    # Check if they are playing as guest
    if request.args.get('guest') == '1':
        # Create a unique guest account
        guest_rand = random.randint(1000, 9999)
        username = f"guest_{guest_rand}"
        name = f"Guest Guardian {guest_rand}"
        email = f"guest_{guest_rand}@oceanquest.org"
        guest_pass = generate_password_hash("guestpwd")
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute('''
                INSERT INTO users (name, username, email, password_hash, is_guest) 
                VALUES (?, ?, ?, ?, 1)
            ''', (name, username, email, guest_pass))
            conn.commit()
            
            # Fetch the new guest user ID
            cursor.execute("SELECT id, is_admin FROM users WHERE username = ?", (username,))
            user = cursor.fetchone()
            
            session['user_id'] = user['id']
            session['username'] = username
            session['is_guest'] = 1
            session['is_admin'] = 0
            
            flash("Welcome! Signed in as a Guest. Leaderboard scores won't store permanently.", "success")
            return redirect(url_for('roles'))

    if request.method == 'POST':
        username_input = request.form['username']
        password_input = request.form['password']
        remember_me = request.form.get('remember_me')
        
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT * FROM users WHERE username = ? OR email = ?", (username_input, username_input))
            user = cursor.fetchone()
            
            if user and check_password_hash(user['password_hash'], password_input):
                session['user_id'] = user['id']
                session['username'] = user['username']
                session['is_guest'] = user['is_guest']
                session['is_admin'] = user['is_admin']
                
                flash("Login successful! Welcome back.", "success")
                return redirect(url_for('dashboard'))
            else:
                flash("Invalid username or password.", "error")
                
    return render_template('login.html')

@app.route('/register', methods=['GET', 'POST'])
def register():
    if request.method == 'POST':
        name = request.form['name']
        username = request.form['username']
        email = request.form['email']
        password = request.form['password']
        age_group = request.form['age_group']
        language = request.form['language']
        
        hashed_pw = generate_password_hash(password)
        
        try:
            with get_db() as conn:
                cursor = conn.cursor()
                cursor.execute('''
                    INSERT INTO users (name, username, email, password_hash) 
                    VALUES (?, ?, ?, ?)
                ''', (name, username, email, hashed_pw))
                conn.commit()
                
            flash("Account created! You can now log in.", "success")
            return redirect(url_for('login'))
        except sqlite3.IntegrityError:
            flash("Username or Email already exists. Choose a different one.", "error")
            
    return render_template('register.html')

@app.route('/logout')
def logout():
    session.clear()
    flash("You have been signed out.", "success")
    return redirect(url_for('landing'))

@app.route('/dashboard')
def dashboard():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        # Calculate levels and XP percentage
        level, xp_current, xp_needed, xp_pct, level_name = get_level_info(user['xp'])
        
        # Update user's level in the database if it changed
        if level != user['level']:
            cursor.execute("UPDATE users SET level = ? WHERE id = ?", (level, user_id))
            conn.commit()
            # Reload user profile
            cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
            user = cursor.fetchone()
            
        # Get count of solved sessions
        cursor.execute("SELECT COUNT(*) FROM game_sessions WHERE user_id = ? AND is_correct = 1", (user_id,))
        completed_count = cursor.fetchone()[0]
        
        # Fetch user's achievements
        cursor.execute('''
            SELECT a.name, a.description 
            FROM user_achievements ua 
            JOIN achievements a ON ua.achievement_id = a.id 
            WHERE ua.user_id = ?
        ''', (user_id,))
        user_achievements = [dict(r) for r in cursor.fetchall()]
        
        # Find user global rank on leaderboard
        cursor.execute('''
            SELECT id FROM users 
            WHERE is_guest = 0 
            ORDER BY points DESC, level DESC, xp DESC
        ''')
        ranks = [r['id'] for r in cursor.fetchall()]
        user_rank = ranks.index(user_id) + 1 if user_id in ranks else None
        
        # Get next available mission for their role
        cursor.execute('''
            SELECT * FROM missions 
            WHERE role = ? AND id NOT IN (
                SELECT mission_id FROM game_sessions WHERE user_id = ? AND is_correct = 1
            )
            ORDER BY id ASC LIMIT 1
        ''', (user['selected_role'], user_id))
        next_mission = cursor.fetchone()
        if next_mission:
            next_mission = dict(next_mission)
            
    return render_template(
        'dashboard.html', 
        user=user, 
        level_name=level_name, 
        xp_current=xp_current, 
        xp_needed=xp_needed, 
        xp_pct=xp_pct,
        completed_count=completed_count,
        user_achievements=user_achievements,
        rank=user_rank,
        next_mission=next_mission
    )

@app.route('/roles')
def roles():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT selected_role FROM users WHERE id = ?", (user_id,))
        row = cursor.fetchone()
        current_role = row['selected_role'] if row else None
        
    return render_template('roles.html', current_role=current_role)

@app.route('/select-role/<role>')
def select_role(role):
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    valid_roles = ['fisherman', 'captain', 'tourism', 'explorer']
    
    if role not in valid_roles:
        flash("Invalid role choice.", "error")
        return redirect(url_for('roles'))
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET selected_role = ? WHERE id = ?", (role, user_id))
        conn.commit()
        
    # Check achievements
    check_achievements_and_stamps(user_id)
    
    flash(f"Role updated! You are now a {role.capitalize()}.", "success")
    return redirect(url_for('dashboard'))

@app.route('/game')
def game_route():
    """Finds next available mission for player's role, and routes to it."""
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT selected_role FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        if not user or not user['selected_role']:
            flash("Please choose a role first.", "error")
            return redirect(url_for('roles'))
            
        role = user['selected_role']
        
        # Get first incomplete mission for role
        cursor.execute('''
            SELECT id FROM missions 
            WHERE role = ? AND id NOT IN (
                SELECT mission_id FROM game_sessions WHERE user_id = ? AND is_correct = 1
            )
            ORDER BY id ASC LIMIT 1
        ''', (role, user_id))
        row = cursor.fetchone()
        
        if row:
            return redirect(url_for('mission', mission_id=row['id']))
        else:
            # Replay any mission or notify completed
            flash("All missions for your current role are completed! Try exploring other roles, or re-run missions.", "success")
            return redirect(url_for('dashboard'))

@app.route('/mission/<int:mission_id>')
def mission(mission_id):
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        cursor.execute("SELECT * FROM missions WHERE id = ?", (mission_id,))
        mission_row = cursor.fetchone()
        
        if not mission_row:
            flash("Mission not found.", "error")
            return redirect(url_for('dashboard'))
            
        mission_dict = dict(mission_row)
        mission_dict['ocean_conditions'] = json.loads(mission_dict['ocean_conditions'])
        
        # Fetch next mission if exists (for gameplay transition button)
        cursor.execute("SELECT id FROM missions WHERE role = ? AND id > ? ORDER BY id ASC LIMIT 1", (user['selected_role'], mission_id))
        next_row = cursor.fetchone()
        next_mission_id = next_row['id'] if next_row else None
        
        # Check if there is an active evaluation in the session for this specific mission
        result = session.pop('mission_result', None)
        if result and result.get('mission_id') != mission_id:
            # Stale result, clear it
            result = None
            
    return render_template('game.html', user=user, mission=mission_dict, result=result, next_mission_id=next_mission_id)

@app.route('/answer', methods=['POST'])
def submit_answer():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    mission_id = int(request.form['mission_id'])
    answer = request.form['answer'] # A, B, C, D
    time_taken = int(request.form.get('time_taken', 0))
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM missions WHERE id = ?", (mission_id,))
        mission = cursor.fetchone()
        
        if not mission:
            flash("Invalid mission submission.", "error")
            return redirect(url_for('dashboard'))
            
        is_correct = 1 if answer == mission['correct_answer'] else 0
        
        # Points and XP calculations
        points_earned = 0
        xp_earned = 0
        bonus_points = 0
        
        if is_correct:
            # Correct base rewards
            points_earned = mission['points_reward']
            xp_earned = mission['xp_reward']
            
            # Excellent bonus if solved under 10 seconds or Hard difficulty solved
            if time_taken > 0 and time_taken < 10:
                points_earned += 50
                xp_earned += 25
                flash("Excellent choice! You responded super fast! +50 Points bonus.", "success")
            elif mission['difficulty'] == 'hard':
                points_earned += 50
                xp_earned += 25
                
            # Increment Streak
            cursor.execute("UPDATE users SET streak = streak + 1 WHERE id = ?", (user_id,))
            conn.commit()
            
            # Read updated streak to reward multiplier bonuses
            cursor.execute("SELECT streak FROM users WHERE id = ?", (user_id,))
            streak = cursor.fetchone()['streak']
            if streak == 3:
                bonus_points = 100
            elif streak == 5:
                bonus_points = 250
            elif streak >= 10 and streak % 5 == 0:
                bonus_points = 500
                
            points_earned += bonus_points
        else:
            # Wrong decision
            points_earned = -50
            
            # Dangerous penalty if extreme threats ignored (Tsunami/Cyclone)
            conditions = json.loads(mission['ocean_conditions'])
            alert = conditions.get('alert', '')
            if 'TSUNAMI' in alert or 'CYCLONE' in alert:
                if answer in ['C', 'D']: # Ignore or wait on beach
                    points_earned = -100
                    flash("DANGEROUS DECISION: Neglecting emergency alerts puts lives at high risk!", "error")
            
            # Reset Streak
            cursor.execute("UPDATE users SET streak = 0 WHERE id = ?", (user_id,))
            conn.commit()
            
        # Update user's score parameters
        cursor.execute('''
            UPDATE users 
            SET points = points + ?, xp = xp + ? 
            WHERE id = ?
        ''', (points_earned, xp_earned, user_id))
        
        # Save Game Session history
        cursor.execute('''
            INSERT INTO game_sessions (user_id, mission_id, selected_answer, is_correct, xp_earned, points_earned)
            VALUES (?, ?, ?, ?, ?, ?)
        ''', (user_id, mission_id, answer, is_correct, xp_earned, points_earned))
        conn.commit()
        
        # Check and unlock stamps / achievements
        stamps_unlocked, ach_unlocked = check_achievements_and_stamps(user_id)
        
        # Check level up status
        cursor.execute("SELECT xp, level FROM users WHERE id = ?", (user_id,))
        updated_user = cursor.fetchone()
        level, _, _, _, level_name = get_level_info(updated_user['xp'])
        
        level_up = False
        if level > updated_user['level']:
            cursor.execute("UPDATE users SET level = ? WHERE id = ?", (level, user_id))
            conn.commit()
            level_up = True
            
        # Cache outcome inside session to render overlay in game.html
        session['mission_result'] = {
            'mission_id': mission_id,
            'is_correct': is_correct,
            'points_earned': points_earned,
            'xp_earned': xp_earned,
            'bonus_points': bonus_points,
            'explanation': mission['explanation'],
            'stamp_unlocked': stamps_unlocked[0] if stamps_unlocked else None,
            'achievement_unlocked': ach_unlocked[0] if ach_unlocked else None,
            'level_up': level_up,
            'level_name': level_name
        }
        
    return redirect(url_for('mission', mission_id=mission_id))

@app.route('/ocean-map')
def ocean_map():
    return render_template('ocean_map.html')

@app.route('/learn')
def learn():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    # Hardcoded modules loaded dynamically for hackathon
    modules = [
        {
            "id": "basics",
            "name": "Ocean Basics",
            "icon": "fa-water",
            "explanation": "<h3>Understanding Waves and Tides</h3><p>Ocean waves are generated by winds blowing over the water surface, transferring kinetic energy. Wave height is measured from trough to crest. Tides, on the other hand, are the rise and fall of sea levels caused by the combined gravitational forces exerted by the Moon and the Sun, along with the Earth's rotation.</p><p>Understanding tides is crucial for entering harbors, as shallow draft vessels can run aground during low tides.</p>",
            "quiz": [
                {"question": "How is wave height measured?", "option_a": "From sea floor to crest", "option_b": "From wave trough to crest", "option_c": "From surface to core", "ans": "B"},
                {"question": "What primary force drives sea tides?", "option_a": "Coriolis deflection", "option_b": "Solar heat bubbles", "option_c": "Gravitational pull of Moon and Sun", "ans": "C"},
                {"question": "What is low tide hazard?", "option_a": "Risk of running aground in shallow entryways", "option_b": "High water overflow", "option_c": "High winds", "ans": "A"}
            ]
        },
        {
            "id": "marine_life",
            "name": "Marine Life",
            "icon": "fa-fish",
            "explanation": "<h3>Marine Ecosystems and Biodiversity</h3><p>Oceans cover 71% of Earth's surface and host diverse biological systems. Phytoplankton forms the absolute base of the marine food web. They use chlorophyll to photosynthesize, attracting small baitfish, which in turn attract large commercial schools (tuna, mackerel, sardines).</p><p>Coral reefs occupy less than 0.1% of the ocean floor but support 25% of all marine species, providing nursery grounds and coastal storm barriers.</p>",
            "quiz": [
                {"question": "What organism forms the foundation of the marine food web?", "option_a": "Phytoplankton", "option_b": "Coral polyps", "option_c": "Blue Whales", "ans": "A"},
                {"question": "Which pigment allows phytoplankton to photosynthesize and show up on satellite feeds?", "option_a": "Hemoglobin", "option_b": "Chlorophyll", "option_c": "Melanin", "ans": "B"},
                {"question": "What percent of marine species depend on coral reefs?", "option_a": "Under 5%", "option_b": "Approximately 25%", "option_c": "Over 90%", "ans": "B"}
            ]
        },
        {
            "id": "weather",
            "name": "Ocean & Weather",
            "icon": "fa-cloud-sun",
            "explanation": "<h3>The Coupled Ocean-Atmosphere System</h3><p>The ocean acts as Earth's thermal flywheel. It absorbs over 90% of excess heat from greenhouse gases. Warm water evaporates, providing moisture that fuels winds, clouds, and storms. Sea Surface Temperature (SST) patterns dictate weather shapes globally.</p><p>For instance, water temperatures above 26.5°C are primary breeding grounds for tropical cyclones.</p>",
            "quiz": [
                {"question": "How much excess planetary heat does the ocean absorb?", "option_a": "Around 10%", "option_b": "Approximately 50%", "option_c": "Over 90%", "ans": "C"},
                {"question": "What is the threshold sea surface temperature for cyclogenesis?", "option_a": "20.0 °C", "option_b": "26.5 °C", "option_c": "35.0 °C", "ans": "B"},
                {"question": "Which system absorbs heat to regulate earth temperatures?", "option_a": "Desert sands", "option_b": "Upper ionosphere", "option_c": "The ocean system", "ans": "C"}
            ]
        },
        {
            "id": "extreme",
            "name": "Extreme Events",
            "icon": "fa-wind",
            "explanation": "<h3>Tsunamis, Cyclones, and Storm Surges</h3><p>Extreme events pose severe threats to coastal populations. Tsunamis are long-wavelength ocean waves generated by deep plate movements or subsea volcanic collapses. They travel at speeds up to 800 km/h in deep water, rising in height as they compress near coastlines.</p><p>Storm surges are water domes pushed shoreward by cyclone barometric drops and hurricane-force winds.</p>",
            "quiz": [
                {"question": "What is the primary trigger of a tsunami?", "option_a": "High monsoonal trade winds", "option_b": "Subsea earthquakes or tectonic slips", "option_c": "High solar flare activity", "ans": "B"},
                {"question": "How fast can tsunamis travel in deep ocean areas?", "option_a": "Up to 50 km/h", "option_b": "Up to 800 km/h", "option_c": "Speed of light", "ans": "B"},
                {"question": "What causes a storm surge?", "option_a": "Gravitational pull of Jupiter", "option_b": "Cyclone winds and low barometric pressure", "option_c": "Glacier melt", "ans": "B"}
            ]
        },
        {
            "id": "fishing",
            "name": "Sustainable Fishing",
            "icon": "fa-anchor",
            "explanation": "<h3>PFZ Advisories and Conservation</h3><p>Traditional fishing depends on visual cues or trial-and-error, causing heavy fuel burns and carbon emissions. Space-based sensors analyze Sea Surface Temperature (SST) fronts and Chlorophyll concentrations. Areas where both overlap are designated as Potential Fishing Zones (PFZs).</p><p>By utilizing PFZ maps, fishermen can sail directly to zones, reducing search times by up to 50% while preventing over-harvesting of breeding nurseries.</p>",
            "quiz": [
                {"question": "What two satellite datasets generate PFZ advisories?", "option_a": "SST and Chlorophyll", "option_b": "Salinity and Wave heights", "option_c": "Rainfall and Wind currents", "ans": "A"},
                {"question": "How do PFZ advisories help fishermen sustainably?", "option_a": "They point to areas where fishing is banned", "option_b": "They reduce fuel waste and sailing search time", "option_c": "They automate net deployment", "ans": "B"},
                {"question": "Why is over-trawling near estuaries dangerous?", "option_a": "Water is too salty", "option_b": "Destroys spawning nurseries of local species", "option_c": "Causes high wave surges", "ans": "B"}
            ]
        },
        {
            "id": "safety",
            "name": "Maritime Safety",
            "icon": "fa-ship",
            "explanation": "<h3>Vessel Safety and Telemetry Rules</h3><p>Navigating rough waters requires constant monitoring of wind direction and wave swell periods. Winds exceeding 35 km/h create dangerous breaking waves. Ship captains must maintain correct ballasting to keep center-of-gravity low during high swells.</p><p>Vessels should be equipped with VHF radios and distress beacons (EPIRBs) that send automatic GPS telemetry coordinates to rescue stations during crashes.</p>",
            "quiz": [
                {"question": "What wind threshold creates choppy, dangerous waves for small hulls?", "option_a": "Above 35 km/h", "option_b": "Only above 100 km/h", "option_c": "Above 5 km/h", "ans": "A"},
                {"question": "What does an EPIRB beacon do?", "option_a": "Transmits vessel location coordinates to rescue centers", "option_b": "Measures sea temperature", "option_c": "Attracts fish schools", "ans": "A"},
                {"question": "How should captains handle high swells?", "option_a": "Sail parallel to wave crests", "option_b": "Slow down and take waves at 30-45 degree angles", "option_c": "Turn off engines", "ans": "B"}
            ]
        },
        {
            "id": "conservation",
            "name": "Ocean Conservation",
            "icon": "fa-seedling",
            "explanation": "<h3>Combating Plastic Pollution and Coral Bleaching</h3><p>Human activities have heavily impacted marine habitats. Over 8 million tons of plastic enter the oceans annually, breaking down into microplastics that poison fish tissues. Rising atmospheric CO2 also dissolves into ocean waters, lowering pH and hindering corals from forming shells.</p><p>Protecting marine sanctuaries, restricting bottom-trawling, and using biodegradable gear are key steps to restore ecosystems.</p>",
            "quiz": [
                {"question": "How much plastic waste enters the oceans each year?", "option_a": "Under 1,000 tons", "option_b": "Over 8 million tons", "option_c": "None", "ans": "B"},
                {"question": "What is the biological impact of ocean acidification?", "option_a": "Corals and shellfish cannot build calcium shells", "option_b": "Water turns green", "option_c": "Fish grow larger", "ans": "A"},
                {"question": "What are microplastics?", "option_a": "Plastics used in medical labs", "option_b": "Tiny degraded plastic particles that enter marine food webs", "option_c": "Biodegradable seaweed bags", "ans": "B"}
            ]
        },
        {
            "id": "climate",
            "name": "Climate & Ocean",
            "icon": "fa-thermometer",
            "explanation": "<h3>The Great Ocean Conveyor Belt</h3><p>Thermocline circulation—driven by density differences caused by water temperature (thermo) and salinity (haline)—acts as the planetary radiator. Warm water flows near the surface, while cold dense polar water sinks and crawls along the seabed.</p><p>Disrupting this conveyor belt due to glacial freshwater melt could freeze Northern Europe while heating tropical zones exponentially.</p>",
            "quiz": [
                {"question": "What drives the Thermohaline Circulation?", "option_a": "Differences in temperature and salinity", "option_b": "Wind speeds and tidal friction", "option_c": "Moon gravitational sweeps", "ans": "A"},
                {"question": "What is the Thermocline layer?", "option_a": "The ocean surface", "option_b": "The depth zone where temperature drops rapidly", "option_c": "The ocean floor", "ans": "B"},
                {"question": "What happens if polar ice melt disrupts currents?", "option_a": "Global temperatures stabilize", "option_b": "Climate patterns shift drastically worldwide", "option_c": "Oceans dry up", "ans": "B"}
            ]
        }
    ]
    return render_template('learn.html', categories=modules)

@app.route('/submit-learn-quiz', methods=['POST'])
def submit_learn_quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    category_id = request.form['category_id']
    
    # Quick correct verification answers key
    answers_key = {
        "basics": {"q1": "B", "q2": "C", "q3": "A"},
        "marine_life": {"q1": "A", "q2": "B", "q3": "B"},
        "weather": {"q1": "C", "q2": "B", "q3": "C"},
        "extreme": {"q1": "B", "q2": "B", "q3": "B"},
        "fishing": {"q1": "A", "q2": "B", "q3": "B"},
        "safety": {"q1": "A", "q2": "A", "q3": "B"},
        "conservation": {"q1": "B", "q2": "A", "q3": "B"},
        "climate": {"q1": "A", "q2": "B", "q3": "B"}
    }
    
    q1 = request.form.get('q1')
    q2 = request.form.get('q2')
    q3 = request.form.get('q3')
    
    expected = answers_key.get(category_id, {})
    
    if q1 == expected.get('q1') and q2 == expected.get('q2') and q3 == expected.get('q3'):
        # Correct! Reward +50 XP and +50 points
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("UPDATE users SET xp = xp + 50, points = points + 50 WHERE id = ?", (user_id,))
            conn.commit()
            
        flash("Review quiz passed! You earned +50 XP and +50 points.", "success")
    else:
        flash("One or more answers were incorrect. Review the module text and try again!", "error")
        
    return redirect(url_for('learn'))

@app.route('/quiz')
def quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))
    return render_template('quiz.html')

@app.route('/quiz/submit', methods=['POST'])
def submit_quiz():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    score = int(request.form['score']) # 0 to 100
    difficulty = request.form['difficulty']
    
    points_earned = score * 2 # up to 200 points
    xp_earned = score * 5 # up to 500 XP
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("UPDATE users SET points = points + ?, xp = xp + ?, ocean_iq = ? WHERE id = ?", (points_earned, xp_earned, score, user_id))
        conn.commit()
        
    # Check achievements
    check_achievements_and_stamps(user_id)
    
    # If 100% on medium/hard, unlock Wave Master achievement
    if score >= 80 and difficulty in ['medium', 'hard', 'expert']:
        with get_db() as conn:
            cursor = conn.cursor()
            cursor.execute("SELECT id FROM achievements WHERE requirement = 'quiz_master'")
            ach = cursor.fetchone()
            if ach:
                cursor.execute("INSERT OR IGNORE INTO user_achievements (user_id, achievement_id) VALUES (?, ?)", (user_id, ach['id']))
                conn.commit()
                flash("New Achievement Unlocked: WAVE MASTER!", "success")
                
    flash(f"Quiz completed! You earned +{points_earned} Points and +{xp_earned} XP.", "success")
    return redirect(url_for('dashboard'))

@app.route('/passport')
def passport():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
        cursor.execute("SELECT * FROM stamps")
        stamps = [dict(r) for r in cursor.fetchall()]
        
        # Get unlocked stamps
        cursor.execute("SELECT stamp_id, unlocked_at FROM user_stamps WHERE user_id = ?", (user_id,))
        unlocked_rows = cursor.fetchall()
        unlocked_stamp_ids = [r['stamp_id'] for r in unlocked_rows]
        
        # Format dates
        unlock_dates = {}
        for r in unlocked_rows:
            # Format datetime
            dt = datetime.strptime(r['unlocked_at'][:19], '%Y-%m-%d %H:%M:%S') if len(r['unlocked_at']) >= 19 else datetime.now()
            unlock_dates[r['stamp_id']] = dt.strftime('%d-%b-%Y').upper()
            
    return render_template('passport.html', user=user, stamps=stamps, unlocked_stamp_ids=unlocked_stamp_ids, unlock_dates=unlock_dates)

@app.route('/achievements')
def achievements():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    user_id = session['user_id']
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM achievements")
        achievements_list = [dict(r) for r in cursor.fetchall()]
        
        # Get unlocked achievements
        cursor.execute("SELECT achievement_id, unlocked_at FROM user_achievements WHERE user_id = ?", (user_id,))
        unlocked_rows = cursor.fetchall()
        unlocked_achievement_ids = [r['achievement_id'] for r in unlocked_rows]
        
        unlock_dates = {}
        for r in unlocked_rows:
            dt = datetime.strptime(r['unlocked_at'][:19], '%Y-%m-%d %H:%M:%S') if len(r['unlocked_at']) >= 19 else datetime.now()
            unlock_dates[r['achievement_id']] = dt.strftime('%d-%b-%Y').upper()
            
    return render_template('achievements.html', achievements=achievements_list, unlocked_achievement_ids=unlocked_achievement_ids, unlock_dates=unlock_dates)

@app.route('/leaderboard')
def leaderboard():
    current_user_id = session.get('user_id', 0)
    period = request.args.get('period', 'all_time') # daily, weekly, monthly, all_time
    role = request.args.get('role', 'all') # all, fisherman, captain, tourism, explorer
    
    # For prototype simulation, we query database users.
    # Exclude guest accounts to preserve permanent competition
    query = "SELECT * FROM users WHERE is_guest = 0"
    params = []
    
    if role != 'all':
        query += " AND selected_role = ?"
        params.append(role)
        
    # Since it's a prototype with mock static records, we order by points
    query += " ORDER BY points DESC, level DESC, xp DESC"
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute(query, params)
        all_players = [dict(r) for r in cursor.fetchall()]
        
        # Fetch Top 3 for the podium
        top_players = all_players[:3]
        
    return render_template(
        'leaderboard.html', 
        all_players=all_players, 
        top_players=top_players, 
        current_user_id=current_user_id,
        active_period=period,
        active_role=role
    )

@app.route('/daily-challenge')
def daily_challenge():
    if 'user_id' not in session:
        return redirect(url_for('login'))
        
    # Standard daily mission is mapped to Mission 3 or a custom mission representation
    # For dynamic hackathon prototype, we load Mission 3 (Cyclone Emergency) and tag it as daily!
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("SELECT * FROM missions WHERE id = 3")
        mission_row = cursor.fetchone()
        
        mission_dict = dict(mission_row)
        mission_dict['title'] = "🌊 DAILY OCEAN CHALLENGE: Cyclone Emergency"
        mission_dict['points_reward'] = 200 # boosted points
        mission_dict['xp_reward'] = 250 # boosted XP
        mission_dict['ocean_conditions'] = json.loads(mission_dict['ocean_conditions'])
        
        user_id = session['user_id']
        cursor.execute("SELECT * FROM users WHERE id = ?", (user_id,))
        user = cursor.fetchone()
        
    return render_template('game.html', user=user, mission=mission_dict, result=None, next_mission_id=None)

@app.route('/admin')
def admin():
    if 'user_id' not in session or not session.get('is_admin'):
        flash("Unauthorized. Admin privileges required.", "error")
        return redirect(url_for('login'))
        
    with get_db() as conn:
        cursor = conn.cursor()
        
        # Analytics Summaries
        cursor.execute("SELECT count(*) FROM users")
        total_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM users WHERE is_guest = 0")
        active_users = cursor.fetchone()[0]
        
        cursor.execute("SELECT count(*) FROM game_sessions")
        missions_played = cursor.fetchone()[0]
        
        cursor.execute("SELECT avg(ocean_iq) FROM users")
        avg_ocean_iq = int(cursor.fetchone()[0] or 0)
        
        # Role statistics counts
        cursor.execute("SELECT count(*) FROM users WHERE selected_role = 'fisherman'")
        role_fisherman = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM users WHERE selected_role = 'captain'")
        role_captain = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM users WHERE selected_role = 'tourism'")
        role_tourism = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM users WHERE selected_role = 'explorer'")
        role_explorer = cursor.fetchone()[0]
        
        # Success rates
        cursor.execute("SELECT count(*) FROM game_sessions WHERE is_correct = 1")
        correct_decisions = cursor.fetchone()[0]
        cursor.execute("SELECT count(*) FROM game_sessions WHERE is_correct = 0")
        failed_decisions = cursor.fetchone()[0]
        
        # Load all missions
        cursor.execute("SELECT * FROM missions ORDER BY id ASC")
        missions_list = [dict(r) for r in cursor.fetchall()]
        
        stats = {
            "total_users": total_users,
            "active_users": active_users,
            "missions_played": missions_played,
            "avg_ocean_iq": avg_ocean_iq,
            "role_fisherman": role_fisherman,
            "role_captain": role_captain,
            "role_tourism": role_tourism,
            "role_explorer": role_explorer,
            "correct_decisions": correct_decisions,
            "failed_decisions": failed_decisions
        }
        
    return render_template('admin.html', stats=stats, missions=missions_list)

@app.route('/admin/add-mission', methods=['POST'])
def add_mission():
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('login'))
        
    title = request.form['title']
    role = request.form['role']
    difficulty = request.form['difficulty']
    description = request.form['description']
    
    # Ocean advisory fields
    conditions = {
        "wave_height": float(request.form['wave_height']),
        "wave_direction": "WSW",
        "wind_speed": int(request.form['wind_speed']),
        "wind_direction": "SW",
        "sst": float(request.form['sst']),
        "fish_zone": request.form['fish_zone'],
        "alert": request.form['alert']
    }
    
    option_a = request.form['option_a']
    option_b = request.form['option_b']
    option_c = request.form.get('option_c')
    option_d = request.form.get('option_d')
    correct_answer = request.form['correct_answer']
    explanation = request.form['explanation']
    points_reward = int(request.form['points_reward'])
    xp_reward = int(request.form['xp_reward'])
    
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute('''
            INSERT INTO missions (title, description, role, difficulty, ocean_conditions, option_a, option_b, option_c, option_d, correct_answer, explanation, xp_reward, points_reward)
            VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        ''', (title, description, role, difficulty, json.dumps(conditions), option_a, option_b, option_c, option_d, correct_answer, explanation, xp_reward, points_reward))
        conn.commit()
        
    flash("New Mission scenario deployed successfully!", "success")
    return redirect(url_for('admin'))

@app.route('/admin/delete-mission/<int:id>')
def delete_mission(id):
    if 'user_id' not in session or not session.get('is_admin'):
        return redirect(url_for('login'))
        
    with get_db() as conn:
        cursor = conn.cursor()
        cursor.execute("DELETE FROM missions WHERE id = ?", (id,))
        conn.commit()
        
    flash(f"Mission {id} has been deleted.", "success")
    return redirect(url_for('admin'))


if __name__ == '__main__':
    # Initialize SQLite database file & seeds
    init_db()
    
    # Run server locally on Port 5000
    app.run(debug=True, host='0.0.0.0', port=5000)
