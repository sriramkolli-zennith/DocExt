# Email Authentication Setup Guide

## Issue
Not receiving confirmation emails after sign-up.

## Solutions

### Option 1: Disable Email Confirmation (Recommended for Development)

1. Go to Supabase Dashboard: https://supabase.com/dashboard/project/lputifqvrradmfedheov
2. Navigate to **Authentication** → **Providers** → **Email**
3. Find **"Confirm email"** setting
4. **Disable it** (toggle off)
5. Click **Save**

**Result:** Users can sign up and login immediately without email confirmation.

---

### Option 2: Configure Email Provider (For Production)

If you want email confirmations to work:

#### Using Supabase's Built-in Email Service (Limited)
1. Go to **Authentication** → **Settings** → **Email Auth**
2. Ensure "Enable email confirmations" is ON
3. Supabase will send emails from their domain (limited to a few emails per hour)

#### Using Custom SMTP Provider (Recommended for Production)
1. Go to **Authentication** → **Settings** → **Email Auth**
2. Scroll to **SMTP Settings**
3. Enable **"Enable Custom SMTP"**
4. Configure your email provider:
   - **Gmail:** Use app-specific password
   - **SendGrid:** Use API key
   - **AWS SES:** Use SMTP credentials
   - **Mailgun:** Use SMTP credentials

Example Gmail SMTP Settings:
```
Host: smtp.gmail.com
Port: 587
Username: your-email@gmail.com
Password: your-app-specific-password
Sender Email: your-email@gmail.com
Sender Name: DocExtract
```

5. Click **Save**

---

### Option 3: Add Redirect URLs

**IMPORTANT:** You must add your redirect URLs to Supabase:

1. Go to **Authentication** → **URL Configuration**
2. Add these to **Redirect URLs**:
   - `http://localhost:3000/auth/confirm`
   - `http://localhost:3000/dashboard`
   - Your production URL when deployed (e.g., `https://yourdomain.com/auth/confirm`)
3. Click **Save**

---

## Code Changes Made

✅ **Updated sign-up page** to handle both scenarios:
   - If email confirmation is disabled: redirects to dashboard
   - If email confirmation is enabled: redirects to success page

✅ **Created confirmation page** (`/auth/confirm`) to handle email verification links

✅ **Updated redirect URL** in `.env.local` to point to confirmation page

---

## Testing

### Test with Email Confirmation Disabled:
1. Disable email confirmation in Supabase dashboard
2. Run `npm run dev`
3. Go to http://localhost:3000/auth/sign-up
4. Sign up with email and password
5. Should redirect to dashboard immediately

### Test with Email Confirmation Enabled:
1. Enable email confirmation in Supabase dashboard
2. Configure email provider (SMTP or use built-in)
3. Add redirect URLs to Supabase
4. Run `npm run dev`
5. Sign up with email and password
6. Check email for confirmation link
7. Click link → should redirect to `/auth/confirm` → then to dashboard

---

## Recommended Approach

**For Development:**
- Disable email confirmation
- Users can sign up and test immediately

**For Production:**
- Enable email confirmation
- Configure custom SMTP provider (SendGrid/Mailgun recommended)
- Add production URLs to redirect list
- Test thoroughly before deploying
