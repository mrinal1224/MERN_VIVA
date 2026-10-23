# MERN VIVA — Operation Cookie Heist 🍪

## 30-Minute Coding Challenge: The Secret Vault

**Duration:** 30 minutes · **Marks:** 30 · **Level:** Intermediate · **Core:** Express, JWT, Cookies, Authentication, Authorization

> You have joined the backend team of a top-secret digital vault. The previous engineer accidentally left the door open. Your job is to secure the vault before the attacker walks in.

### The story

There are two employees:
- **Agent Nova** — normal user, allowed to see their own classified profile.
- **Commander Cipher** — admin, allowed to unlock the **OMEGA** vault.

The frontend sends login credentials; the backend must return a JWT in a browser cookie. A malicious client may send a fake role, tamper with the cookie, omit it, or log out and retry. **Trust verified JWT claims, never untrusted request fields.**

This is a **backend-focused MERN viva**. The React/browser interaction is explained, but building UI, MongoDB models, signup, password hashing, refresh tokens, and deployment are **out of scope**.

## Your mission

Complete the TODOs in **starter/app.js**. Do **not** change the supplied users, routes, tests, or package configuration.

| Time | Task | Marks |
|---|---|---:|
| 0–3 min | Inspect starter & run server | — |
| 3–10 min | Implement login and JWT cookie | 8 |
| 10–18 min | Implement cookie authentication middleware | 9 |
| 18–24 min | Implement admin authorization / protect OMEGA | 7 |
| 24–27 min | Implement logout | 4 |
| 27–30 min | Demonstrate and explain | 2 |
| **Total** | | **30** |

### Step 1 — Login: POST /auth/login (8 marks)

Accept JSON:

~~~json
{ "email": "nova@vault.test", "password": "nova123", "role": "admin" }
~~~

Requirements:

1. Find the account by **email and password** from the supplied in-memory USERS array. The extra role field is malicious and **must be ignored**.
2. If credentials are wrong, return HTTP **401** and JSON: **{"message":"Invalid credentials"}**. Do not set a cookie.
3. If credentials are correct, sign a JWT using **jsonwebtoken**, the server-side **JWT_SECRET**, and **expiresIn: "15m"**.
4. JWT payload must contain **only** the account's **id** and **role** obtained from USERS (no password, no client-supplied role).
5. Set a cookie named **vault_token** using **res.cookie** with: **httpOnly: true**, **sameSite: "strict"**, **secure: production only**, **maxAge: 900000**, **path: "/"**.
6. Respond HTTP **200** and JSON with **message: "Login successful"**. Do not return the raw JWT in the response JSON.

### Step 2 — Authentication middleware: requireAuth (9 marks)

The middleware guards **GET /auth/me** and **GET /vault/omega**.

1. Read the JWT **only** from **req.cookies.vault_token** (cookie-parser is already installed and wired).
2. Missing cookie: HTTP **401**, JSON **{"message":"Authentication required"}**.
3. Verify signature and expiration with **jwt.verify(token, JWT_SECRET)**. Do **not** use jwt.decode as an authentication check.
4. Invalid, malformed, tampered or expired token: HTTP **401**, JSON **{"message":"Invalid or expired token"}**.
5. For a valid token, look up the user by the signed **id** from USERS; if missing, return **401** with **{"message":"Invalid or expired token"}**.
6. Attach a **safe user object** to **req.user** containing exactly **id**, **email**, and **role** from the server-side USERS record. Never attach or return the password.
7. Call next() only when authenticated.

**GET /auth/me** is prewritten; it should return the safe user object once the middleware works.

### Step 3 — Authorization: adminOnly (7 marks)

**GET /vault/omega** is accessible **only to admins**.

1. Implement **adminOnly**. A logged-in non-admin gets HTTP **403**: **{"message":"Admin access required"}**.
2. An authenticated admin gets HTTP **200**: **{"message":"OMEGA vault unlocked","secret":"THE-EAGLE-HAS-LANDED"}**.
3. Use **req.user.role**, not **req.body.role**, **req.query.role**, arbitrary headers, or an unverified decoded JWT.
4. Ensure middleware order on this route is **requireAuth → adminOnly → handler**.

### Step 4 — Logout: POST /auth/logout (4 marks)

Clear the **vault_token** cookie using **res.clearCookie** and cookie attributes matching its scope (**path: "/"**, **sameSite: "strict"**, **secure in production**, **httpOnly**). Return HTTP **200** with **{"message":"Logged out"}**. After the browser accepts the clearing cookie, a subsequent request without the token must receive **401**.

**Important distinction:** clearing a cookie removes the browser's stored credential. It **does not revoke** already-copied JWTs; server-side denylisting or short lifetimes would be needed for early revocation. You do not need to implement that.

### Bonus viva traps (oral only; no extra code)

- The attacker sends **role: "admin"** when logging in as Nova. Why must they still be a user?
- Why is **jwt.decode** insufficient for authorization?
- A user changes one character in the signed cookie. What should happen?
- Is a JWT encrypted? Could someone read its payload?
- Does **httpOnly** stop CSRF? What is **sameSite** doing?
- If the frontend uses fetch on a different origin, what must change for cookies to be sent? (Think credentials, server CORS allowlist, HTTPS and SameSite policies.)
- If someone steals a JWT before logout, is it invalidated by res.clearCookie?
- Why is **403** different from **401**?

## Provided accounts

| Person | Email | Password | Role |
|---|---|---|---|
| Agent Nova | nova@vault.test | nova123 | user |
| Commander Cipher | cipher@vault.test | cipher123 | admin |

**These are synthetic viva-only accounts.** Production applications must hash passwords and use a database.

## Setup

Requires Node.js **18+**.

~~~bash
npm install
cp .env.example .env
npm start
~~~

Server: **http://localhost:3000**. Edit **.env** to use a strong local JWT_SECRET before running.

Run the checks in another terminal:

~~~bash
npm test
~~~

Tests are provided as observable behavior checks. **Do not edit tests.** Some checks will fail until you implement the TODOs.

## Quick manual demonstration (curl)

**Important:** The **-c** option stores a cookie; **-b** sends it. A cookie from one terminal command isn't automatically carried into the next.

~~~bash
# 1. Login as Agent Nova; ignore malicious role=admin
curl -i -c cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"nova@vault.test","password":"nova123","role":"admin"}' \
  http://localhost:3000/auth/login

# 2. Signed-in profile: 200, role=user, no password
curl -i -b cookies.txt http://localhost:3000/auth/me

# 3. Try opening admin vault as Nova: 403
curl -i -b cookies.txt http://localhost:3000/vault/omega

# 4. Switch to admin
curl -i -c admin-cookies.txt -H "Content-Type: application/json" \
  -d '{"email":"cipher@vault.test","password":"cipher123"}' \
  http://localhost:3000/auth/login

# 5. Open vault as admin: 200
curl -i -b admin-cookies.txt http://localhost:3000/vault/omega

# 6. Logout and update the admin cookie jar
curl -i -b admin-cookies.txt -c admin-cookies.txt -X POST \
  http://localhost:3000/auth/logout

# 7. Admin cookie cleared; access denied: 401
curl -i -b admin-cookies.txt http://localhost:3000/vault/omega
~~~

## Expected behavior matrix

| Case | Endpoint | Expected |
|---|---|---|
| Correct Nova credentials | POST /auth/login | 200 + HttpOnly JWT cookie |
| Incorrect password | POST /auth/login | 401, no cookie |
| Nova sends role=admin in JSON | POST /auth/login | JWT role stays user |
| No cookie | GET /auth/me | 401 |
| Valid Nova cookie | GET /auth/me | 200, safe profile |
| Invalid or expired token | GET /auth/me | 401 |
| Nova opens OMEGA | GET /vault/omega | 403 |
| Cipher opens OMEGA | GET /vault/omega | 200 + secret |
| Cookie cleared via logout | POST /auth/logout | 200 + clearing Set-Cookie |
| New request without cookie | GET /vault/omega | 401 |

## Allowed libraries

Use installed **express**, **cookie-parser**, **jsonwebtoken**, and **dotenv**. The tests use **supertest**. No bcrypt or MongoDB is necessary.

## Submission and evaluation

Show the examiner a successful login, a denied normal-user admin request, a successful admin request, and logout. Explain **one** security decision. Code correctness matters more than styling. If a test fails, explain what you would fix.

**Do not** hardcode a JWT, use a bearer header instead of the required cookie, trust the submitted role, disable token verification, leak passwords, or weaken tests.

**Examiner:** See **EXAMINER.md** for the scoring rubric and adversarial viva prompts.
