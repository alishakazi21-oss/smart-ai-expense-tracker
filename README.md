# 💸 Smart AI Expense Tracker (SpendWise)

[![Python](https://img.shields.io/badge/Python-3.11-3776AB?style=for-the-badge&logo=python&logoColor=white)](https://www.python.org/)
[![React](https://img.shields.io/badge/React-18-20232A?style=for-the-badge&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.0-38B2AC?style=for-the-badge&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Firebase](https://img.shields.io/badge/Firebase-FFCA28?style=for-the-badge&logo=firebase&logoColor=black)](https://firebase.google.com/)
[![Google Gemini API](https://img.shields.io/badge/Gemini_API-1.5_Flash-8E75C2?style=for-the-badge&logo=google-gemini&logoColor=white)](https://deepmind.google/technologies/gemini/)

> **A first-year college project that stands out.** SpendWise is a modern, AI-powered financial assistant for students. Instead of a basic CRUD expense app, it leverages Google Gemini, speech synthesis, and OCR bill scanning to analyze, predict, and optimize your personal budget.

---

## 💡 Project Overview
In college, managing a tight budget can be tough. SpendWise is designed to make expense tracking intuitive, intelligent, and hands-free. Using Google's state-of-the-art **Gemini API**, this application acts as a personal financial advisor that remembers your spending habits and helps you stay on track.

---

## 🚀 Key Features

### 1. 📊 AI Category Analysis
*   **Impulse Spend Checker**: Detects your highest spending categories (like Food, Entertainment, or Transit).
*   **Comparative Insights**: Compares this month's spending patterns directly against last month's baselines to highlight fluctuations.

### 2. 🔮 Monthly Prediction System
*   **Month-End Forecaster**: Automatically predicts your final monthly expenditure based on your daily spending velocity.
*   **Overspending Alert**: Warns you early if your current spending trajectory is likely to breach your monthly limit.

### 3. 💡 Savings Advisor Agent
*   **Personalized Tips**: Provides clear, actionable, context-aware suggestions to optimize your monthly pocket money.
*   **Smart Budgets**: Helps you allocate limits to categories that are draining your funds.

### 4. 🧠 Memory Bank
*   **User Preference Storage**: Remembers your recurring transactions, monthly goals, and favorite spending hotspots so you don't have to keep re-entering them.

### 5. 📷 OCR Receipt Scanner
*   **Bill Auto-Fill**: Upload any grocery receipt or bill. The integrated Gemini Vision API automatically extracts the **amount**, **date**, **merchant**, and **category** in seconds.

### 6. 🎙️ Voice Expense Entry
*   **Spoken Inputs**: Tap the mic and say: *"Spent 250 rupees for pizza yesterday"* or *"Paid 500 for books today"*. The AI parses, formats, and records the expense hands-free.

---

## 🛠️ Tech Stack

*   **Frontend**: React.js, Tailwind CSS, Recharts (for dynamic area charts)
*   **Backend**: Python FastAPI (Flask fallback), SQLite / Firebase / MongoDB integration
*   **AI Models**: Google Gemini 1.5 Flash API (Multimodal Vision & Text)
*   **OCR System**: Tesseract OCR & Gemini Vision API

---

## 🗂️ Minimal & Clean Folder Structure

We keep our repository clean, organized, and modular so that it is exceptionally easy for evaluators to grade:

```text
smart-ai-expense-tracker/
├── backend/                   # Python REST API Server
│   ├── agents/                # AI Agent Layer (Analysis, Prediction, Voice, OCR, Memory)
│   ├── database/              # Database initialization
│   ├── utils/                 # Gemini API configurations
│   └── app.py                 # Core server routes & APIs
├── frontend/                  # React.js SPA User Interface
│   ├── src/
│   │   ├── components/        # UI components (AI Advisor Tab, Glassmorphic Panels)
│   │   ├── pages/             # Dashboard, Login, and Landing pages
│   │   └── main.tsx           # React entry point
│   ├── package.json           # Frontend Node.js dependencies
│   └── vite.config.ts         # Vite build configuration
├── screenshots/               # Application UI demo screenshots
│   └── readme.txt             # Placeholder instructions
├── .gitignore                 # Safe folder exclusion list (excludes venv & node_modules)
├── README.md                  # Beautiful repository documentation
└── requirements.txt           # Python backend dependencies
```

---

## 💻 Easy Setup & Installation

Follow these simple steps to run the project locally on your machine:

### Step 1: Clone the Repository
```bash
git clone https://github.com/YOUR_USERNAME/smart-ai-expense-tracker.git
cd smart-ai-expense-tracker
```

### Step 2: Setup the Backend
1. Open a terminal and navigate to the root directory.
2. Initialize and activate a Python virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   venv\Scripts\activate
   # On Mac/Linux:
   source venv/bin/activate
   ```
3. Install the required Python packages:
   ```bash
   pip install -r requirements.txt
   ```
4. Create a `.env` file inside the `backend/` folder and add your Gemini API key:
   ```env
   GEMINI_API_KEY=your_gemini_api_key_here
   JWT_SECRET=your_jwt_signing_token_here
   ```

### Step 3: Setup the Frontend
1. Open a new terminal window and navigate to the frontend folder:
   ```bash
   cd frontend
   ```
2. Install the Node packages:
   ```bash
   npm install
   ```

### Step 4: Run the Application
1. **Start the backend server**:
   ```bash
   cd backend
   python app.py
   ```
2. Open your browser and navigate to **`http://localhost:5001`** to experience the fully compiled app!

---

## 📷 Screenshots

*Here is what the modern, glassmorphic SpendWise application interface looks like:*

| 📊 Student Dashboard | 🧠 AI Insights Hub |
| --- | --- |
| ![Dashboard](screenshots/dashboard.png) | ![AI Advisor](screenshots/ai_insights.png) |

*(Place your active screenshots directly inside the `screenshots/` directory to display them here!)*

---

## 🔮 Future Scope

*   **P2P Student Splits**: Share grocery or flat bills directly with flatmates using built-in splitting math.
*   **Predictive Bill Alerts**: Instant notifications two days before recurring payments (like mobile recharges or Wi-Fi bills) are due.
*   **Gamified Goals**: Unlock virtual badges and streaks for staying within your budget.

---

## 🤝 Contribution

Contributions, issues, and feature requests are welcome! Feel free to check the issues page if you want to contribute.

---

## 📄 License

Distributed under the MIT License. See `LICENSE` for more details.

---

## 🌟 Conclusion

SpendWise demonstrates that expense tracking doesn't have to be tedious. By using **agentic AI**, **voice recognition**, and **OCR scanners**, it streamlines personal budgeting while providing college students with a portfolio-worthy, hackathon-ready project. 

Developed as a first-year college project to merge artificial intelligence with daily utility. 🚀
