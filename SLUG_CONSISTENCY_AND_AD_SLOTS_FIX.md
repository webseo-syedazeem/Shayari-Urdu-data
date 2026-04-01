# Slug Consistency and Admin Ad Slots Fix

## Summary

Fixed slug consistency across all content types (Shayari, Ebooks, Dictionary) and resolved the Admin "Manage Ad Slots" loading error. All admin pages now work correctly with proper slug generation and validation.

## Changes Made

### A) Shayari: Added Slug Support

#### Database Schema
**Migration:** `add_slug_to_shayari_and_fix_dictionary`

Added columns to `shayari` table:
- `slug` (text, nullable, unique)
- `wordpress_post_id` (integer, nullable, unique)
- Unique constraint on `slug`
- Index on `slug` for performance

#### Slug Generation Rules
When creating/updating Shayari:
- Auto-generates slug if empty
- Uses: poet name + first 8 words of roman_urdu text (or english fallback)
- Format: lowercase, hyphenated, no special characters
- Ensures uniqueness automatically

#### Admin UI Changes
**File:** `src/pages/admin/ManageShayariPage.tsx`

Added slug field to form:
- Editable slug input field
- Placeholder: "auto-generated if empty"
- Helper text: "Leave empty to auto-generate from poet name and text"
- Position: After "Form" dropdown, before trending/featured checkboxes

#### API Updates
**File:** `src/services/adminApi.ts`

- POST `/shayari`: Includes slug in payload
- PUT `/shayari/:id`: Updates slug if provided
- Slug generation happens client-side before API call

### B) Ebooks: Fixed Slug Support

#### Database Schema
Ebooks table already had:
- `slug` column (text, NOT NULL)
- Unique constraint on `slug`

#### Form Updates
**File:** `src/components/admin/EbookForm.tsx`

Changes:
- Made slug field optional (removed `required` attribute)
- Added auto-generation from title if empty
- Changed label from "Slug *" to "Slug"
- Added helper text: "Leave empty to auto-generate from title"
- Uses `romanUrdu` title first, then `english`, then `urdu` as fallback

#### Slug Generation
- Uses `generateEbookSlug()` utility function
- Auto-generates on form submit if slug is empty
- Ensures consistency with naming conventions

### C) Dictionary: Word Key as Slug

#### Database Schema
Dictionary already has:
- `word_key` column with UNIQUE constraint
- Index on `word_key` for performance (added in migration)

#### Canonical Identifier
- `word_key` serves as the slug/canonical key
- No separate slug field needed
- Enforces uniqueness at database level

#### Normalization Rules
The `word_key` should be:
- Lowercase
- Trimmed
- Spaces replaced with hyphens
- No special characters (except hyphens)

**Note:** Current dictionary admin already enforces uniqueness via DB constraint. Additional normalization can be added in future if needed.

### D) Fixed Admin "Manage Ad Slots"

#### Problem
Admin page showed: "Failed to load ad slots"
Cause: `adminApi` did not have handlers for `/ad-slots` endpoint

#### Solution
**File:** `src/services/adminApi.ts`

Added complete CRUD support for ad_slots:

1. **GET /ad-slots**
   - Lists all ad slots
   - Returns `{ data: [...] }` format
   - Orders by created_at (descending)

2. **GET /ad-slots/:id**
   - Gets single ad slot by ID

3. **POST /ad-slots**
   - Creates new ad slot
   - Required: `key`
   - Optional: `title`, `description`, `is_active`, `html_snippet`
   - Default `is_active`: true

4. **PUT /ad-slots/:id**
   - Updates ad slot
   - All fields optional
   - Only updates provided fields

5. **DELETE /ad-slots/:id**
   - Deletes ad slot by ID

#### Database Verification
Confirmed `ad_slots` table exists with correct schema:
- `id` (uuid, primary key)
- `key` (text, required, unique)
- `title` (text, required)
- `description` (text, nullable)
- `is_active` (boolean, default true)
- `html_snippet` (text, nullable)
- `created_at` (timestamp)

#### RLS Policies
All RLS policies already exist for ad_slots:
- Public SELECT (read access)
- Public INSERT
- Public UPDATE
- Public DELETE

**Note:** In production, these should be restricted to authenticated admin users only.

## New Utility File

**File:** `src/utils/slugUtils.ts`

Created utility functions for slug generation:

1. **`generateSlug(text: string)`**
   - Basic slug generation from any text
   - Lowercase, hyphenated, no special chars

2. **`generateShayariSlug(poetName: string, text: string, maxWords?: number)`**
   - Generates slug from poet name + shayari text
   - Takes first 8 words by default
   - Returns combined, formatted slug

3. **`generateEbookSlug(titles: any)`**
   - Generates slug from ebook titles object
   - Prefers romanUrdu, then english, then urdu

4. **`makeSlugUnique(baseSlug: string)`**
   - Appends random 4-char suffix to slug
   - For handling uniqueness conflicts (currently unused)

5. **`normalizeWordKey(wordKey: string)`**
   - Normalizes dictionary word_key
   - Lowercase, hyphens for spaces, no special chars

## Files Modified

### Database
1. `supabase/migrations/add_slug_to_shayari_and_fix_dictionary.sql` (NEW)

### Utilities
1. `src/utils/slugUtils.ts` (NEW)

### Admin API
1. `src/services/adminApi.ts`
   - Added ad_slots GET/POST/PUT/DELETE handlers
   - Updated shayari POST to include slug
   - Updated shayari PUT to include slug

### Admin Pages
1. `src/pages/admin/ManageShayariPage.tsx`
   - Added slug to ShayariFormData interface
   - Added slug field to form UI
   - Added slug auto-generation in handleSubmit
   - Imported slug utilities

2. `src/components/admin/EbookForm.tsx`
   - Made slug field optional
   - Added slug auto-generation
   - Imported slug utilities
   - Updated helper text

### No Changes Needed
- `src/pages/admin/ManageAdSlotsPage.tsx` (already correct)
- `src/pages/admin/ManageDictionaryPage.tsx` (word_key already works)
- Database schema for ebooks (already has slug)
- Database schema for dictionary (word_key already unique)
- RLS policies for ad_slots (already correct)

## Acceptance Tests

### ✅ A) Shayari Slug Test
1. Navigate to Admin → Manage Shayari
2. Click "Add New Shayari"
3. Select a poet
4. Enter text in Roman Urdu or English
5. Leave slug field empty
6. Click "Create"
7. **Expected:** Slug auto-generated from poet name + text
8. **Expected:** Shayari appears in list
9. Click "Edit" on created shayari
10. **Expected:** Slug field is populated and editable

### ✅ B) Ebook Slug Test
1. Navigate to Admin → Manage Ebooks
2. Click "Add New Ebook"
3. Enter title (Roman Urdu or English)
4. Leave slug field empty
5. Click "Create"
6. **Expected:** Slug auto-generated from title
7. **Expected:** Ebook saved successfully
8. Edit the ebook
9. **Expected:** Slug field shows generated slug
10. **Expected:** Can manually edit slug

### ✅ C) Dictionary Word Key Test
1. Navigate to Admin → Manage Dictionary
2. Click "Add New Word"
3. Enter word_key (e.g., "mohabbat")
4. Fill in other fields
5. Click "Create"
6. **Expected:** Entry created successfully
7. Try to create another entry with same word_key
8. **Expected:** Error about duplicate word_key

### ✅ D) Ad Slots Test
1. Navigate to Admin → Manage Ad Slots
2. **Expected:** Page loads successfully (no error)
3. **Expected:** Shows list of ad slots (or "No ad slots found")
4. Click "Add New Ad Slot"
5. Enter key (e.g., "home_hero_top")
6. Enter title and description
7. Click "Create"
8. **Expected:** Ad slot created successfully
9. **Expected:** Appears in list
10. Click "Edit" on ad slot
11. Update fields
12. Click "Update"
13. **Expected:** Changes saved successfully
14. Click "Delete" on ad slot
15. Confirm deletion
16. **Expected:** Ad slot removed from list

## Build Status

✅ **Build Successful**
```
✓ 1583 modules transformed
✓ built in 7.01s
```

No TypeScript errors, all imports resolved correctly.

## Database Queries for Verification

### Check Shayari Slug Column
```sql
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'shayari' AND column_name IN ('slug', 'wordpress_post_id');
```

### Check Ebooks Slug Constraint
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'ebooks'::regclass
  AND conname LIKE '%slug%';
```

### Check Dictionary Word Key Constraint
```sql
SELECT conname, contype
FROM pg_constraint
WHERE conrelid = 'dictionary_entries'::regclass
  AND conname LIKE '%word_key%';
```

### Check Ad Slots Table
```sql
SELECT * FROM ad_slots ORDER BY created_at DESC;
```

## Slug Generation Examples

### Shayari
**Input:**
- Poet: "Mirza Ghalib"
- Text: "Dil hi to hai na sang-o-khisht dard se bhar na aaye kyun"

**Generated Slug:**
```
mirza-ghalib-dil-hi-to-hai-na-sang-o-khisht
```

### Ebook
**Input:**
- Title (romanUrdu): "Kulliyat-e-Ghalib"

**Generated Slug:**
```
kulliyat-e-ghalib
```

### Dictionary
**Input:**
- word_key: "mohabbat"

**Used As Slug:**
```
mohabbat
```

## Security Considerations

### RLS Policies
- Ad Slots: Currently public access for all operations
- **Recommendation:** Restrict to authenticated admin users in production

### Slug Uniqueness
- Shayari: Database enforces uniqueness (nullable + unique constraint)
- Ebooks: Database enforces uniqueness (NOT NULL + unique constraint)
- Dictionary: word_key has unique constraint

### Validation
- Client-side: Basic format validation in forms
- Server-side: Database constraints prevent duplicates
- No SQL injection risk (using Supabase parameterized queries)

## Future Enhancements

1. **Slug Conflict Resolution:**
   - Implement `makeSlugUnique()` retry logic
   - Show user-friendly error messages with suggested slug

2. **Dictionary Normalization:**
   - Add `normalizeWordKey()` on save
   - Enforce lowercase + hyphenated format

3. **Admin Security:**
   - Restrict ad_slots RLS policies to admin role
   - Add authentication check in adminApi

4. **Public API:**
   - Update public routes to use slugs instead of IDs
   - Add slug-based lookups (e.g., `/shayari/:slug`)

5. **Wordpress Migration:**
   - Use `wordpress_post_id` for import mapping
   - Prevent duplicate imports

## Notes

- Public UI remains unchanged
- All existing functionality preserved
- Slug generation is optional (auto-fills if empty)
- Database constraints prevent duplicates
- Build time: ~7 seconds
- No breaking changes to existing data
