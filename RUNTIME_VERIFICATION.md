# KAG Unity Church PWA — Runtime Verification (Web Push)

This checklist is for validating end-to-end behavior after the code changes.

## 0) Prerequisites
- Django backend is running and reachable.
- Frontend is built/served.
- Browser supports Service Workers + Web Push.

### Required environment values
- **Frontend VAPID public key** must be configured in `.env` for `VITE_VAPID_PUBLIC_KEY`.
- **Backend** must have VAPID private key and public key configured in its environment (used by `backend/api/push_service.py`).

## 1) Verify Web Push Subscription Registration
1. Open the app in Chrome/Edge (desktop browser recommended first).
2. Sign in as a user.
3. Go to: **Notifications → Enable Push Notifications** (`/notifications/enable`).
4. Click **Enable Push Notifications**.
5. Confirm browser permission prompt is accepted.

### Expected result
- Request `POST /api/push-subscriptions/register/` returns **HTTP 200/201**.
- No error shown in UI.

### How to check
- Browser DevTools → Network tab → filter `push-subscriptions/register`.

## 2) Verify Notification Delivery (Admin Send → Push)
1. Use the admin UI/page or directly call the backend endpoint that sends pushes.
   - Expected endpoint is typically `POST /api/push/send/`.
2. Send a push message with at least:
   - `title`
   - `message/body`
   - (optional) `url` (defaults to `/notifications` in the SW)

### Expected result
- A system notification appears on the device/browser.
- Clicking it opens/focuses the **/notifications** page.

### How to check
- DevTools console (for any SW errors)
- Service Worker status under **Application → Service Workers**

## 3) Common Failure Troubleshooting
### A) Permission denied
- Check browser notification settings for the site.

### B) Subscription registration fails
- Ensure SW is registered and active.
- Ensure `VITE_VAPID_PUBLIC_KEY` is set correctly.
- Check backend logs for VAPID/serialization errors.

### C) Push send succeeds but no notification
- Confirm payload format and that backend actually calls Web Push.
- Check Service Worker `push` event handler is loading the updated `sw.js`.
- Hard refresh the app (and unregister/reload SW if needed).

## 4) Success Criteria
- Push subscription register works for at least one user.
- Admin push send results in a visible notification.

