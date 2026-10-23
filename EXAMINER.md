# Examiner Guide — Operation Cookie Heist

**Timebox:** 30 minutes. **Maximum:** 30 marks. This is a skills assessment, not a production application.

## Assessment sequence

| Minute | Examiner action |
|---|---|
| 0–3 | Ask student to explain cookie-parser, JWT sign/verify, and middleware order |
| 3–10 | Watch login implementation; ask why role from JSON is discarded |
| 10–18 | Watch authentication; test missing and tampered cookies |
| 18–24 | Watch admin gate; try user with role=admin query |
| 24–27 | Watch cookie clearing |
| 27–30 | Ask 2 live conceptual questions, run npm test, score |

## Detailed marking

**1. Login — 8 marks:** validates credentials (2), HTTP 401 for wrong credentials (1), signs id+role from server account and 15m expiry (2), correct HttpOnly/SameSite/secure-policy/path/maxAge cookie (2), clean response with no leaked token/password (1).

**2. Authentication — 9 marks:** reads cookie instead of header/body (2), missing cookie 401 (1), verifies token cryptographically and checks expiration (2), handles bad/expired token as 401 without throwing server errors (1), checks known account (1), attaches safe server-side user and calls next (2).

**3. Authorization — 7 marks:** gate based on req.user.role and 403 on nonadmin (3), admin reaches endpoint (2), distinguishes authentication vs authorization/middleware order (2).

**4. Logout — 4 marks:** clearing named cookie correctly with compatible options (3), 200 message (1).

**5. Explanation — 2 marks:** can clearly explain JWT signature vs encryption (1), explains at least one security tradeoff involving HttpOnly, SameSite, token theft or cookie invalidation (1).

## Rapid adversarial prompts and expected ideas

**Q: Nova sends role=admin with login.** Server ignores the client-supplied value and uses the account's actual role.

**Q: What if the token payload is edited to role=admin?** Editing invalidates signature. Signature verification must precede access. The starter also resolves authorization role from server USERS to resist stale/inconsistent claims.

**Q: Why not jwt.decode()?** Decoding doesn't verify integrity, authenticity, or expiry.

**Q: 401 vs 403?** 401: unauthenticated/invalid session. 403: authenticated but insufficient permissions.

**Q: Can JavaScript steal an HttpOnly cookie with document.cookie?** No, but XSS can still issue authenticated requests; HttpOnly is not a universal XSS cure.

**Q: Does clearing a cookie destroy a signed token?** No. A copied token remains usable until expiration absent server-side revocation.

**Q: Why SameSite Strict?** Reduces cross-site cookie transmission; is not a complete CSRF strategy for every deployment. Cross-site frontend deployments need carefully configured SameSite=None; Secure, credentials, CORS, and CSRF considerations.

**Q: Is JWT private data safe inside payload?** No; normal signed JWT payloads are base64url encoded, not encrypted.

**Q: What changes in production?** Hashed passwords, secure secrets/configuration, HTTPS, database, rate limiting, CSRF considerations, tests, secure session lifecycle and revocation if needed.

## Acceptance criteria

Run **npm test**. Behavior tests are written for the provided contract; all should pass after correct implementation. Observe the candidate code and ask for a live explanation to distinguish comprehension from copying.

### Instructor note

Do not reveal an implementation before the attempt. You can ask students to implement just **requireAuth** first if time is nearly exhausted. Avoid awarding full marks based solely on a green test run.
