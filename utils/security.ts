import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';

// Keys used in SecureStore
const PIN_SALT_KEY = 'appPinSalt';
const PIN_HASH_KEY = 'appPinHash';
const PIN_LEN_KEY = 'appPinLength';
const PIN_ATTEMPTS_KEY = 'appPinAttempts';
const PIN_LAST_FAIL_TS_KEY = 'appPinLastFailTs';
const BIOMETRICS_ENABLED_KEY = 'biometricsEnabled';
const AUTO_BIOMETRICS_KEY = 'autoBiometricsEnabled';
const LAST_BACKGROUND_TS_KEY = 'lastBackgroundTs';

// Defaults
const DEFAULT_PIN_LENGTH = 4; // Keep 4 to avoid breaking existing UX

// Basic cooldown schedule (attempts since last success)
const cooldownForAttempts = (attempts: number): number => {
  if (attempts >= 10) return 5 * 60 * 1000; // 5 min
  if (attempts >= 8) return 60 * 1000; // 60s
  if (attempts >= 5) return 30 * 1000; // 30s
  return 0;
};

async function getRandomHex(bytes = 16): Promise<string> {
  const arr = Crypto.getRandomBytes(bytes);
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

async function sha256(input: string): Promise<string> {
  return await Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, input);
}

// Derive a hash using simple iterative SHA-256 with salt (lightweight KDF substitute)
async function deriveHash(pin: string, salt: string, rounds = 1000): Promise<string> {
  let data = salt + ':' + pin;
  let hash = await sha256(data);
  for (let i = 0; i < rounds; i++) {
    hash = await sha256(hash + ':' + salt);
  }
  return hash;
}

export async function isPasscodeSet(): Promise<boolean> {
  const hash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  return !!hash;
}

export async function getPasscodeLength(): Promise<number> {
  const len = await SecureStore.getItemAsync(PIN_LEN_KEY);
  return len ? parseInt(len, 10) : DEFAULT_PIN_LENGTH;
}

export async function setPasscode(pin: string): Promise<void> {
  const salt = await getRandomHex(16);
  const hash = await deriveHash(pin, salt);
  await SecureStore.setItemAsync(PIN_SALT_KEY, salt);
  await SecureStore.setItemAsync(PIN_HASH_KEY, hash);
  await SecureStore.setItemAsync(PIN_LEN_KEY, String(pin.length));
  // Reset attempts on successful set
  await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(PIN_LAST_FAIL_TS_KEY);
}

export type VerifyResult = {
  success: boolean;
  remainingCooldownMs: number;
};

export async function verifyPasscode(pin: string): Promise<VerifyResult> {
  const lastTsStr = await SecureStore.getItemAsync(PIN_LAST_FAIL_TS_KEY);
  const attemptsStr = await SecureStore.getItemAsync(PIN_ATTEMPTS_KEY);
  const attempts = attemptsStr ? parseInt(attemptsStr, 10) : 0;
  const lastTs = lastTsStr ? parseInt(lastTsStr, 10) : 0;
  const now = Date.now();

  // Check cooldown
  const cooldown = cooldownForAttempts(attempts);
  if (cooldown > 0) {
    const remaining = Math.max(0, cooldown - (now - lastTs));
    if (remaining > 0) {
      return { success: false, remainingCooldownMs: remaining };
    }
  }

  const salt = (await SecureStore.getItemAsync(PIN_SALT_KEY)) || '';
  const savedHash = await SecureStore.getItemAsync(PIN_HASH_KEY);
  if (!salt || !savedHash) {
    return { success: false, remainingCooldownMs: 0 };
  }
  const hash = await deriveHash(pin, salt);
  if (hash === savedHash) {
    // Success: reset attempts
    await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
    await SecureStore.deleteItemAsync(PIN_LAST_FAIL_TS_KEY);
    return { success: true, remainingCooldownMs: 0 };
  }

  // Failure: increment attempts and set timestamp
  const newAttempts = attempts + 1;
  await SecureStore.setItemAsync(PIN_ATTEMPTS_KEY, String(newAttempts));
  await SecureStore.setItemAsync(PIN_LAST_FAIL_TS_KEY, String(now));
  const newCooldown = cooldownForAttempts(newAttempts);
  return { success: false, remainingCooldownMs: newCooldown };
}

export async function clearPasscode(): Promise<void> {
  await SecureStore.deleteItemAsync(PIN_SALT_KEY);
  await SecureStore.deleteItemAsync(PIN_HASH_KEY);
  await SecureStore.deleteItemAsync(PIN_LEN_KEY);
  await SecureStore.deleteItemAsync(PIN_ATTEMPTS_KEY);
  await SecureStore.deleteItemAsync(PIN_LAST_FAIL_TS_KEY);
}

export async function setBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(BIOMETRICS_ENABLED_KEY, enabled ? 'true' : 'false');
}

export async function getBiometricsEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(BIOMETRICS_ENABLED_KEY);
  return v === 'true';
}

export async function setAutoBiometricsEnabled(enabled: boolean): Promise<void> {
  await SecureStore.setItemAsync(AUTO_BIOMETRICS_KEY, enabled ? 'true' : 'false');
}

export async function getAutoBiometricsEnabled(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(AUTO_BIOMETRICS_KEY);
  return v === 'true';
}

// Migration helper: if legacy plaintext appPin exists, migrate to hashed store
export async function migrateLegacyPlaintextPinIfNeeded(): Promise<void> {
  try {
    const legacyPin = await SecureStore.getItemAsync('appPin');
    const hasNew = await isPasscodeSet();
    if (legacyPin && !hasNew) {
      await setPasscode(legacyPin);
      await SecureStore.deleteItemAsync('appPin');
    }
  } catch (e) {
    // ignore
  }
}

// Session unlock tracking
const SESSION_UNLOCK_KEY = 'sessionUnlocked';

export async function setSessionUnlocked(unlocked: boolean): Promise<void> {
  if (unlocked) {
    await SecureStore.setItemAsync(SESSION_UNLOCK_KEY, 'true');
  } else {
    await SecureStore.deleteItemAsync(SESSION_UNLOCK_KEY);
  }
}

export async function getSessionUnlocked(): Promise<boolean> {
  const v = await SecureStore.getItemAsync(SESSION_UNLOCK_KEY);
  return v === 'true';
}

export const SecurityKeys = {
  PIN_SALT_KEY,
  PIN_HASH_KEY,
  PIN_LEN_KEY,
  PIN_ATTEMPTS_KEY,
  PIN_LAST_FAIL_TS_KEY,
  BIOMETRICS_ENABLED_KEY,
  AUTO_BIOMETRICS_KEY,
  SESSION_UNLOCK_KEY,
  LAST_BACKGROUND_TS_KEY,
};

// Inactivity helpers --------------------------------------------------------
// We persist the timestamp when the app moved to background so that if the
// process is killed by the OS while in background and relaunched later, we can
// still enforce a lock if the inactivity threshold was exceeded.

export async function setLastBackgroundTimestamp(ts: number): Promise<void> {
  try {
    await SecureStore.setItemAsync(LAST_BACKGROUND_TS_KEY, String(ts));
  } catch {}
}

export async function getLastBackgroundTimestamp(): Promise<number | null> {
  try {
    const v = await SecureStore.getItemAsync(LAST_BACKGROUND_TS_KEY);
    return v ? parseInt(v, 10) : null;
  } catch {
    return null;
  }
}

export async function clearLastBackgroundTimestamp(): Promise<void> {
  try {
    await SecureStore.deleteItemAsync(LAST_BACKGROUND_TS_KEY);
  } catch {}
}
