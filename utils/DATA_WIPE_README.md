# Data Wipe Utilities

This module provides comprehensive functions to wipe all stored/persisted data in the FinSync app.

## Functions

### `wipeAllData()`
**Complete data wipe - resets app to initial state**
- Clears all SecureStore data (PIN, biometrics, onboarding, navigation, session)
- Clears all AsyncStorage data (Zustand persisted state)
- Signs out from Firebase
- Resets app to completely fresh state

```tsx
import { wipeAllData } from '@/utils/dataWipe';

// Usage
await wipeAllData();
```

### `wipeUserData()`
**User-specific data wipe - keeps app preferences**
- Clears user-specific SecureStore data (PIN, session, navigation)
- Clears Zustand persisted state
- Signs out from Firebase
- Preserves app preferences like onboarding and biometrics settings

```tsx
import { wipeUserData } from '@/utils/dataWipe';

// Usage
await wipeUserData();
```

### `resetOnboarding()`
**Reset onboarding state only**
- Clears only the onboarding completion flag
- Useful for testing onboarding flow

```tsx
import { resetOnboarding } from '@/utils/dataWipe';

// Usage
await resetOnboarding();
```

### `resetSecuritySettings()`
**Reset security settings only**
- Clears PIN and biometrics settings
- User will need to set up security again

```tsx
import { resetSecuritySettings } from '@/utils/dataWipe';

// Usage
await resetSecuritySettings();
```

## Import Options

### Direct import from utils:
```tsx
import { wipeAllData, wipeUserData, resetOnboarding, resetSecuritySettings } from '@/utils/dataWipe';
```

### Import from store (convenient):
```tsx
import { wipeAllData, wipeUserData, resetOnboarding, resetSecuritySettings } from '@/store';
```

### Import from OnboardingGate (backwards compatibility):
```tsx
import { wipeAllData, resetAllAppData } from '@/components/OnboardingGate';
```

## Demo Component

For testing purposes, use the `DataWipeDemo` component:

```tsx
import DataWipeDemo from '@/components/DataWipeDemo';

// Add to any screen for testing
<DataWipeDemo />
```

## Storage Areas Cleared

### SecureStore Keys:
- `seenOnboarding` - Onboarding completion status
- `appPin` - User's PIN code
- `biometricsEnabled` - Biometric authentication setting
- `session` - Firebase session token
- `lastRoute` - Last navigation route
- `shouldRestoreNavigation` - Navigation restoration flag

### AsyncStorage Keys:
- `app-storage-v3` - Zustand persisted state (transactions, beneficiaries, etc.)

### Firebase:
- User authentication session

## Notes

- All functions are asynchronous and return Promises
- Functions include comprehensive error handling and logging
- App restart may be required after data wipe for full effect
- Functions are safe to call multiple times
- Console logs provide feedback on operation progress
