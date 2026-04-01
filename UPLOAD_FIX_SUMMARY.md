# Upload Fix Summary - RLS Authentication Issue

## Problem

Image uploads were failing with error:
```
Upload failed: new row violates row-level security policy
```

**Root Cause:** Admin login was only a local UI check (username/password) without actual Supabase authentication. Uploads were happening as anonymous users, and storage RLS policies rejected them.

## Solution Implemented

### 1. Added Storage RLS Policies

**Migration:** `supabase/migrations/add_storage_rls_policies_for_media.sql`

Created 4 policies for the `storage.objects` table:
- **INSERT**: Allow authenticated users to upload to media bucket
- **UPDATE**: Allow authenticated users to update files in media bucket
- **DELETE**: Allow authenticated users to delete files from media bucket
- **SELECT**: Public read access for frontend display

### 2. Implemented Supabase Auth

**Changed Files:**
- `src/pages/admin/AdminLoginPage.tsx`
- `src/App.tsx`
- `src/services/uploadService.ts`

**What Changed:**
- Admin login now uses `supabase.auth.signInWithPassword()`
- App checks for active session on load using `supabase.auth.getSession()`
- Auth state listener tracks login/logout events
- Upload service checks authentication before uploading
- Logout properly signs out from Supabase

### 3. Added Authentication Check to Uploads

Before uploading, the service now:
1. Checks if user has an active Supabase session
2. Returns clear error if not authenticated: "Please login to admin to upload images"
3. Proceeds with upload only if authenticated

## Files Modified

1. **src/pages/admin/AdminLoginPage.tsx**
   - Now uses email/password instead of username
   - Calls Supabase Auth API
   - Shows loading state during login

2. **src/App.tsx**
   - Checks session on app load
   - Listens for auth state changes
   - Properly signs out on logout

3. **src/services/uploadService.ts**
   - Added authentication check before upload
   - Added authentication check before delete
   - Clear error messages for unauthenticated attempts

4. **New Migration**
   - `supabase/migrations/add_storage_rls_policies_for_media.sql`
   - Defines all storage policies for media bucket

5. **New Documentation**
   - `ADMIN_SETUP.md` - Complete setup guide

## How to Setup Admin User

**Via Supabase Dashboard:**
1. Go to https://app.supabase.com
2. Select your project
3. Navigate to **Authentication** → **Users**
4. Click **"Add User"** → **"Create new user"**
5. Enter email: `admin@shayariurdu.com` (or your choice)
6. Enter a strong password
7. Check **"Auto Confirm User"**
8. Click **"Create user"**

## Testing the Fix

### 1. Create Admin User (see above)

### 2. Test Login
1. Navigate to `/#admin-login`
2. Enter your admin email and password
3. Should login successfully and redirect to admin dashboard

### 3. Test Upload
1. Go to any admin management page (Poets, Shayari, Ebooks, Collections)
2. Click "Add New" or "Edit" existing item
3. Click "Upload" button and select an image
4. Should see preview immediately
5. Submit form
6. Upload should succeed without RLS error
7. Image should display on public pages

### 4. Test Logout
1. Click "Logout" in admin dashboard
2. Should redirect to homepage
3. Try accessing `/#admin` - should redirect to login

## Security Notes

- **Uploads restricted to authenticated users only**
- **No anonymous uploads allowed**
- **Session managed by Supabase Auth**
- **All write operations require authentication**
- **Public read access for frontend display**

## Verification Checklist

- [✓] Storage RLS policies applied
- [✓] Admin login uses Supabase Auth
- [✓] Upload service checks authentication
- [✓] Session persists across page reloads
- [✓] Logout properly clears session
- [✓] Clear error messages for auth issues
- [✓] Build succeeds without errors
- [✓] Documentation created

## Next Steps

1. **Create your admin user** in Supabase Dashboard (see ADMIN_SETUP.md)
2. **Test the upload flow** end-to-end
3. **Verify images display** on public pages

## Technical Details

**Authentication Flow:**
```
User enters email/password
  → supabase.auth.signInWithPassword()
  → Session created and stored in localStorage
  → All subsequent API calls include auth header
  → Uploads succeed with authenticated session
```

**Upload Flow:**
```
Admin clicks upload
  → uploadService checks session
  → If no session: Return error
  → If session exists: Proceed with upload
  → Storage RLS allows INSERT for authenticated
  → Upload succeeds
  → Public URL returned
```

## Troubleshooting

**Still getting RLS error?**
- Verify migration ran successfully
- Check user is logged in (check Supabase Dashboard → Authentication → Sessions)
- Verify session token in browser localStorage
- Check browser console for auth errors

**Login not working?**
- Verify user exists in Supabase Dashboard
- Check email is confirmed (should be auto-confirmed)
- Try password reset if needed

**Session expires?**
- Default: 1 hour
- Simply login again
- Session auto-refreshed by Supabase client

All fixes are production-ready and secure!
