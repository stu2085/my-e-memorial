MYEMEMORIAL — CELEBRATION OF LIFE OFFLINE BACKUP TEST BUILD
September 15, 2026

WHAT THIS ADDS
- Owner-only "Create Offline Backup" section after purchase.
- Guided Save -> Test with Wi-Fi off -> Copy to USB workflow.
- Saves a real folder on the owner's Windows/Mac computer; it does not rely on browser cache.
- Folder contains START PRESENTATION.html, local photos, local video MP4 files, local music files, a backup manifest, and testing instructions.
- Uses existing Mux video masters for backup; it does NOT render the entire presentation into a new MP4.
- Uses the existing celebration_presentations offline_backup_* database fields. No database migration is required.
- Public product page wording is changed from "Download as MP4" to "Create an offline event backup."

FILES INCLUDED
1. app/components/celebration-presentation/OfflineBackupSection.tsx
2. app/api/celebration-presentations/[publicId]/offline-backup/route.ts
3. app/celebration-of-life-slideshow/create/[publicId]/page.tsx
4. app/celebration-of-life-slideshow/page.tsx

NO NEW ENVIRONMENT VARIABLES
The route uses the existing:
- NEXT_PUBLIC_SUPABASE_URL
- SUPABASE_SERVICE_ROLE_KEY
- MUX_TOKEN_ID
- MUX_TOKEN_SECRET

FIRST TEST
1. Apply these files locally; do not push to production yet.
2. Run npm run build.
3. Start the local app.
4. Open the private owner/edit link for a PAID active standalone Celebration of Life Presentation in Chrome or Edge on a laptop/desktop.
5. Click Create Offline Backup.
6. Choose a folder such as Documents.
7. Wait until the site reports the backup is complete.
8. Turn off Wi-Fi.
9. Open the generated folder and double-click START PRESENTATION.html.
10. Play the complete presentation and verify photos, videos, captions, music, volume, pause/restart/loop/fullscreen.
11. Copy the complete generated folder to a USB thumb drive and test the USB copy too.

IMPORTANT
This is the first real-device test build. The key item to verify is that the browser can fetch the temporary Mux master MP4 directly into the selected folder. Mux supports the master MP4 download; the actual Chrome/Edge cross-origin download behavior must be confirmed with a real presentation before production deployment.
