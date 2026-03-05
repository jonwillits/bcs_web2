# 📧 Email Setup Guide - Resend Integration

This guide will help you set up Resend for sending verification and password reset emails.

---

## 🚀 Quick Setup (5 minutes)

### Step 1: Create Resend Account

1. Go to **https://resend.com**
2. Click **"Sign Up"** (it's free!)
3. Sign up with your email or GitHub account
4. Verify your email address

---

### Step 2: Get Your API Key

1. Once logged in, go to **"API Keys"** in the sidebar
2. Click **"Create API Key"**
3. Give it a name: `BCS E-Learning Development`
4. Select permission: **"Full Access"** or **"Sending Access"**
5. Click **"Create"**
6. **Copy the API key** (it will look like: `re_123abc456def...`)
   - ⚠️ **IMPORTANT**: Save this key now! You won't be able to see it again.

---

### Step 3: Add Domain (For Production)

For development, you can skip this and use Resend's test domain. For production:

1. Go to **"Domains"** in Resend dashboard
2. Click **"Add Domain"**
3. Enter your domain (e.g., `bcs-etextbook.com`)
4. Follow DNS setup instructions (add SPF, DKIM records)
5. Wait for verification (usually 5-10 minutes)

**For Development**: Resend provides `onboarding@resend.dev` that you can use immediately!

---

### Step 4: Update Environment Variables

Add these to your `.env` file:

```bash
# Email Configuration (Resend)
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_your_api_key_here"
EMAIL_FROM="onboarding@resend.dev"  # Use this for development
EMAIL_FROM_NAME="BCS E-Learning"
```

**For Production** (add to Vercel Environment Variables):
```bash
EMAIL_PROVIDER="resend"
RESEND_API_KEY="re_your_production_api_key"
EMAIL_FROM="noreply@your-domain.com"  # Use your verified domain
EMAIL_FROM_NAME="BCS E-Learning"
```

---

### Step 5: Restart Your Dev Server

```bash
# Stop current server (Ctrl+C)
npm run dev
```

---

## ✅ Testing Email Sending

### Test 1: Register a New User

1. Go to: `http://localhost:3000/auth/register`
2. Fill in the registration form with **your real email**
3. Click "Create Account"
4. Check your email inbox (and spam folder!)
5. You should receive a verification email

### Test 2: Password Reset

1. Go to: `http://localhost:3000/auth/forgot-password`
2. Enter your email
3. Click "Send Reset Link"
4. Check your email for the password reset link

---

## 📊 Free Tier Limits

Resend Free Plan includes:
- ✅ **3,000 emails/month**
- ✅ **100 emails/day**
- ✅ **1 custom domain**
- ✅ Full API access
- ✅ Email analytics

This is more than enough for development and small-scale production!

---

## 🔍 Monitoring & Debugging

### View Sent Emails

1. Go to Resend dashboard
2. Click **"Emails"** in sidebar
3. See all sent emails with status:
   - ✅ Delivered
   - 📬 Queued
   - ❌ Bounced
   - 🚫 Rejected

### Check Email Logs

Click on any email to see:
- Delivery status
- Open/click tracking
- Headers
- Full email content

### Common Issues

**1. Email not received?**
- Check spam/junk folder
- Verify `EMAIL_FROM` address is correct
- Check Resend dashboard for bounce/rejection
- Make sure API key is correct

**2. "Domain not verified" error?**
- For development: Use `onboarding@resend.dev`
- For production: Complete DNS setup in Resend dashboard

**3. "Rate limit exceeded"?**
- Free tier: 100 emails/day
- Wait 24 hours or upgrade plan

---

## 🔒 Security Best Practices

1. **Never commit API keys** to git
   - ✅ API keys should only be in `.env` (which is gitignored)
   - ✅ For production, set in Vercel environment variables

2. **Use different API keys** for development and production
   - Development key: Has broader permissions for testing
   - Production key: Restricted to sending only

3. **Rotate keys regularly**
   - Create new API key every 3-6 months
   - Delete old keys after rotation

---

## 🚀 Production Deployment (Vercel)

### Add Environment Variables to Vercel

1. Go to your Vercel project dashboard
2. Navigate to **Settings → Environment Variables**
3. Add the following for **Production**:

```
EMAIL_PROVIDER = resend
RESEND_API_KEY = re_your_production_api_key
EMAIL_FROM = noreply@your-domain.com
EMAIL_FROM_NAME = BCS E-Learning
```

4. Click **"Save"**
5. Redeploy your application

---

## 📧 Email Templates

Your verification and password reset emails are already configured with:

- ✅ Professional HTML templates with gradients
- ✅ Mobile-responsive design
- ✅ Clear call-to-action buttons
- ✅ University branding
- ✅ Security notices (24hr expiry for verification, 1hr for password reset)

Templates are located in: `/src/lib/email.ts`

---

## 🎯 Current Email Flow

### Registration Flow:
1. User fills registration form
2. Account created in database with `email_verified: false`
3. Verification email sent via Resend
4. User clicks link in email
5. Token validated and `email_verified: true`
6. User can now login

### Password Reset Flow:
1. User requests password reset
2. Reset token generated with 1-hour expiry
3. Reset email sent via Resend
4. User clicks link and sets new password
5. Token invalidated after use

---

## 📝 Environment Variables Reference

| Variable | Description | Example |
|----------|-------------|---------|
| `EMAIL_PROVIDER` | Email service to use | `resend` |
| `RESEND_API_KEY` | Resend API key | `re_abc123...` |
| `EMAIL_FROM` | Sender email address | `noreply@yourdomain.com` |
| `EMAIL_FROM_NAME` | Sender display name | `BCS E-Learning` |

---

## 🆘 Support

- **Resend Documentation**: https://resend.com/docs
- **Resend Support**: https://resend.com/support
- **API Status**: https://status.resend.com

---

## ✅ Checklist

- [ ] Created Resend account
- [ ] Generated API key
- [ ] Added environment variables to `.env`
- [ ] Restarted development server
- [ ] Tested registration email
- [ ] Tested password reset email
- [ ] (Optional) Added custom domain for production
- [ ] (Optional) Added environment variables to Vercel

---

**Last Updated**: January 2025
**Status**: Ready for Production ✅
