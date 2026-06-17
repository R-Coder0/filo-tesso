# Automatic Instagram Feed

The storefront reads Instagram posts from the backend route:

```text
GET /api/instagram/posts
```

The backend then calls Meta Graph API in this format:

```text
https://graph.instagram.com/v20.0/{instagram_user_id}/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token={token}
```

## Backend environment

Add these values to `backend/.env` locally and to the deployed backend
environment in production:

```env
INSTAGRAM_ACCESS_TOKEN=your_meta_graph_api_access_token
INSTAGRAM_APP_SECRET=your_meta_app_secret_if_app_secret_proof_is_required
INSTAGRAM_BUSINESS_ACCOUNT_ID=your_instagram_business_or_creator_account_id
INSTAGRAM_USERNAME=filoteso.co.in
INSTAGRAM_GRAPH_BASE_URL=https://graph.instagram.com
INSTAGRAM_API_VERSION=v20.0
INSTAGRAM_MAX_POSTS=12
INSTAGRAM_CACHE_TTL_MS=900000
```

`INSTAGRAM_USER_ID` and `INSTAGRAM_IG_USER_ID` are also supported aliases for
`INSTAGRAM_BUSINESS_ACCOUNT_ID`.

`INSTAGRAM_APP_SECRET` is optional for normal media fetches. Add it only on the
backend if your Meta app has app-secret-proof enforcement enabled. The backend
will automatically send `appsecret_proof` when this secret is present.

Use `https://graph.instagram.com` for tokens generated with Instagram Login. Use
`https://graph.facebook.com` only if you intentionally use a Facebook Graph API
token/Page-connected Instagram Graph API setup.

After changing backend env variables, restart the Express server. Node does not
reload `.env` automatically.

## Frontend environment

The React app uses `VITE_API_URL` to reach the backend.

Development:

```env
VITE_API_URL=http://localhost:5000
```

Production:

```env
VITE_API_URL=https://actual-backend-domain.com
```

Do not build production frontend with `VITE_API_URL=http://localhost:5000`.
Browser users would then call their own computer instead of your backend.

## Manual token tests

Run these from a terminal after replacing the values. Do not commit or share the
token.

Check the backend route:

```bash
curl -i http://localhost:5000/api/instagram/posts
```

Check the Graph API media endpoint directly:

```bash
curl -i "https://graph.facebook.com/v20.0/<IG_USER_ID>/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=<ACCESS_TOKEN>"
```

For Instagram Login tokens, use:

```bash
curl -i "https://graph.instagram.com/v20.0/<IG_USER_ID>/media?fields=id,caption,media_type,media_url,permalink,thumbnail_url,timestamp&access_token=<ACCESS_TOKEN>"
```

Check token metadata:

```bash
curl -i "https://graph.facebook.com/debug_token?input_token=<ACCESS_TOKEN>&access_token=<APP_ID>|<APP_SECRET>"
```

Common bad-token symptoms:

- `OAuthException`: token is expired, invalid, revoked, or for the wrong app.
- `Unsupported get request`: the Instagram user ID is wrong or inaccessible to
  this token.
- `API access blocked`: Meta has blocked or restricted the app/API access; check
  Meta Developer Dashboard, App Review, account quality, and permissions.

The backend returns Meta's original error message in JSON so DevTools/Postman can
show the real cause.
