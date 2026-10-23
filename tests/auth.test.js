const { test, before } = require("node:test");
const assert = require("node:assert/strict");
const request = require("supertest");
const jwt = require("jsonwebtoken");

process.env.JWT_SECRET = "exam-only-testing-secret-not-for-production";
process.env.NODE_ENV = "test";
const app = require("../starter/app");

const cookie = (token) => "vault_token=" + token;
const sign = (payload, options = {}) =>
  jwt.sign(payload, process.env.JWT_SECRET, options);

async function login(email, password, extra = {}) {
  return request(app).post("/auth/login").send({ email, password, ...extra });
}

test("wrong credentials return 401 without Set-Cookie", async () => {
  const res = await login("nova@vault.test", "wrong");
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { message: "Invalid credentials" });
  assert.equal(res.headers["set-cookie"], undefined);
});

test("login issues secured 15m JWT cookie, ignores injected role", async () => {
  const res = await login("nova@vault.test", "nova123", { role: "admin" });
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { message: "Login successful" });
  const cookies = res.headers["set-cookie"] || [];
  const selected = cookies.find((v) => v.startsWith("vault_token="));
  assert.ok(selected, "vault_token cookie missing");
  assert.match(selected, /HttpOnly/i);
  assert.match(selected, /SameSite=Strict/i);
  assert.match(selected, /Path=\//i);
  assert.match(selected, /Max-Age=900\b/i);
  assert.doesNotMatch(selected, /;\s*Secure\b/i); // test env
  const token = selected.split(";")[0].slice("vault_token=".length);
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  assert.equal(decoded.id, "agent-01");
  assert.equal(decoded.role, "user");
  assert.equal(decoded.password, undefined);
  assert.equal(decoded.email, undefined);
  assert.ok(decoded.exp - decoded.iat <= 900 && decoded.exp - decoded.iat >= 899);
});

test("me rejects missing cookie", async () => {
  const res = await request(app).get("/auth/me");
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { message: "Authentication required" });
});

test("me returns safe server-side profile for valid cookie", async () => {
  const res = await request(app).get("/auth/me")
    .set("Cookie", cookie(sign({ id: "agent-01", role: "user" })));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    user: { id: "agent-01", email: "nova@vault.test", role: "user" },
  });
});

test("me rejects tampered or expired cookies", async () => {
  const valid = sign({ id: "agent-01", role: "user" });
  const tampered = valid.slice(0, -1) + (valid.endsWith("x") ? "y" : "x");
  const expired = sign({ id: "agent-01", role: "user" }, { expiresIn: -1 });
  for (const token of [tampered, expired, "not-a-jwt"]) {
    const res = await request(app).get("/auth/me").set("Cookie", cookie(token));
    assert.equal(res.status, 401);
    assert.deepEqual(res.body, { message: "Invalid or expired token" });
  }
});

test("me rejects deleted/nonexistent account id", async () => {
  const res = await request(app).get("/auth/me")
    .set("Cookie", cookie(sign({ id: "unknown-user", role: "admin" })));
  assert.equal(res.status, 401);
  assert.deepEqual(res.body, { message: "Invalid or expired token" });
});

test("non-admin cannot open vault, even with role query param", async () => {
  const res = await request(app).get("/vault/omega?role=admin")
    .set("Cookie", cookie(sign({ id: "agent-01", role: "user" })));
  assert.equal(res.status, 403);
  assert.deepEqual(res.body, { message: "Admin access required" });
});

test("admin can open OMEGA vault", async () => {
  const res = await request(app).get("/vault/omega")
    .set("Cookie", cookie(sign({ id: "agent-99", role: "admin" })));
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, {
    message: "OMEGA vault unlocked",
    secret: "THE-EAGLE-HAS-LANDED",
  });
});

test("server-side role wins over conflicting signed role claim", async () => {
  const res = await request(app).get("/vault/omega")
    .set("Cookie", cookie(sign({ id: "agent-01", role: "admin" })));
  assert.equal(res.status, 403);
});

test("logout sends clearing cookie with matching scope", async () => {
  const res = await request(app).post("/auth/logout");
  assert.equal(res.status, 200);
  assert.deepEqual(res.body, { message: "Logged out" });
  const selected = (res.headers["set-cookie"] || [])
    .find((v) => v.startsWith("vault_token="));
  assert.ok(selected);
  assert.match(selected, /HttpOnly/i);
  assert.match(selected, /SameSite=Strict/i);
  assert.match(selected, /Path=\//i);
  assert.match(selected, /Expires=Thu, 01 Jan 1970/i);
});
