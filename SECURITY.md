# Security Notes

## Firebase Configuration

### API Key Exposure
The Firebase API key in `script.js` is intentionally public. This is the standard practice for client-side Firebase applications. The API key is not a security risk by itself - it simply identifies your Firebase project.

### Database Security Rules
**IMPORTANT**: Ensure your Firebase Realtime Database has proper security rules configured. Recommended rules for this game:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": true,
        ".indexOn": ["createdAt", "expiresAt"]
      }
    }
  }
}
```

For production, consider more restrictive rules:

```json
{
  "rules": {
    "rooms": {
      "$roomId": {
        ".read": true,
        ".write": "!data.exists() || data.child('hostId').val() === auth.uid",
        ".validate": "newData.hasChildren(['createdAt', 'expiresAt', 'state'])",
        "players": {
          "$playerId": {
            ".write": true,
            ".validate": "newData.hasChildren(['id', 'name'])"
          }
        }
      }
    }
  }
}
```

### Best Practices

1. **Enable Firebase Authentication** (Optional but recommended)
   - Add anonymous authentication for better security
   - Prevents abuse and spam

2. **Set Database Rules**
   - Limit write access to room creators
   - Add validation rules for data structure
   - Implement rate limiting

3. **Room Cleanup**
   - The game already has auto-expiration
   - Consider adding a Cloud Function to delete expired rooms:
   ```javascript
   // Firebase Cloud Function (optional)
   exports.cleanupExpiredRooms = functions.pubsub
     .schedule('every 1 hours')
     .onRun(async (context) => {
       const now = Date.now();
       const snapshot = await admin.database().ref('rooms').once('value');
       const rooms = snapshot.val();
       
       for (const [roomId, room] of Object.entries(rooms)) {
         if (room.expiresAt && room.expiresAt < now) {
           await admin.database().ref(`rooms/${roomId}`).remove();
         }
       }
     });
   ```

4. **Input Validation**
   - The game currently validates:
     - Party codes (6 characters)
     - Player names (required)
     - Letter guesses (single letter, A-Z)
   - No additional sanitization needed for this use case

5. **Rate Limiting**
   - Consider adding rate limiting for:
     - Room creation (prevent spam)
     - Letter guessing (prevent brute force)
   - Can be implemented with Firebase Security Rules or Cloud Functions

## Known Limitations

- No authentication system (anyone can create/join parties)
- No player verification (players could impersonate others)
- No persistent user accounts
- Rooms are not automatically cleaned up (rely on expiration)

## Recommended Improvements for Production

1. Add Firebase Authentication (Anonymous or Google Sign-In)
2. Implement proper security rules with authentication checks
3. Add rate limiting to prevent abuse
4. Set up Cloud Functions for room cleanup
5. Add input sanitization for custom words
6. Implement reporting/moderation system
7. Add analytics to track usage patterns

## Contact

For security concerns or questions about Firebase configuration, please open an issue in the repository.
