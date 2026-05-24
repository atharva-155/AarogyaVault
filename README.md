# AarogyaVault — Digital Emergency Medical Identity System

A government-grade platform for India where citizens register their medical profiles so emergency responders can instantly access critical health data.

---

## Tech Stack
- **Frontend**: React 18 + React Router
- **Backend**: Flask (Python)
- **Database**: PostgreSQL

---

## Project Structure

```
aarogyavault/
├── backend/
│   ├── app.py              # Flask API
│   ├── requirements.txt
│   └── .env.example
└── frontend/
    ├── public/
    │   └── index.html
    ├── src/
    │   ├── App.js
    │   ├── index.js
    │   ├── components/
    │   │   ├── Navbar.js / Navbar.css
    │   │   └── PatientCard.js
    │   ├── pages/
    │   │   ├── Home.js / Home.css
    │   │   ├── CitizenRegister.js
    │   │   ├── AgentLogin.js
    │   │   ├── AgentRegister.js
    │   │   ├── AgentDashboard.js
    │   │   └── EmergencyLookup.js
    │   └── styles/
    │       └── global.css
    └── package.json
```

---

## Setup & Run

### 1. Database Setup
```bash
psql -U postgres
CREATE DATABASE aarogyavault;
\q
```

### 2. Backend Setup
```bash
cd backend
python -m venv venv
source venv/bin/activate        # Windows: venv\Scripts\activate
pip install -r requirements.txt

cp .env.example .env
# Edit .env with your DATABASE_URL if needed

python app.py
# Runs on http://localhost:5000
# Auto-creates tables and seeds 6 citizens + 2 agents
```

### 3. Frontend Setup
```bash
cd frontend
npm install
npm start
# Runs on http://localhost:3000
# Proxy to backend already configured in package.json
```

---

## Demo Credentials

**Agent Login:**
| Employee ID   | Password   | Department                |
|---------------|------------|---------------------------|
| GOV-IND-001   | agent123   | District Hospital Indore  |
| GOV-BPL-002   | agent123   | PHC Bhopal                |

**Test Aadhaar Numbers (for Emergency Lookup):**
| Aadhaar       | Patient        |
|---------------|----------------|
| 234567890123  | Rahul Sharma   |
| 345678901234  | Meera Joshi    |
| 456789012345  | Arjun Patel    |
| 567890123456  | Sunita Verma   |
| 678901234567  | Deepak Yadav   |
| 789012345678  | Priya Nair     |

---

## API Endpoints

| Method | Route | Auth | Description |
|--------|-------|------|-------------|
| GET | /api/stats | None | Homepage stats |
| POST | /api/citizen/register | None | Register citizen |
| POST | /api/agent/register | None | Register agent |
| POST | /api/agent/login | None | Agent login → JWT |
| GET | /api/citizen/lookup?aadhaar=XXX | JWT | Agent lookup by Aadhaar |
| GET | /api/citizen/lookup?name=XXX | JWT | Agent lookup by name |
| GET | /api/citizen/lookup/public?aadhaar=XXX | None | Public demo lookup |
| GET | /api/citizens/all | None | All citizens (demo) |
| POST | /api/lookup/log | JWT | Log emergency lookup |
| GET | /api/lookups/recent | JWT | Recent lookups by agent |

---

## Pages

| Route | Description |
|-------|-------------|
| / | Landing page with stats |
| /register/citizen | Self-registration form |
| /agent/login | Agent authentication |
| /agent/register | New agent signup |
| /agent/dashboard | Protected: register patients + emergency lookup |
| /emergency-lookup | Public demo lookup by Aadhaar |

---

## Security Notes
- Aadhaar numbers are **never stored in plain text** — SHA-256 hashed
- Agent passwords are **bcrypt hashed**
- JWT tokens expire after **8 hours**
- In production: `/api/citizens/all` and public lookup should require authentication
