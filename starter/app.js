const express = require("express");
const cookieParser = require("cookie-parser");
const jwt = require("jsonwebtoken");

const app = express();
app.use(express.json());
app.use(cookieParser());

// Synthetic accounts for this 30-minute viva only.
// Never store plaintext passwords in a real application.
const USERS = [
  { id: "agent-01", email: "nova@vault.test", password: "nova123", role: "user" },
  { id: "agent-99", email: "cipher@vault.test", password: "cipher123", role: "admin" },
];

const COOKIE_NAME = "vault_token";
const TOKEN_AGE_MS = 15 * 60 * 1000;

function getJwtSecret() {
  const secret = process.env.JWT_SECRET;
  if (!secret) throw new Error("JWT_SECRET is required. Set it in .env.");
  return secret;
}

// The same browser cookie scope/options must be used at login and logout.
function cookieOptions() {
  return {
    httpOnly: true,
    sameSite: "strict",
    secure: process.env.NODE_ENV === "production",
    path: "/",
  };
}

// TODO 1: Login (8 marks)
// Match email/password against USERS (do not trust req.body.role).
// Sign a JWT containing id and role with expiry 15m.
// Set vault_token as an HttpOnly cookie with 15m maxAge.
// Return 200 { message: "Login successful" }.
// Wrong credentials: 401 { message: "Invalid credentials" }.
app.post("/auth/login", (req, res) => {
  // YOUR CODE HERE
  return res.status(501).json({ message: "TODO: implement login" });
});

// TODO 2: Verify JWT in a COOKIE (9 marks).
// Missing cookie -> 401 { message: "Authentication required" }.
// Invalid/expired JWT OR unknown user id -> 401
//   { message: "Invalid or expired token" }.
// On success, attach { id, email, role } from USERS to req.user; next().
function requireAuth(req, res, next) {
  // YOUR CODE HERE
  return res.status(501).json({ message: "TODO: implement requireAuth" });
}

// TODO 3: Admin authorization (7 marks).
// req.user.role !== "admin" -> 403 { message: "Admin access required" }.
// Otherwise next().
function adminOnly(req, res, next) {
  // YOUR CODE HERE
  return res.status(501).json({ message: "TODO: implement adminOnly" });
}

app.get("/auth/me", requireAuth, (req, res) => {
  res.status(200).json({ user: req.user });
});

app.get("/vault/omega", requireAuth, adminOnly, (req, res) => {
  res.status(200).json({
    message: "OMEGA vault unlocked",
    secret: "THE-EAGLE-HAS-LANDED",
  });
});

// TODO 4: Logout (4 marks).
// Clear vault_token at the same cookie scope; respond 200
// { message: "Logged out" }. Cookie deletion != JWT revocation.
app.post("/auth/logout", (req, res) => {
  // YOUR CODE HERE
  return res.status(501).json({ message: "TODO: implement logout" });
});

// Exports are used by the behavior tests. Do not alter.
module.exports = app;
