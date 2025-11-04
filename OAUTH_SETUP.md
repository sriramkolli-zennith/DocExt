# OAuth Setup Guide - Google & GitHub

## Overview
Your application now supports authentication via:
- ✅ Email/Password (built-in)
- ✅ Google OAuth
- ✅ GitHub OAuth

## Setup Instructions

### 1. Add Redirect URLs in Supabase

1. Go to: https://supabase.com/dashboard/project/lputifqvrradmfedheov/auth/url-configuration
2. Add these URLs to **Redirect URLs**:
   ```
   http://localhost:3000/auth/callback
   http://localhost:3000/dashboard
   ```
3. Click **Save**

---

### 2. Enable Google OAuth

#### A. Create Google OAuth Credentials

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Create a new project or select existing one
3. Navigate to **APIs & Services** → **Credentials**
4. Click **Create Credentials** → **OAuth client ID**
5. Select **Web application**
6. Add **Authorized redirect URIs**:
   ```
   https://lputifqvrradmfedheov.supabase.co/auth/v1/callback
   ```
7. Click **Create**
8. Copy the **Client ID** and **Client Secret**

#### B. Configure in Supabase

1. Go to: https://supabase.com/dashboard/project/lputifqvrradmfedheov/auth/providers
2. Find **Google** provider
3. **Enable** it (toggle ON)
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save**

---

### 3. Enable GitHub OAuth

#### A. Create GitHub OAuth App

1. Go to [GitHub Developer Settings](https://github.com/settings/developers)
2. Click **New OAuth App**
3. Fill in:
   - **Application name**: DocExtract (or your app name)
   - **Homepage URL**: `http://localhost:3000` (for dev) or your production URL
   - **Authorization callback URL**: 
     ```
     https://lputifqvrradmfedheov.supabase.co/auth/v1/callback
     ```
4. Click **Register application**
5. Click **Generate a new client secret**
6. Copy the **Client ID** and **Client Secret**

#### B. Configure in Supabase

1. Go to: https://supabase.com/dashboard/project/lputifqvrradmfedheov/auth/providers
2. Find **GitHub** provider
3. **Enable** it (toggle ON)
4. Paste your **Client ID**
5. Paste your **Client Secret**
6. Click **Save**

---

## Testing

### Test the Setup

1. Start your development server:
   ```bash
   npm run dev
   ```

2. Go to http://localhost:3000/auth/sign-up

3. You should see three options:
   - Email/Password form
   - **Google** button
   - **GitHub** button

4. Click on **Google** or **GitHub** button:
   - You'll be redirected to the OAuth provider
   - Authorize the application
   - You'll be redirected back to `/auth/callback`
   - Then automatically to `/dashboard`

### Troubleshooting

**"Invalid redirect URL" error:**
- Make sure you added `http://localhost:3000/auth/callback` to Supabase Redirect URLs
- Check that the OAuth callback URL in Google/GitHub matches Supabase exactly

**"OAuth provider not enabled" error:**
- Go to Supabase Auth Providers
- Make sure Google/GitHub is toggled ON
- Verify Client ID and Secret are correctly entered

**Stuck on callback page:**
- Check browser console for errors
- Verify the callback route exists at `/app/auth/callback/route.ts`
- Check middleware is allowing the callback route

---

## Production Deployment

When deploying to production:

1. **Update Google OAuth**:
   - Add production redirect URI: `https://yourdomain.com/auth/callback`
   - Add to authorized JavaScript origins: `https://yourdomain.com`

2. **Update GitHub OAuth**:
   - Create a separate OAuth app for production (recommended)
   - Set callback URL: `https://lputifqvrradmfedheov.supabase.co/auth/v1/callback`
   - Set homepage: `https://yourdomain.com`

3. **Update Supabase Redirect URLs**:
   - Add: `https://yourdomain.com/auth/callback`
   - Add: `https://yourdomain.com/dashboard`

4. **Update Environment Variables**:
   - Set `NEXT_PUBLIC_DEV_SUPABASE_REDIRECT_URL=https://yourdomain.com/auth/callback`

---

## Security Notes

- ✅ OAuth tokens are stored securely in HTTP-only cookies by Supabase
- ✅ Client secrets should NEVER be committed to version control
- ✅ Use different OAuth apps for development and production
- ✅ Regularly rotate OAuth credentials
- ✅ Monitor OAuth usage in Google/GitHub dashboards

---

## What's Next?

After setting up OAuth:
1. Deploy your edge functions (see previous guides)
2. Test the complete authentication flow
3. Add user profile information from OAuth providers if needed
4. Set up proper error handling and user feedback
