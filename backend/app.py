from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import sqlite3, os, bcrypt, jwt, uuid, tempfile
from datetime import datetime, timedelta, timezone
from functools import wraps
from werkzeug.utils import secure_filename

# == AI Agent Imports =========================================
from agents.analysis_agent import AnalysisAgent
from agents.prediction_agent import PredictionAgent
from agents.savings_agent import SavingsAdvisorAgent
from agents.memory_agent import MemoryAgent
from agents.ocr_agent import OCRAgent
from agents.voice_agent import VoiceAgent
from memory.memory_store import get_context_string

# == Paths ===================================================
BASE_DIR = os.path.dirname(__file__)
FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, '..', 'frontend', 'dist'))
if not os.path.isdir(FRONTEND_DIR):
    FRONTEND_DIR = os.path.abspath(os.path.join(BASE_DIR, 'frontend', 'dist'))

DB_PATH = os.path.join(BASE_DIR, 'expenses.db')
BUDGETS_DIR = os.path.join(BASE_DIR, 'budgets')
os.makedirs(BUDGETS_DIR, exist_ok=True)

JWT_SECRET = os.environ.get('JWT_SECRET', 'spendwise-secret-key-change-in-prod')
JWT_EXP_HOURS = 24

app = Flask(__name__)
CORS(app, supports_credentials=True)

# == DB Setup =================================================
def get_db():
    conn = sqlite3.connect(DB_PATH)
    conn.row_factory = sqlite3.Row
    return conn

def init_db():
    conn = get_db()
    conn.executescript('''
        CREATE TABLE IF NOT EXISTS users (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            username TEXT UNIQUE NOT NULL,
            password_hash TEXT NOT NULL,
            created_at TEXT DEFAULT CURRENT_TIMESTAMP
        );
        CREATE TABLE IF NOT EXISTS expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            amount REAL NOT NULL,
            category TEXT NOT NULL,
            date TEXT NOT NULL,
            note TEXT,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS budget (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER UNIQUE NOT NULL,
            monthly_budget REAL NOT NULL DEFAULT 0,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS memory (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            key TEXT NOT NULL,
            value TEXT NOT NULL,
            updated_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, key) ON CONFLICT REPLACE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS ai_summaries (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            month TEXT NOT NULL,
            summary TEXT NOT NULL,
            tips TEXT DEFAULT '',
            created_at TEXT DEFAULT CURRENT_TIMESTAMP,
            UNIQUE(user_id, month) ON CONFLICT REPLACE,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
        CREATE TABLE IF NOT EXISTS recurring_expenses (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            user_id INTEGER NOT NULL,
            title TEXT NOT NULL,
            estimated_amount REAL,
            category TEXT,
            day_of_month INTEGER,
            FOREIGN KEY(user_id) REFERENCES users(id)
        );
    ''')
    conn.commit()
    conn.close()

init_db()

# == Auth Helper ==============================================
def make_token(user_id, username):
    payload = {
        'user_id': user_id,
        'username': username,
        'exp': datetime.now(timezone.utc) + timedelta(hours=JWT_EXP_HOURS)
    }
    return jwt.encode(payload, JWT_SECRET, algorithm='HS256')

def require_auth(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization', '').replace('Bearer ', '')
        if not token:
            return jsonify({'error': 'No token provided'}), 401
        try:
            data = jwt.decode(token, JWT_SECRET, algorithms=['HS256'])
            request.user_id = data['user_id']
            request.username = data['username']
        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token expired'}), 401
        except Exception:
            return jsonify({'error': 'Invalid token'}), 401
        return f(*args, **kwargs)
    return decorated


# == Auth Routes ==============================================
@app.route('/api/auth/register', methods=['POST'])
def register():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    if not username or not password:
        return jsonify({'error': 'Username and password required'}), 400
    if len(username) < 3:
        return jsonify({'error': 'Username must be at least 3 characters'}), 400
    if len(password) < 6:
        return jsonify({'error': 'Password must be at least 6 characters'}), 400
    pw_hash = bcrypt.hashpw(password.encode(), bcrypt.gensalt()).decode()
    conn = get_db()
    try:
        cursor = conn.execute(
            'INSERT INTO users (username, password_hash) VALUES (?, ?)',
            (username, pw_hash)
        )
        conn.commit()
        user_id = cursor.lastrowid
        conn.execute('INSERT OR IGNORE INTO budget (user_id, monthly_budget) VALUES (?, 0)', (user_id,))
        conn.commit()
        token = make_token(user_id, username)
        return jsonify({'token': token, 'username': username}), 201
    except sqlite3.IntegrityError:
        return jsonify({'error': 'Username already taken'}), 409
    finally:
        conn.close()

@app.route('/api/auth/login', methods=['POST'])
def login():
    data = request.get_json()
    username = (data.get('username') or '').strip()
    password = (data.get('password') or '').strip()
    conn = get_db()
    row = conn.execute('SELECT * FROM users WHERE username = ?', (username,)).fetchone()
    conn.close()
    if not row or not bcrypt.checkpw(password.encode(), row['password_hash'].encode()):
        return jsonify({'error': 'Invalid username or password'}), 401
    token = make_token(row['id'], row['username'])
    return jsonify({'token': token, 'username': username})

@app.route('/api/auth/me', methods=['GET'])
@require_auth
def me():
    return jsonify({'user_id': request.user_id, 'username': request.username})

# ── Expenses ─────────────────────────────────────────────────
@app.route('/api/expenses', methods=['GET'])
@require_auth
def get_expenses():
    month = request.args.get('month')
    conn = get_db()
    if month:
        rows = conn.execute(
            "SELECT * FROM expenses WHERE user_id=? AND date LIKE ? ORDER BY date DESC",
            (request.user_id, f"{month}%")
        ).fetchall()
    else:
        rows = conn.execute(
            "SELECT * FROM expenses WHERE user_id=? ORDER BY date DESC",
            (request.user_id,)
        ).fetchall()
    conn.close()
    return jsonify([dict(r) for r in rows])

@app.route('/api/expenses', methods=['POST'])
@require_auth
def add_expense():
    data = request.get_json()
    conn = get_db()
    cursor = conn.execute(
        "INSERT INTO expenses (user_id, title, amount, category, date, note) VALUES (?, ?, ?, ?, ?, ?)",
        (request.user_id, data['title'], data['amount'], data['category'], data['date'], data.get('note', ''))
    )
    conn.commit()
    row = conn.execute("SELECT * FROM expenses WHERE id=?", (cursor.lastrowid,)).fetchone()
    conn.close()
    return jsonify(dict(row)), 201

@app.route('/api/expenses/<int:expense_id>', methods=['PUT'])
@require_auth
def update_expense(expense_id):
    data = request.get_json()
    conn = get_db()
    conn.execute(
        "UPDATE expenses SET title=?, amount=?, category=?, date=?, note=? WHERE id=? AND user_id=?",
        (data['title'], data['amount'], data['category'], data['date'], data.get('note', ''), expense_id, request.user_id)
    )
    conn.commit()
    row = conn.execute("SELECT * FROM expenses WHERE id=?", (expense_id,)).fetchone()
    conn.close()
    return jsonify(dict(row))

@app.route('/api/expenses/<int:expense_id>', methods=['DELETE'])
@require_auth
def delete_expense(expense_id):
    conn = get_db()
    conn.execute("DELETE FROM expenses WHERE id=? AND user_id=?", (expense_id, request.user_id))
    conn.commit()
    conn.close()
    return jsonify({'message': 'Deleted'})

# ── Budget ────────────────────────────────────────────────────
@app.route('/api/budget', methods=['GET'])
@require_auth
def get_budget():
    conn = get_db()
    row = conn.execute("SELECT monthly_budget FROM budget WHERE user_id=?", (request.user_id,)).fetchone()
    conn.close()
    return jsonify({'monthly_budget': row['monthly_budget'] if row else 0})

@app.route('/api/budget', methods=['PUT'])
@require_auth
def update_budget():
    data = request.get_json()
    amount = data.get('monthly_budget', 0)
    conn = get_db()
    conn.execute(
        "INSERT INTO budget (user_id, monthly_budget) VALUES (?, ?) ON CONFLICT(user_id) DO UPDATE SET monthly_budget=?",
        (request.user_id, amount, amount)
    )
    conn.commit()
    conn.close()
    # Save to file
    import json
    budget_file = os.path.join(BUDGETS_DIR, f'user_{request.user_id}_budget.json')
    with open(budget_file, 'w') as f:
        json.dump({'user_id': request.user_id, 'username': request.username,
                   'monthly_budget': amount, 'updated_at': datetime.now().isoformat()}, f, indent=2)
    return jsonify({'monthly_budget': amount})

@app.route('/api/budget/export', methods=['GET'])
@require_auth
def export_budget():
    import json
    budget_file = os.path.join(BUDGETS_DIR, f'user_{request.user_id}_budget.json')
    if os.path.exists(budget_file):
        with open(budget_file) as f:
            return jsonify(json.load(f))
    return jsonify({'monthly_budget': 0})

# == Summary ===================================================
@app.route('/api/summary', methods=['GET'])
@require_auth
def get_summary():
    month = request.args.get('month', datetime.now().strftime('%Y-%m'))
    conn = get_db()
    rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id=? AND date LIKE ?",
        (request.user_id, f"{month}%")
    ).fetchall()
    budget_row = conn.execute("SELECT monthly_budget FROM budget WHERE user_id=?", (request.user_id,)).fetchone()
    conn.close()
    
    total = sum(r['amount'] for r in rows)
    by_category = {}
    
    # Calculate daily spending trend
    from collections import defaultdict
    daily = defaultdict(float)
    for r in rows:
        by_category[r['category']] = by_category.get(r['category'], 0) + r['amount']
        daily[r['date']] = daily[r['date']] + r['amount']
        
    daily_trend = [{'date': d, 'total': round(t, 2)} for d, t in sorted(daily.items())]
    budget = budget_row['monthly_budget'] if budget_row else 0
    
    return jsonify({
        'total': total,
        'budget': budget,
        'remaining': budget - total,
        'by_category': by_category,
        'count': len(rows),
        'daily_trend': daily_trend
    })

@app.route('/health')
def health():
    return jsonify({'status': 'ok'})

# == AI API Endpoints =========================================
@app.route('/api/ai/analyze', methods=['GET'])
@require_auth
def ai_analyze():
    # 1. Get dates for current month and previous month
    now = datetime.now()
    current_month_str = now.strftime('%Y-%m')
    
    # Calculate previous month
    first_day_current = now.replace(day=1)
    prev_month_date = first_day_current - timedelta(days=1)
    prev_month_str = prev_month_date.strftime('%Y-%m')

    # 2. Query database for expenses
    conn = get_db()
    curr_rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id=? AND date LIKE ? ORDER BY date DESC",
        (request.user_id, f"{current_month_str}%")
    ).fetchall()
    prev_rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id=? AND date LIKE ? ORDER BY date DESC",
        (request.user_id, f"{prev_month_str}%")
    ).fetchall()
    budget_row = conn.execute("SELECT monthly_budget FROM budget WHERE user_id=?", (request.user_id,)).fetchone()
    conn.close()

    curr_expenses = [dict(r) for r in curr_rows]
    prev_expenses = [dict(r) for r in prev_rows]
    budget = budget_row['monthly_budget'] if budget_row else 0.0

    # 3. Retrieve Memory Context via MemoryAgent
    mem_agent = MemoryAgent()
    mem_retrieval = mem_agent.safe_run({
        "action": "retrieve",
        "user_id": request.user_id
    })
    memory_context = mem_retrieval.get("context_string", "")

    # 4. Execute AnalysisAgent
    analysis_agent = AnalysisAgent()
    analysis_res = analysis_agent.safe_run({
        "username": request.username,
        "current_month": current_month_str,
        "expenses": curr_expenses,
        "prev_expenses": prev_expenses,
        "budget": budget,
        "memory_context": memory_context
    })

    # Save summary and tips to database
    if analysis_res.get("_error") is None:
        conn = get_db()
        conn.execute(
            """INSERT INTO ai_summaries (user_id, month, summary, tips)
               VALUES (?, ?, ?, ?)
               ON CONFLICT(user_id, month) DO UPDATE SET summary=excluded.summary, tips=excluded.tips""",
            (request.user_id, current_month_str, analysis_res["summary"], "")
        )
        conn.commit()
        conn.close()

        # 5. Automatically update user memory based on patterns detected
        mem_agent.safe_run({
            "action": "update",
            "user_id": request.user_id,
            "analysis_data": analysis_res,
            "summary_text": analysis_res["summary"]
        })

    return jsonify(analysis_res)

@app.route('/api/ai/predict', methods=['GET'])
@require_auth
def ai_predict():
    now = datetime.now()
    current_month_str = now.strftime('%Y-%m')

    conn = get_db()
    curr_rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id=? AND date LIKE ? ORDER BY date DESC",
        (request.user_id, f"{current_month_str}%")
    ).fetchall()
    budget_row = conn.execute("SELECT monthly_budget FROM budget WHERE user_id=?", (request.user_id,)).fetchone()
    conn.close()

    curr_expenses = [dict(r) for r in curr_rows]
    budget = budget_row['monthly_budget'] if budget_row else 0.0

    pred_agent = PredictionAgent()
    pred_res = pred_agent.safe_run({
        "username": request.username,
        "expenses": curr_expenses,
        "budget": budget
    })
    return jsonify(pred_res)

@app.route('/api/ai/savings', methods=['GET'])
@require_auth
def ai_savings():
    now = datetime.now()
    current_month_str = now.strftime('%Y-%m')

    conn = get_db()
    curr_rows = conn.execute(
        "SELECT * FROM expenses WHERE user_id=? AND date LIKE ? ORDER BY date DESC",
        (request.user_id, f"{current_month_str}%")
    ).fetchall()
    budget_row = conn.execute("SELECT monthly_budget FROM budget WHERE user_id=?", (request.user_id,)).fetchone()
    conn.close()

    curr_expenses = [dict(r) for r in curr_rows]
    budget = budget_row['monthly_budget'] if budget_row else 0.0

    savings_agent = SavingsAdvisorAgent()
    savings_res = savings_agent.safe_run({
        "username": request.username,
        "expenses": curr_expenses,
        "budget": budget
    })

    # Save savings tips to database
    if savings_res.get("_error") is None:
        conn = get_db()
        conn.execute(
            """INSERT INTO ai_summaries (user_id, month, summary, tips)
               VALUES (?, ?, COALESCE((SELECT summary FROM ai_summaries WHERE user_id=? AND month=?), ''), ?)
               ON CONFLICT(user_id, month) DO UPDATE SET tips=excluded.tips""",
            (request.user_id, current_month_str, request.user_id, current_month_str, savings_res["tips"])
        )
        conn.commit()
        conn.close()

    return jsonify(savings_res)

@app.route('/api/ai/memory', methods=['GET'])
@require_auth
def ai_memory():
    mem_agent = MemoryAgent()
    mem_res = mem_agent.safe_run({
        "action": "retrieve",
        "user_id": request.user_id
    })
    return jsonify(mem_res)

@app.route('/api/ai/upload-receipt', methods=['POST'])
@require_auth
def ai_upload_receipt():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part in the request'}), 400
    
    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No file selected for uploading'}), 400

    if file:
        filename = secure_filename(file.filename)
        temp_dir = tempfile.gettempdir()
        temp_path = os.path.join(temp_dir, f"receipt_{uuid.uuid4()}_{filename}")
        file.save(temp_path)

        ocr_agent = OCRAgent()
        ocr_res = ocr_agent.safe_run({
            "image_path": temp_path
        })

        # Cleanup temp file
        try:
            if os.path.exists(temp_path):
                os.remove(temp_path)
        except Exception as e:
            print(f"Error removing temp file: {e}")

        return jsonify(ocr_res)

@app.route('/api/ai/voice-entry', methods=['POST'])
@require_auth
def ai_voice_entry():
    data = request.get_json() or {}
    text = data.get("text", "")
    if not text:
        return jsonify({'error': 'No voice/text command provided.'}), 400

    voice_agent = VoiceAgent()
    voice_res = voice_agent.safe_run({
        "text": text
    })
    return jsonify(voice_res)

# == Frontend Routes (Catch-all) ==============================
@app.route('/', defaults={'path': ''})
@app.route('/<path:path>')
def serve(path):
    # Check if the file exists in FRONTEND_DIR
    full_path = os.path.join(FRONTEND_DIR, path)
    if path != "" and os.path.exists(full_path):
        return send_from_directory(FRONTEND_DIR, path)
    
    # Fallback to index.html for SPA routing
    return send_from_directory(FRONTEND_DIR, 'index.html')

if __name__ == '__main__':
    port = int(os.environ.get('PORT', 5001))
    app.run(host='0.0.0.0', port=port, debug=True)
