# 🧾 Expense Tracker — Beginner Setup Guide
### HTML + CSS + JS (Frontend) + Python Flask (Backend)

---

## 🗂️ 1. Project Structure (Folders & Files)

Think of your project like a house:
- The **frontend** is what you *see* (walls, windows, decoration)
- The **backend** is what makes things *work* behind the scenes (plumbing, wiring)

Here's how your folder structure will look:

```
expense-tracker/
│
├── backend/                  ← Python Flask lives here
│   ├── app.py                ← Main Flask server file
│   ├── requirements.txt      ← List of Python packages to install
│   └── expenses.db           ← SQLite database (auto-created later)
│
├── frontend/                 ← HTML, CSS, JS lives here
│   ├── index.html            ← Main webpage
│   ├── style.css             ← Styles (colors, fonts, layout)
│   └── script.js             ← JavaScript logic
│
└── README.md                 ← Optional: description of your project
```

> [!NOTE]
> Your workspace is already set up at:
> `C:\Users\lenovo\OneDrive\Desktop\Expense tracker\gfg\gfg spndwise`
> We'll create the folders inside here.

---

## 🛠️ 2. Software You Need to Install

Install these **one by one** in order:

| # | Software | What it does | Download Link |
|---|----------|--------------|---------------|
| 1 | **Python 3.x** | Runs your Flask backend | https://www.python.org/downloads/ |
| 2 | **VS Code** | Code editor | https://code.visualstudio.com/ |
| 3 | **Node.js** *(optional)* | Needed if you use Live Server extension | https://nodejs.org/ |

### ✅ After Installing Python — Verify it works:
Open **Command Prompt** and type:
```
python --version
```
You should see something like: `Python 3.12.0`

Then also check pip (Python's package installer):
```
pip --version
```

---

## 💻 3. VS Code Setup — Extensions to Install

Open VS Code → Click the **Extensions icon** on the left sidebar (looks like 4 squares) → Search and install these:

| Extension Name | Why You Need It |
|----------------|-----------------|
| **Python** (by Microsoft) | Enables Python support in VS Code |
| **Live Server** (by Ritwick Dey) | Opens your HTML file in browser with auto-refresh |
| **Pylance** | Smart Python code suggestions |
| **REST Client** *(optional)* | Test your Flask API easily |

---

## 📁 4. How to Create the Project Structure

### Step 1 — Open your project folder in VS Code:
1. Open VS Code
2. Click **File → Open Folder**
3. Navigate to: `C:\Users\lenovo\OneDrive\Desktop\Expense tracker\gfg\gfg spndwise`
4. Click **Select Folder**

### Step 2 — Create folders using VS Code:
- In the left sidebar (Explorer), right-click → **New Folder**
- Create: `backend`
- Create: `frontend`

### Step 3 — Create files inside each folder:

**Inside `backend/`:**
- Right-click `backend` → New File → name it `app.py`
- Right-click `backend` → New File → name it `requirements.txt`

**Inside `frontend/`:**
- Right-click `frontend` → New File → name it `index.html`
- Right-click `frontend` → New File → name it `style.css`
- Right-click `frontend` → New File → name it `script.js`

---

## 🐍 5. Setting Up Python Flask (Backend)

### Step 1 — Open the Terminal in VS Code:
Press **Ctrl + `` ` ``** (backtick key, top-left of keyboard)
Or go to: **Terminal → New Terminal**

### Step 2 — Create a Virtual Environment:
A virtual environment keeps your project's packages separate from your system Python.

```bash
python -m venv venv
```

This creates a folder called `venv` in your project.

### Step 3 — Activate the Virtual Environment:

**On Windows:**
```bash
venv\Scripts\activate
```

You'll see `(venv)` appear at the start of your terminal — that means it's working! ✅

### Step 4 — Install Flask:
```bash
pip install flask flask-cors
```

- `flask` → the web framework
- `flask-cors` → allows your HTML page to talk to your Flask server

### Step 5 — Save your dependencies:
```bash
pip freeze > backend/requirements.txt
```

This records what you installed so others (or you, later) can reinstall everything easily.

---

## 🌐 6. How Frontend & Backend Talk to Each Other

```
[ Browser / HTML page ]
        ↕  (sends requests via JavaScript fetch())
[ Flask Server / Python ]
        ↕  (reads/writes data)
[ SQLite Database ]
```

- When you click **"Add Expense"** → JavaScript sends data to Flask
- Flask saves it to the database
- Flask sends back a response
- JavaScript shows the result on the page

> [!IMPORTANT]
> This is called a **REST API**. Flask is your API. Your HTML is the client that calls the API.

---

## 🧭 What Comes Next (When You're Ready for Code)

Once the structure is ready, we'll build:

1. **`app.py`** — Flask routes to add/get/delete expenses
2. **`index.html`** — The expense form and list display
3. **`style.css`** — Beautiful styling for your tracker
4. **`script.js`** — JavaScript to connect frontend to backend

---

## 🎯 Quick Checklist Before Coding

- [ ] Python installed and verified (`python --version`)
- [ ] VS Code installed with Python + Live Server extensions
- [ ] Project folder opened in VS Code
- [ ] `backend/` and `frontend/` folders created
- [ ] All 5 files created (`app.py`, `requirements.txt`, `index.html`, `style.css`, `script.js`)
- [ ] Virtual environment created and activated `(venv)`
- [ ] Flask installed (`pip install flask flask-cors`)

Once all boxes are checked ✅ — you're ready to write code! 🚀
