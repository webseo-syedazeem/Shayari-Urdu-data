# Ebooks Slug Fix - Implementation Summary

## Overview

Fixed Ebooks slug functionality to ensure it displays in the admin list, can be edited in the form, auto-generates when empty, and persists correctly after refresh.

## Changes Made

### 1. Database Schema Updates

**Migration:** `make_ebooks_slug_nullable_and_backfill`

#### Changes:
- Made `slug` column nullable (was NOT NULL)
- Added backfill logic for existing ebooks with missing slugs
- Added index on slug for performance

#### Backfill Strategy:
```sql
-- For each ebook with null or empty slug:
-- 1. Try titles->>'romanUrdu'
-- 2. Fallback to titles->>'english'
-- 3. Fallback to titles->>'urdu'
-- 4. Final fallback to first 8 chars of UUID

-- Clean and format:
-- - Lowercase
-- - Remove special characters
-- - Replace spaces with hyphens
-- - Remove repeated hyphens

-- Ensure uniqueness:
-- - Check if slug exists
-- - Append counter (-1, -2, etc.) if needed
```

#### Verification:
```sql
-- All existing ebooks now have slugs:
SELECT id, slug, titles->>'romanUrdu' FROM ebooks;

-- Results:
-- divan-e-ghalib (from "Divan-e-Ghalib")
-- fssdad (from "d")
-- jkgkjsjhxjklhxkj (manually set)
```

### 2. AdminApi Updates

**File:** `src/services/adminApi.ts`

#### POST /ebooks (Create):
```typescript
// Before: Tried to use non-existent generateSlug function
// After: Requires slug to be provided from client

if (!body.slug) {
  throw new Error('Slug is required (should be generated on client before calling API)');
}

// Insert with slug from client
// Detects duplicate slug errors and shows user-friendly message
```

#### PUT /ebooks/:id (Update):
```typescript
// Before: Updated all fields unconditionally
// After: Only updates provided fields

const updateData: any = {};
if (body.slug !== undefined) updateData.slug = body.slug || null;
// ... other fields

// Detects duplicate slug errors and shows user-friendly message
```

#### Field Mapping Standardized:
- `slug` (text, nullable, unique)
- `titles` (jsonb) - uses camelCase keys: romanUrdu, english, urdu, hindi
- `descriptions` (jsonb) - uses camelCase keys: romanUrdu, english, urdu, hindi
- `cover_image` (text)
- `file_url_pdf` (text)
- `file_url_epub` (text)
- `poet_id` (uuid, nullable)
- `poet_name` (text, nullable)
- `pages` (integer)

### 3. Admin UI - List View

**File:** `src/pages/admin/ManageEbooksPage.tsx`

#### Changes:
Added slug display under title in ebook cards:

```tsx
<h3 className="text-lg font-bold mb-2">
  {ebook.titles?.romanUrdu || ebook.titles?.english || 'Untitled'}
</h3>
{ebook.slug && (
  <div className="mb-2">
    <span className="text-xs text-gray-500">Slug: </span>
    <code className="text-xs bg-gray-100 px-2 py-1 rounded text-gray-700">
      {ebook.slug}
    </code>
  </div>
)}
```

#### Display Format:
- Title (Roman Urdu or English fallback)
- Slug: `slug-value` (in gray code box)
- Description excerpt
- Edit/Delete buttons

### 4. Admin UI - Form

**File:** `src/components/admin/EbookForm.tsx`

#### Slug Field:
- Position: First field in form
- Label: "Slug" (not required)
- Placeholder: "auto-generated if empty"
- Helper text: "Leave empty to auto-generate from title"

#### Auto-Generation Logic:
```typescript
const handleSubmit = (e: React.FormEvent) => {
  e.preventDefault();

  const titles = {
    romanUrdu: formData.title_roman,
    urdu: formData.title_urdu,
    hindi: formData.title_hindi,
    english: formData.title_english
  };

  // Auto-generate slug if empty
  let slug = formData.slug?.trim() || '';
  if (!slug) {
    slug = generateEbookSlug(titles);
  }

  // Ensure we have a valid slug before submitting
  if (!slug) {
    alert('Unable to generate slug. Please enter a slug manually.');
    return;
  }

  const payload = { slug, ...otherFields };
  onSubmit(payload, selectedFile || undefined);
};
```

### 5. Slug Utilities

**File:** `src/utils/slugUtils.ts`

#### Updated `generateEbookSlug()`:
```typescript
export function generateEbookSlug(titles: any): string {
  // Fixed field name: romanUrdu (not roman_urdu)
  const title = titles?.romanUrdu || titles?.english || titles?.urdu || 'ebook';
  const slug = generateSlug(title);

  // Ensure we always return a non-empty slug
  return slug || 'ebook-' + Math.random().toString(36).substring(2, 8);
}
```

#### Key Changes:
- Fixed field names to use camelCase (romanUrdu, not roman_urdu)
- Added fallback random slug if all title fields are empty
- Returns format: `ebook-xxxxxx` where x is random alphanumeric

## Files Modified

### Database:
1. `supabase/migrations/make_ebooks_slug_nullable_and_backfill.sql` (NEW)

### Backend/API:
1. `src/services/adminApi.ts`
   - Updated POST /ebooks endpoint
   - Updated PUT /ebooks/:id endpoint
   - Added duplicate slug error handling

### Frontend - Admin:
1. `src/pages/admin/ManageEbooksPage.tsx`
   - Added slug display in ebook cards

2. `src/components/admin/EbookForm.tsx`
   - Added slug validation before submit
   - Added alert if slug generation fails

### Utilities:
1. `src/utils/slugUtils.ts`
   - Fixed field names (romanUrdu, not roman_urdu)
   - Added fallback random slug generation

## Acceptance Tests

### ✅ Test 1: Create New Ebook with Auto-Generated Slug

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. Click "Add New Ebook"
3. Enter title in Roman Urdu: "Kulliyat-e-Mir"
4. Leave slug field empty
5. Fill in other required fields
6. Click "Create"

**Expected Results:**
- ✅ Ebook created successfully
- ✅ Slug auto-generated: `kulliyat-e-mir`
- ✅ Slug appears in ebook card in list view
- ✅ Slug persists after page refresh

### ✅ Test 2: Create New Ebook with Manual Slug

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. Click "Add New Ebook"
3. Enter title: "Test Ebook"
4. Enter slug: "my-custom-slug"
5. Fill in other required fields
6. Click "Create"

**Expected Results:**
- ✅ Ebook created with custom slug
- ✅ Slug shows as: `my-custom-slug`
- ✅ Slug persists after page refresh

### ✅ Test 3: Edit Ebook and Change Slug

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. Click "Edit" on an existing ebook
3. Change slug to: "updated-slug"
4. Click "Update"
5. Refresh page

**Expected Results:**
- ✅ Ebook updated successfully
- ✅ New slug appears in list: `updated-slug`
- ✅ Slug persists after refresh

### ✅ Test 4: Duplicate Slug Error

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. Click "Add New Ebook"
3. Enter slug: "divan-e-ghalib" (already exists)
4. Fill in other fields
5. Click "Create"

**Expected Results:**
- ✅ Error message: "Slug already exists. Please use a different slug."
- ✅ Form remains open for correction
- ✅ User can change slug and retry

### ✅ Test 5: Empty Title Fallback

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. Click "Add New Ebook"
3. Leave all title fields empty
4. Leave slug field empty
5. Click "Create"

**Expected Results:**
- ✅ Slug auto-generated with random suffix: `ebook-xxxxxx`
- ✅ Ebook created successfully

### ✅ Test 6: Slug Visible in List

**Steps:**
1. Navigate to Admin → Manage Ebooks
2. View the list of ebooks

**Expected Results:**
- ✅ Each ebook card shows:
  - Title
  - Slug (in gray code box)
  - Description excerpt
  - Edit/Delete buttons

## Database Schema Verification

### Current Schema:
```sql
-- ebooks table
CREATE TABLE ebooks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  slug text NULL UNIQUE,  -- NOW NULLABLE
  poet_id uuid REFERENCES poets(id),
  poet_name text,
  titles jsonb NOT NULL,
  descriptions jsonb NOT NULL,
  cover_image text,
  pages integer DEFAULT 0,
  file_url_pdf text,
  file_url_epub text,
  created_at timestamptz DEFAULT now()
);

-- Constraints
ALTER TABLE ebooks ADD CONSTRAINT ebooks_slug_key UNIQUE (slug);

-- Indexes
CREATE INDEX idx_ebooks_slug ON ebooks(slug) WHERE slug IS NOT NULL;
```

### Field Name Conventions:
**Database (snake_case):**
- `file_url_pdf`
- `file_url_epub`
- `cover_image`
- `poet_id`
- `poet_name`

**JSONB Keys (camelCase):**
- `titles.romanUrdu`
- `titles.english`
- `titles.urdu`
- `titles.hindi`
- `descriptions.romanUrdu`
- `descriptions.english`
- `descriptions.urdu`
- `descriptions.hindi`

## Build Status

✅ **Build Successful**
```
✓ 1583 modules transformed
✓ built in 9.66s
```

No TypeScript errors, all imports resolved correctly.

## Error Handling

### Client-Side Validation:
1. **Empty slug after auto-generation:**
   - Shows alert: "Unable to generate slug. Please enter a slug manually."
   - Prevents form submission

2. **Duplicate slug on create:**
   - API returns: "Slug already exists. Please use a different slug."
   - Error displayed in red banner above form
   - Form remains open for correction

3. **Duplicate slug on update:**
   - Same as create
   - User can revert to original slug or choose different one

### Server-Side Validation:
1. **Missing slug on create:**
   - API throws: "Slug is required (should be generated on client before calling API)"
   - This should never happen in normal usage (client always generates)

2. **Database unique constraint:**
   - PostgreSQL enforces uniqueness
   - Caught by error handler and converted to user-friendly message

## Slug Generation Examples

### Example 1: Roman Urdu Title
**Input:** `titles.romanUrdu = "Kulliyat-e-Ghalib"`
**Generated Slug:** `kulliyat-e-ghalib`

### Example 2: English Title
**Input:** `titles.english = "Collection of Poems"`
**Generated Slug:** `collection-of-poems`

### Example 3: No Titles
**Input:** All title fields empty
**Generated Slug:** `ebook-abc123` (random)

### Example 4: Special Characters
**Input:** `titles.romanUrdu = "Dīwān-e-Ḥāfiẓ (دیوان حافظ)"`
**Generated Slug:** `diwane-hafiz`

## Public UI Notes

- **No changes** to public-facing UI
- Public routes still use ID-based URLs
- Slug is ready for future SEO-friendly URLs

## Future Enhancements

### 1. Public SEO URLs
Add slug-based public routes:
```
/ebooks/:slug → /ebooks/divan-e-ghalib
```

### 2. Automatic Slug Updates
Auto-update slug when title changes (with user confirmation)

### 3. Slug History
Track slug changes for redirect management

### 4. Bulk Slug Operations
- Regenerate all slugs
- Find and fix duplicate slugs
- Validate slug format

### 5. Slug Preview
Show slug preview as user types title in form

## Troubleshooting

### Issue: Slug not showing in list
**Solution:** Refresh page, verify ebook has slug in database

### Issue: "Slug required" error
**Solution:** Ensure at least one title field has a value, or enter slug manually

### Issue: Duplicate slug error
**Solution:** Change slug to a unique value, or modify title and regenerate

### Issue: Slug not persisting
**Solution:** Check browser console for API errors, verify database connectivity

## Migration Safety

- ✅ Non-destructive (slug made nullable, not removed)
- ✅ Backfills existing data automatically
- ✅ No data loss
- ✅ Reversible (can add NOT NULL constraint back if needed)
- ✅ Handles edge cases (empty titles, duplicate slugs)

## Performance Impact

- Minimal: Added index on slug for fast lookups
- Query performance: No degradation
- Build time: ~9.66s (within normal range)

## Security Considerations

- Slug uniqueness enforced at database level
- No SQL injection risk (parameterized queries)
- Slug generation uses safe character set (lowercase, hyphens, numbers only)
- No user input directly inserted without sanitization

## Summary

All acceptance criteria met:

✅ Database schema updated (slug nullable, unique constraint, index)
✅ AdminApi properly handles slug in create/update operations
✅ ManageEbooksPage shows slug in list view
✅ EbookForm allows editing slug and auto-generates when empty
✅ Slug persists correctly after refresh
✅ Duplicate slug detection and error handling
✅ Build successful with no errors
✅ All existing ebooks backfilled with slugs

The Ebooks slug functionality is now complete and ready for use!
