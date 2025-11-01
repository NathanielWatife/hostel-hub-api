# hostel-hub-api

## Admin bootstrap endpoint (optional)

As a safe alternative to the CLI script, you can enable a one-time HTTP endpoint to create the very first admin account. This route is disabled by default and guarded by an environment flag.

- Env flag: set `ENABLE_ADMIN_BOOTSTRAP=true`
- Route: `POST /api/auth/bootstrap-admin` (also available at `/auth/bootstrap-admin`)
- Body JSON: `{ "email": "admin@example.com", "fullName": "Admin Name", "password": "StrongPass123!" }`
- Behavior:
	- Only works when no admin exists yet. If an admin already exists, it returns 409.
	- If a user already exists with the provided email, that user is promoted to `admin` and their password is updated.

Example (optional):

```bash
curl -X POST \
	-H 'Content-Type: application/json' \
	-d '{"email":"admin@example.com","fullName":"Admin","password":"StrongPass123!"}' \
	https://your-api-host/api/auth/bootstrap-admin
```

Remember to unset `ENABLE_ADMIN_BOOTSTRAP` (or restart without it) after bootstrapping to keep the endpoint disabled.