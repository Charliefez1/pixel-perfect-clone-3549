

## Adding n8n OAuth Redirect URL

**What you need:** The URL `https://oauth.n8n.cloud/oauth2/callback` needs to be added as an **Allowed Redirect URI** in the Lovable Cloud auth configuration so that n8n can complete its OAuth flow (for Gmail/Google Calendar credentials) through your project.

**The issue:** This is a backend auth configuration change, not a code change. The redirect URL needs to be added to the authentication settings so Supabase allows redirects to n8n's callback URL.

### Plan

1. **Add the redirect URL to auth configuration** — Update the `supabase/config.toml` to include `https://oauth.n8n.cloud/oauth2/callback` in the `additional_redirect_urls` under `[auth]` settings. This tells the auth system to allow OAuth redirects to n8n's callback endpoint.

That's the only change needed. Once configured, n8n's OAuth credential nodes (Gmail, Google Calendar) will be able to complete the authorization flow through your project's auth system.

### File changes

- `supabase/config.toml` — Add auth redirect URL configuration:
```toml
[auth]
additional_redirect_urls = ["https://oauth.n8n.cloud/oauth2/callback"]
```

**Note:** However, if n8n is using its own OAuth credentials to connect to Google APIs (Gmail/Calendar) independently — meaning n8n handles the Google OAuth flow itself and just writes data to your database — then you do **not** need to configure anything in your project. The redirect URL `https://oauth.n8n.cloud/oauth2/callback` would go in the **Google Cloud Console** under your OAuth client's Authorized Redirect URIs, not in your Lovable project. 

This is the more likely scenario since n8n manages its own credential store. Could you confirm: is n8n authenticating against **your project's auth**, or against **Google APIs directly**?

