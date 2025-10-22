# Analytics and Push Notifications Implementation Plan

## Executive Summary

This document outlines the comprehensive plan to implement Firebase Analytics and Push Notifications in the Expo-based Thrive Church cross-platform app, based on the reference implementation from the previous iOS-only app.

**Status**: The current app already has stub implementations for both Analytics and Push Notifications, but they are disabled due to Expo SDK 54 compatibility concerns. This plan will enable and fully implement these features.

---

## 1. Research Findings

### 1.1 Old iOS Implementation Analysis

**Location**: `/Volumes/T5/Git/ThriveChurchOfficialApp`

**Analytics Platform**: Firebase Analytics (via CocoaPods)
- **Dependencies**: 
  - `Firebase/Core`
  - `Firebase/Analytics`
  - `Firebase/Crashlytics`
  - `Firebase/Messaging`

**Events Tracked**:
- `app_open` - App launch
- `app_in_background` - App backgrounded
- `tutorial_begin` - Onboarding started
- `tutorial_complete` - Onboarding completed
- `select_content` - Content selection (sermons, notes, Bible passages)
- `view_item` - Item views
- `level_start` / `level_end` - Note creation/editing

**Push Notifications**:
- **Platform**: Firebase Cloud Messaging (FCM)
- **Implementation**: AppDelegate.swift
- **Features**:
  - FCM token registration
  - APNS token handling
  - Foreground notification display
  - Background notification handling
  - Notification tap handling
  - Badge count management

**Key Implementation Details**:
```swift
// AppDelegate.swift - Lines 36-53
FirebaseApp.configure()
Analytics.logEvent(AnalyticsEventAppOpen, ...)
UNUserNotificationCenter.current().delegate = self
Messaging.messaging().delegate = self
application.registerForRemoteNotifications()
```

### 1.2 Current Expo App Assessment

**Location**: `/Users/wyattbaggett/Documents/Git/ThriveChurchOfficialApp_CrossPlatform/ThriveChurchExpo`

**Project Structure**:
- **Framework**: Expo SDK 54 with React Native 0.81.4
- **Workflow**: Expo Development Build (bare workflow with custom native code)
- **Architecture**: Feature-based with services layer

**Existing Dependencies**:
- `@react-native-firebase/app` v23.4.0 ✅ (installed)
- `@notifee/react-native` v9.1.8 ✅ (installed for local notifications)
- Firebase config files present:
  - `GoogleService-Info.plist` (iOS)
  - `google-services.json` (Android)

**Existing Service Implementations**:
1. **Analytics Service** (`app/services/analytics/analyticsService.ts`):
   - ✅ Complete stub implementation with all methods
   - ✅ Already integrated in RootNavigator and OnboardingScreen
   - ❌ Firebase Analytics calls commented out
   - ✅ Event constants defined matching iOS implementation

2. **Push Notification Service** (`app/services/notifications/pushNotificationService.ts`):
   - ✅ Complete stub implementation
   - ✅ Notifee integration for local notifications
   - ❌ Firebase Messaging calls commented out
   - ✅ Permission handling, badge management, handlers defined

**Configuration**:
- `app.config.js` has Firebase plugins commented out (lines 99-100):
  ```javascript
  // "@react-native-firebase/crashlytics", // Temporarily disabled
  // "@react-native-firebase/analytics", // Temporarily disabled
  ```
- Feature flags system in place (`app/config/firebase.config.ts`)
- Firebase configuration loader implemented

**Current Analytics Usage**:
- `RootNavigator.tsx`: Calls `logAppOpen()` on app start
- `OnboardingScreen.tsx`: Calls `logTutorialBegin()` and `logTutorialComplete()`

**Screens Requiring Analytics Integration**:
- Listen: ListenScreen, SermonDetailScreen, NowPlayingScreen, SeriesDetailScreen, VideoPlayerScreen, DownloadsScreen, BiblePassageScreen, RecentlyPlayedScreen
- Notes: NotesListScreen, NoteDetailScreen
- Bible: BibleSelectionScreen, BookListScreen
- Connect: ConnectScreen, WebViewScreen, RSSScreen, RSSDetailScreen
- More: MoreScreen
- Onboarding: OnboardingScreen (already integrated)

---

## 2. Expo-Compatible Approach

### 2.1 Recommended Libraries

**Analytics**: `@react-native-firebase/analytics`
- ✅ Official Firebase SDK for React Native
- ✅ Works with Expo Development Builds
- ✅ Supports both iOS and Android
- ✅ Feature parity with iOS Firebase Analytics

**Push Notifications**: `@react-native-firebase/messaging` + `@notifee/react-native`
- ✅ `@react-native-firebase/messaging` for FCM integration
- ✅ `@notifee/react-native` for enhanced local notification display (already installed)
- ✅ Works with Expo Development Builds
- ✅ Supports background handlers, notification actions, and rich notifications

### 2.2 Compatibility Assessment

**Expo SDK 54 + React Native 0.81.4**:
- ✅ Compatible with `@react-native-firebase/app` v23.x
- ✅ Compatible with `@react-native-firebase/analytics` v23.x
- ✅ Compatible with `@react-native-firebase/messaging` v23.x
- ⚠️ Requires `expo-build-properties` plugin with `useFrameworks: "static"` (already configured)
- ⚠️ Requires native rebuild after installation

**Known Limitations**:
- Cannot use Expo Go (requires Development Build) - ✅ Already using dev client
- Requires native configuration files - ✅ Already present
- iOS requires APNS certificates - ⚠️ Needs verification
- Android requires FCM setup - ⚠️ Needs verification

### 2.3 Differences from Old Implementation

| Feature | Old iOS App | New Expo App | Notes |
|---------|-------------|--------------|-------|
| Analytics Platform | Firebase Analytics (Native) | Firebase Analytics (RN) | Same platform, different SDK |
| Event Tracking | Swift API | JavaScript API | Same events, different syntax |
| Push Notifications | FCM + APNS (Native) | FCM + APNS (RN) | Same platform, different SDK |
| Local Notifications | UNUserNotificationCenter | Notifee | Enhanced features with Notifee |
| Badge Management | Native iOS API | Notifee API | Cross-platform with Notifee |
| Background Handlers | AppDelegate methods | JavaScript handlers | Requires registration in index.js |

---

## 3. Integration Opportunities

### 3.1 Existing Features for Analytics

**Quick Wins** (Already have hooks in place):
1. ✅ App lifecycle events (RootNavigator)
2. ✅ Onboarding flow (OnboardingScreen)

**High-Value Additions** (Minimal code changes):
1. **Sermon Playback**: Track play, pause, complete events
   - Location: `app/hooks/usePlayer.ts`
   - Events: `play_sermon`, `pause_sermon`, `complete_sermon`

2. **Sermon Downloads**: Track download start/complete
   - Location: `app/services/downloads/`
   - Events: `download_sermon`, `delete_download`

3. **Note Creation/Editing**: Track note lifecycle
   - Location: `app/screens/Notes/`
   - Events: `create_note`, `edit_note`, `delete_note`, `share_note`

4. **Bible Reading**: Track book/chapter views
   - Location: `app/screens/Bible/`
   - Events: `view_bible`, `select_book`, `select_chapter`

5. **Screen Views**: Automatic screen tracking
   - Location: `app/navigation/RootNavigator.tsx`
   - Events: `screen_view` (automatic)

6. **Social Links**: Track external link opens
   - Location: `app/screens/More/MoreScreen.tsx`
   - Events: `open_social`, `contact_church`

### 3.2 Existing Features for Push Notifications

**Quick Wins**:
1. ✅ Permission request flow (already stubbed)
2. ✅ Badge management (already stubbed)
3. ✅ Notification display (Notifee already integrated)

**High-Value Additions**:
1. **New Sermon Notifications**: Notify when new sermons are available
   - Trigger: Backend sends FCM message
   - Action: Open sermon detail screen

2. **Event Reminders**: Notify about upcoming church events
   - Trigger: Backend sends FCM message
   - Action: Open Connect tab

3. **Note Reminders**: Remind users to review sermon notes
   - Trigger: Local notification (Notifee)
   - Action: Open note detail screen

4. **Download Complete**: Notify when sermon download finishes
   - Trigger: Local notification (Notifee)
   - Action: Open downloads screen

---

## 4. Detailed Implementation Plan

### Phase 1: Dependency Installation and Configuration

**Task 1.1: Install Firebase Packages**
```bash
cd ThriveChurchExpo
npm install @react-native-firebase/analytics@^23.4.0
npm install @react-native-firebase/messaging@^23.4.0
```

**Task 1.2: Enable Firebase Plugins**
- Edit `app.config.js` (lines 99-100)
- Uncomment Analytics and Messaging plugins
- Add Messaging plugin if not present

**Task 1.3: Rebuild Native Code**
```bash
# iOS
npx expo prebuild --clean
npx expo run:ios

# Android
npx expo run:android
```

**Task 1.4: Verify Firebase Configuration**
- Check `GoogleService-Info.plist` is valid
- Check `google-services.json` is valid
- Verify credentials.json has all Firebase values
- Test Firebase initialization on app launch

**Estimated Time**: 2-3 hours
**Dependencies**: None
**Risks**: Build errors due to native dependencies

---

### Phase 2: Implement Analytics Service

**Task 2.1: Update analyticsService.ts**
- Uncomment Firebase Analytics import
- Replace console.log stubs with actual Firebase calls
- Add error handling and fallbacks
- Add feature flag checks

**Task 2.2: Implement Core Analytics Functions**

Functions to implement:
- `logAppOpen()` - Track app launches
- `logAppInBackground()` - Track app backgrounding
- `logTutorialBegin()` / `logTutorialComplete()` - Onboarding tracking
- `logPlaySermon()` - Sermon playback tracking
- `logDownloadSermon()` - Download tracking
- `logCreateNote()` / `logShareNote()` - Note tracking
- `logViewBible()` - Bible reading tracking
- `logContactChurch()` / `logOpenSocial()` - Engagement tracking
- `setCurrentScreen()` - Screen view tracking
- `setUserId()` / `setUserProperty()` - User properties

**Task 2.3: Add Screen Tracking**
- Integrate with React Navigation
- Add `useEffect` hook in RootNavigator to track screen changes
- Log screen views automatically

**Task 2.4: Test Analytics Events**
- Use Firebase DebugView to verify events
- Test on iOS and Android
- Verify event parameters are correct

**Estimated Time**: 3-4 hours
**Dependencies**: Phase 1 complete
**Risks**: Event parameter mismatches, Firebase initialization issues

---

### Phase 3: Implement Push Notification Service

**Task 3.1: Update pushNotificationService.ts**
- Uncomment Firebase Messaging import
- Replace console.log stubs with actual Firebase calls
- Implement FCM token retrieval
- Implement permission request flow

**Task 3.2: Implement Notification Handlers**

Functions to implement:
- `requestNotificationPermission()` - Request iOS/Android permissions
- `getFCMToken()` - Get FCM registration token
- `registerForRemoteNotifications()` - Register with FCM
- `setupForegroundMessageHandler()` - Handle notifications when app is open
- `setupBackgroundMessageHandler()` - Handle notifications when app is closed
- `setupNotificationOpenedHandler()` - Handle notification taps
- `displayNotification()` - Display notifications using Notifee
- `setBadgeCount()` - Manage app badge
- `clearAllNotifications()` - Clear notification tray

**Task 3.3: Register Background Handler**
- Edit `index.js` to register background message handler
- Must be done outside of React component lifecycle

**Task 3.4: Initialize in App.tsx**
- Call `initializePushNotifications()` on app start
- Set up notification opened handler with navigation
- Handle deep links from notifications

**Task 3.5: Test Push Notifications**
- Test foreground notifications
- Test background notifications
- Test notification tap handling
- Test badge count updates
- Test on iOS and Android

**Estimated Time**: 4-5 hours
**Dependencies**: Phase 1 complete
**Risks**: Permission issues, FCM token retrieval failures, background handler not firing

---

### Phase 4: Add Analytics Tracking to Screens

**Task 4.1: Listen Tab Screens**

**ListenScreen.tsx**:
- Track screen view on mount
- Track sermon card taps

**SermonDetailScreen.tsx**:
- Track screen view with sermon ID
- Track play button taps
- Track download button taps
- Track share button taps
- Track Bible passage link taps

**NowPlayingScreen.tsx**:
- Track screen view
- Track playback controls (play, pause, skip)
- Track playback completion

**SeriesDetailScreen.tsx**:
- Track screen view with series ID
- Track sermon selection

**VideoPlayerScreen.tsx**:
- Track video playback start
- Track video completion

**DownloadsScreen.tsx**:
- Track screen view
- Track download deletion

**BiblePassageScreen.tsx**:
- Track screen view with passage reference
- Track passage reading time

**RecentlyPlayedScreen.tsx**:
- Track screen view
- Track sermon replay

**Task 4.2: Notes Tab Screens**

**NotesListScreen.tsx**:
- Track screen view
- Track note creation button tap
- Track note selection

**NoteDetailScreen.tsx**:
- Track screen view with note ID
- Track note editing
- Track note sharing
- Track note deletion

**Task 4.3: Bible Tab Screens**

**BibleSelectionScreen.tsx**:
- Track screen view
- Track sort method selection

**BookListScreen.tsx**:
- Track screen view
- Track book selection
- Track chapter selection

**Task 4.4: Connect Tab Screens**

**ConnectScreen.tsx**:
- Track screen view
- Track button taps (Give, Events, etc.)

**WebViewScreen.tsx**:
- Track screen view with URL
- Track external link opens

**RSSScreen.tsx**:
- Track screen view
- Track RSS item selection

**RSSDetailScreen.tsx**:
- Track screen view with item ID

**Task 4.5: More Tab Screens**

**MoreScreen.tsx**:
- Track screen view
- Track social link taps (Facebook, Instagram, etc.)
- Track contact method taps (email, phone, website)
- Track settings access

**Task 4.6: Onboarding**

**OnboardingScreen.tsx**:
- ✅ Already implemented (tutorial_begin, tutorial_complete)
- Verify events are firing correctly

**Estimated Time**: 6-8 hours
**Dependencies**: Phase 2 complete
**Risks**: Missing edge cases, event parameter inconsistencies

---

### Phase 5: Platform-Specific Configuration

**Task 5.1: iOS Configuration**

**APNS Certificates**:
1. Verify Apple Developer account has Push Notification capability enabled
2. Generate APNS certificate or key (.p8 file recommended)
3. Upload to Firebase Console (Project Settings > Cloud Messaging > iOS)
4. Verify bundle identifier matches

**Xcode Configuration**:
1. Open `ios/ThriveChurchExpo.xcworkspace`
2. Enable Push Notifications capability
3. Enable Background Modes > Remote notifications
4. Verify GoogleService-Info.plist is in project
5. Verify Firebase is initialized in AppDelegate

**Info.plist Verification**:
- ✅ `UIBackgroundModes` includes `remote-notification` (already configured)
- ✅ `FirebaseAppDelegateProxyEnabled` set to `false` (already configured)

**Task 5.2: Android Configuration**

**FCM Setup**:
1. Verify Firebase project has Android app registered
2. Verify package name matches `credentials.json`
3. Verify `google-services.json` is up to date
4. Upload server key to backend (if sending notifications from server)

**AndroidManifest.xml Verification**:
- ✅ Internet permission (already configured)
- ✅ Notification permission (already configured)
- Add notification channel configuration if needed

**Task 5.3: Test on Physical Devices**
- Test on iPhone (iOS 15+)
- Test on Android phone (Android 8+)
- Test on iPad
- Verify notifications work on all devices
- Verify analytics events appear in Firebase Console

**Estimated Time**: 3-4 hours
**Dependencies**: Phase 1-3 complete
**Risks**: Certificate issues, permission problems, device-specific bugs

---

### Phase 6: Testing and Validation

**Task 6.1: Analytics Testing**

**Test Cases**:
1. ✅ App open event fires on launch
2. ✅ App background event fires when backgrounded
3. ✅ Screen view events fire on navigation
4. ✅ Sermon play events fire with correct parameters
5. ✅ Download events fire with correct parameters
6. ✅ Note events fire with correct parameters
7. ✅ Bible events fire with correct parameters
8. ✅ Social/contact events fire with correct parameters
9. ✅ Onboarding events fire correctly

**Verification**:
- Use Firebase DebugView (enable with `adb shell setprop debug.firebase.analytics.app com.thrivechurch.app`)
- Check Firebase Console > Analytics > Events (24-48 hour delay for production data)
- Verify event parameters match expected schema

**Task 6.2: Push Notification Testing**

**Test Cases**:
1. ✅ Permission request appears on first launch
2. ✅ FCM token is retrieved successfully
3. ✅ Foreground notifications display correctly
4. ✅ Background notifications display correctly
5. ✅ Notification tap opens correct screen
6. ✅ Badge count updates correctly
7. ✅ Notifications clear when app is opened
8. ✅ Rich notifications display images/actions

**Testing Tools**:
- Firebase Console > Cloud Messaging > Send test message
- Use FCM token from device logs
- Test on both iOS and Android
- Test with app in foreground, background, and killed states

**Task 6.3: Edge Case Testing**

**Scenarios**:
1. App launched without internet connection
2. Firebase initialization fails
3. Permission denied by user
4. FCM token refresh
5. App upgrade with existing token
6. Notification received while on notification target screen
7. Multiple notifications received
8. Notification with invalid data

**Task 6.4: Performance Testing**
- Verify analytics calls don't block UI
- Verify notification handlers don't cause ANR/freeze
- Check memory usage with Firebase SDK
- Monitor crash reports

**Estimated Time**: 4-5 hours
**Dependencies**: Phase 1-5 complete
**Risks**: Hard-to-reproduce edge cases, device-specific issues

---

### Phase 7: Documentation

**Task 7.1: Create Setup Guide**

Document should include:
- Prerequisites (Firebase project, APNS certificates, etc.)
- Installation steps
- Configuration steps
- Environment variable setup
- Testing instructions
- Troubleshooting common issues

**Task 7.2: Create Developer Guide**

Document should include:
- How to add new analytics events
- How to test analytics locally
- How to send test notifications
- How to handle notification deep links
- Best practices for event naming
- Privacy considerations

**Task 7.3: Update README**
- Add Analytics and Push Notifications to features list
- Link to setup guide
- Add badges for Firebase services

**Task 7.4: Create Troubleshooting Guide**

Common issues:
- Firebase not initializing
- Analytics events not appearing
- FCM token not retrieved
- Notifications not displaying
- Background handler not firing
- APNS certificate issues
- Build errors with Firebase SDK

**Estimated Time**: 2-3 hours
**Dependencies**: Phase 1-6 complete
**Risks**: None

---

## 5. Implementation Timeline

### Week 1: Foundation
- **Day 1-2**: Phase 1 (Dependencies and Configuration)
- **Day 3-4**: Phase 2 (Analytics Service Implementation)
- **Day 5**: Phase 3 (Push Notification Service Implementation)

### Week 2: Integration and Testing
- **Day 1-3**: Phase 4 (Screen Analytics Integration)
- **Day 4**: Phase 5 (Platform-Specific Configuration)
- **Day 5**: Phase 6 (Testing and Validation)

### Week 3: Polish and Documentation
- **Day 1**: Phase 6 continued (Edge case testing)
- **Day 2**: Phase 7 (Documentation)
- **Day 3**: Final review and deployment preparation

**Total Estimated Time**: 25-35 hours over 3 weeks

---

## 6. Risk Assessment and Mitigation

### High-Risk Items

**1. Expo SDK 54 Compatibility Issues**
- **Risk**: Firebase SDK may have breaking changes with Expo SDK 54
- **Mitigation**: Use exact versions that are known to work (v23.4.0)
- **Fallback**: Downgrade to Expo SDK 53 if critical issues found

**2. iOS APNS Certificate Issues**
- **Risk**: Missing or expired APNS certificates prevent iOS notifications
- **Mitigation**: Verify certificates before starting implementation
- **Fallback**: Use development certificates for testing, production later

**3. Background Handler Not Firing**
- **Risk**: Android may kill background process, preventing notification handling
- **Mitigation**: Follow React Native Firebase documentation exactly
- **Fallback**: Use Notifee for local notifications as backup

**4. Analytics Events Not Appearing**
- **Risk**: Firebase Analytics has 24-48 hour delay for production data
- **Mitigation**: Use DebugView for immediate feedback during development
- **Fallback**: Add local logging to verify events are being sent

### Medium-Risk Items

**1. Build Time Increase**
- **Risk**: Firebase SDK increases build time significantly
- **Mitigation**: Use development builds, cache dependencies
- **Fallback**: Accept longer build times as necessary trade-off

**2. App Size Increase**
- **Risk**: Firebase SDK adds ~5-10MB to app size
- **Mitigation**: Enable ProGuard/R8 on Android, bitcode on iOS
- **Fallback**: Accept larger app size for analytics/notifications features

**3. Permission Denial**
- **Risk**: Users may deny notification permissions
- **Mitigation**: Implement graceful fallback, re-prompt at appropriate times
- **Fallback**: App works fine without notifications, just missing feature

### Low-Risk Items

**1. Event Parameter Mismatches**
- **Risk**: Analytics events may have incorrect parameters
- **Mitigation**: Thorough testing with DebugView
- **Fallback**: Update events in next release

**2. Notification Display Issues**
- **Risk**: Notifications may not display correctly on some devices
- **Mitigation**: Use Notifee for consistent cross-platform display
- **Fallback**: Fall back to default Firebase notification display

---

## 7. Success Criteria

### Analytics
- ✅ All defined events fire correctly on iOS and Android
- ✅ Events appear in Firebase Console within 24-48 hours
- ✅ Event parameters match expected schema
- ✅ Screen view tracking works automatically
- ✅ No performance impact on app (< 50ms per event)
- ✅ Analytics work offline (queued and sent when online)

### Push Notifications
- ✅ Permission request works on iOS and Android
- ✅ FCM token retrieved successfully
- ✅ Foreground notifications display correctly
- ✅ Background notifications display correctly
- ✅ Notification taps navigate to correct screen
- ✅ Badge count updates correctly on iOS
- ✅ Notifications can be sent from Firebase Console
- ✅ Background handler fires reliably

### Code Quality
- ✅ No new TypeScript errors
- ✅ No new ESLint warnings
- ✅ Services follow existing patterns
- ✅ Error handling implemented
- ✅ Feature flags respected
- ✅ Graceful degradation if Firebase unavailable

### Documentation
- ✅ Setup guide complete
- ✅ Developer guide complete
- ✅ Troubleshooting guide complete
- ✅ README updated

---

## 8. Quick Wins and Priorities

### Immediate Quick Wins (Week 1)
1. **Enable Analytics Service** (2 hours)
   - Uncomment Firebase Analytics import
   - Replace stubs with real calls
   - Test with existing integrations (app open, onboarding)

2. **Add Sermon Play Tracking** (1 hour)
   - Add `logPlaySermon()` call in usePlayer hook
   - Verify events in DebugView

3. **Enable Push Notification Permissions** (1 hour)
   - Uncomment Firebase Messaging import
   - Implement permission request
   - Test on device

### High-Value Additions (Week 2)
1. **Screen View Tracking** (2 hours)
   - Automatic tracking for all screens
   - High value, low effort

2. **Download Tracking** (2 hours)
   - Track sermon downloads
   - Track download deletions

3. **Note Tracking** (2 hours)
   - Track note creation, editing, sharing
   - High engagement metric

### Nice-to-Have (Week 3)
1. **Rich Notifications** (3 hours)
   - Add images to notifications
   - Add action buttons

2. **Custom Notification Sounds** (2 hours)
   - Add custom sound for church notifications

3. **Notification Scheduling** (3 hours)
   - Schedule local reminders for events

---

## 9. Next Steps

### Before Starting Implementation

1. **Verify Firebase Project Setup**
   - Confirm iOS app is registered in Firebase Console
   - Confirm Android app is registered in Firebase Console
   - Verify GoogleService-Info.plist is current
   - Verify google-services.json is current

2. **Verify APNS Certificates**
   - Check Apple Developer account for Push Notification capability
   - Generate/download APNS key (.p8 file)
   - Upload to Firebase Console

3. **Backup Current Code**
   - Create git branch: `feature/analytics-push-notifications`
   - Commit current state before making changes

4. **Review with Team**
   - Review this plan with stakeholders
   - Get approval for timeline
   - Identify any additional requirements

### Starting Implementation

1. **Begin with Phase 1** (Dependencies and Configuration)
2. **Test thoroughly after each phase**
3. **Commit frequently with descriptive messages**
4. **Document any deviations from plan**
5. **Update this document as needed**

---

## 10. Appendix

### A. Analytics Event Reference

| Event Name | Parameters | Trigger | Screen |
|------------|-----------|---------|--------|
| `app_open` | None | App launch | N/A |
| `app_in_background` | None | App backgrounded | N/A |
| `tutorial_begin` | None | Onboarding started | OnboardingScreen |
| `tutorial_complete` | None | Onboarding completed | OnboardingScreen |
| `screen_view` | `screen_name`, `screen_class` | Screen navigation | All screens |
| `play_sermon` | `sermon_id`, `sermon_title` | Play button tap | SermonDetailScreen |
| `download_sermon` | `sermon_id`, `sermon_title` | Download button tap | SermonDetailScreen |
| `create_note` | `note_id` | Note created | NoteDetailScreen |
| `edit_note` | `note_id` | Note edited | NoteDetailScreen |
| `share_note` | `note_id` | Note shared | NoteDetailScreen |
| `delete_note` | `note_id` | Note deleted | NotesListScreen |
| `view_bible` | `book`, `chapter` | Bible passage opened | BiblePassageScreen |
| `select_book` | `book` | Bible book selected | BookListScreen |
| `contact_church` | `method` (email/phone/website) | Contact button tap | MoreScreen |
| `open_social` | `platform` (facebook/instagram/youtube) | Social link tap | MoreScreen |

### B. Push Notification Payload Reference

**New Sermon Notification**:
```json
{
  "notification": {
    "title": "New Sermon Available",
    "body": "Check out the latest message: {sermon_title}"
  },
  "data": {
    "type": "new_sermon",
    "sermon_id": "123",
    "action": "open_sermon_detail"
  }
}
```

**Event Reminder Notification**:
```json
{
  "notification": {
    "title": "Upcoming Event",
    "body": "{event_name} starts in 1 hour"
  },
  "data": {
    "type": "event_reminder",
    "event_id": "456",
    "action": "open_connect_tab"
  }
}
```

### C. Useful Commands

**Enable Firebase DebugView (Android)**:
```bash
adb shell setprop debug.firebase.analytics.app com.thrivechurch.app
```

**Enable Firebase DebugView (iOS)**:
```bash
# Add to Xcode scheme: -FIRDebugEnabled
```

**View FCM Token**:
```javascript
// Add to App.tsx temporarily
import messaging from '@react-native-firebase/messaging';
messaging().getToken().then(token => console.log('FCM Token:', token));
```

**Send Test Notification**:
```bash
# Use Firebase Console > Cloud Messaging > Send test message
# Or use curl:
curl -X POST https://fcm.googleapis.com/fcm/send \
  -H "Authorization: key=YOUR_SERVER_KEY" \
  -H "Content-Type: application/json" \
  -d '{
    "to": "DEVICE_FCM_TOKEN",
    "notification": {
      "title": "Test",
      "body": "Test notification"
    }
  }'
```

### D. Resources

- [React Native Firebase Documentation](https://rnfirebase.io/)
- [Expo Firebase Guide](https://docs.expo.dev/guides/using-firebase/)
- [Firebase Analytics Events Reference](https://firebase.google.com/docs/reference/android/com/google/firebase/analytics/FirebaseAnalytics.Event)
- [Firebase Cloud Messaging Documentation](https://firebase.google.com/docs/cloud-messaging)
- [Notifee Documentation](https://notifee.app/react-native/docs/overview)
- [React Navigation Screen Tracking](https://reactnavigation.org/docs/screen-tracking/)

---

## Document History

- **Version 1.0** - Initial implementation plan created
- **Date**: 2025-10-22
- **Author**: AI Assistant (Augment Code)
- **Status**: Ready for Review

