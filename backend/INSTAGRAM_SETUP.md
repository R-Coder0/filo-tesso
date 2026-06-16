meta # Automatic Instagram Feed

The storefront reads Instagram posts from:

```text
GET /api/instagram/posts
```

## One-time Meta setup

1. Create a Meta app and add **Instagram API with Instagram Login**.
2. Connect the `filoteso.co.in` professional Instagram account.
3. Generate a long-lived Instagram user access token with the
   `instagram_business_basic` permission.
4. Add these values to the deployed backend environment:

```env
INSTAGRAM_ACCESS_TOKEN=your_long_lived_token
INSTAGRAM_USER_ID=your_instagram_professional_account_id
INSTAGRAM_API_VERSION=v25.0
INSTAGRAM_MAX_POSTS=0
INSTAGRAM_CACHE_TTL_MS=900000
```

`INSTAGRAM_USER_ID` is optional because the backend can resolve it using
`/me`, but setting it avoids an extra request.

`INSTAGRAM_MAX_POSTS=0` loads every post through API pagination. Set a positive
number to limit the feed when the account becomes very large.

Long-lived tokens are valid for 60 days. Refresh the token before it expires
through Meta's `refresh_access_token` endpoint and update the deployed secret.

Do not put the access token in the frontend or commit it to Git.
