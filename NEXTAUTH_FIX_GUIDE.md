# NextAuth Setup - Quick Fix Guide

## ✅ Your Configuration Status

### What's Working:
1. ✅ `auth-nextauth.ts` - Properly configured with role callbacks
2. ✅ `route.ts` - Correct handler export
3. ✅ `.env` - Has NEXTAUTH_URL and NEXTAUTH_SECRET

### Current Issue:
🔴 **Prisma Client Not Generated**

## 🚀 Quick Fix (Run These Commands)

```bash
# In frontend directory
cd frontend
npx prisma generate
npm run dev
```

## 🧪 Testing Your Login

1. **Start the dev server:**
   ```bash
   cd frontend
   npm run dev
   ```

2. **Open browser console** (F12)

3. **Try to login** and check:
   - Network tab → Look for `/api/auth/callback/credentials`
   - Console tab → Look for "AUTH DEBUG" messages

## 📋 Expected Flow

### Successful Login:
```
AUTH DEBUG: Credentials authorize called
AUTH DEBUG: User found
AUTH DEBUG: Password validation { isValid: true }
AUTH DEBUG: Authorization successful
→ Redirect to dashboard based on role
```

### Common Errors:

#### "Prisma Client not initialized"
**Fix:** Run `npx prisma generate` in frontend directory

#### "Invalid email or password"
**Causes:**
- Wrong credentials
- User doesn't exist
- Password hash mismatch

#### "Please verify your email"
**Fix:** Check `emailVerified` field in database

## 🔍 Debug Checklist

- [ ] Prisma client generated (`npx prisma generate`)
- [ ] Database is running (PostgreSQL on port 5432)
- [ ] User exists in database with correct role
- [ ] User's `emailVerified` is not null
- [ ] Password hash exists for user
- [ ] NEXTAUTH_URL matches your dev server URL
- [ ] NEXTAUTH_SECRET is set

## 🎯 Role-Based Redirects

After successful login, users are redirected based on role:
- **DONOR** → `/donor`
- **NGO** → `/ngo`
- **ADMIN** → `/admin`
- **DRIVER** → `/driver`

This is handled in `frontend/middleware.ts`

## 🐛 Still Having Issues?

Check these files:
1. `frontend/lib/auth-nextauth.ts` - Auth configuration
2. `frontend/middleware.ts` - Role-based routing
3. `frontend/.env` - Environment variables
4. Browser console - Look for "AUTH DEBUG" logs
5. Network tab - Check API responses

## 💡 Pro Tips

1. **Clear browser cache** if login seems stuck
2. **Check database** - User must have `emailVerified` set
3. **Console logs** - All auth steps are logged with "AUTH DEBUG"
4. **Test with existing user** - Don't create new users until login works
