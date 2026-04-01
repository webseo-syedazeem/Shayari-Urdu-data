# Admin Panel Credentials

## Access URL

To access the admin panel:

1. Scroll to the footer of the website
2. Click on "Admin" link (small, gray text at the bottom of the About section)
3. Or navigate directly to: `#admin-login` in the URL

Example: `http://localhost:5173/#admin-login`

## Login Credentials

**Username:** `admin`
**Password:** `admin123`

## Admin Panel Features

Once logged in, you can manage:

1. **Manage Shayari** - View, edit, and add poetry posts
   - View all shayari with featured images
   - Search functionality
   - Edit/delete operations

2. **Manage Poets** - Manage poet profiles
   - View all poets with avatars
   - Add new poets
   - Edit/delete poet information

3. **Manage Topics** - Organize poetry by topics
   - View all topics with counts
   - Add new topics
   - Edit/delete topics

4. **Manage Collections** - Curate poetry collections
   - View all collections with cover images
   - Add new collections
   - Edit/delete collections

5. **Manage Ebooks** - Digital book library
   - View all ebooks with covers
   - Add new ebooks
   - Edit/delete ebooks

6. **Manage Dictionary** - Urdu/Hindi dictionary
   - Search and filter entries
   - Add new words
   - Edit/delete entries

7. **Manage Ad Slots** - Advertisement configuration
   - View all ad slots
   - Configure Google Ads placement
   - Enable/disable ad slots

## Security Note

This is a **basic authentication system** for development and internal use. The credentials are hardcoded for simplicity.

For production deployment, you should:
- Implement proper authentication with JWT tokens
- Use secure password hashing
- Add role-based access control
- Enable HTTPS
- Add rate limiting on login attempts
- Use environment variables for credentials

## Navigation

- Click "Back to Site" to return to the main website
- Click "Logout" to end your admin session
- The admin state is stored in localStorage

## Development Notes

The admin panel uses the same API backend as the main site. All CRUD operations connect to the Express API at `http://localhost:3001/api`.

For now, the admin panel provides **read-only** views with UI for edit/delete actions. Full write operations (POST/PUT/DELETE) will need to be implemented in future updates.
