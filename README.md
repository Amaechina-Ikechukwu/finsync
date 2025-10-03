# 💰 FinSync - Modern Financial Services App

[![React Native](https://img.shields.io/badge/React%20Native-0.74-blue.svg)](https://reactnative.dev/)
[![Expo](https://img.shields.io/badge/Expo-53.0-black.svg)](https://expo.dev/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

A comprehensive mobile financial services application built with React Native and Expo, offering seamless VTU services, bill payments, and financial management tools.

## ✨ Features

### 🔐 Security & Authentication
- **Biometric Authentication** (Face ID, Touch ID, Fingerprint)
- **PIN-based Security** with app lock functionality
- **Session Management** with automatic locking
- **Secure Storage** for sensitive data

### 💸 VTU Services
- **Airtime Purchase** - Buy airtime for all major networks (MTN, GLO, Airtel, 9Mobile)
- **Data Bundles** - Purchase internet data plans with network auto-detection
- **Cable TV Subscriptions** - Pay for GOtv, DStv, Startimes, and Showmax
- **Electricity Bills** - Pay electricity bills for all major distribution companies
- **Betting Wallet Funding** - Top up betting accounts

### 👥 Beneficiary Management
- **Save Beneficiaries** for quick repeat transactions
- **Smart Duplicate Detection** prevents duplicate entries
- **Multiple Service Types** support (VTU, Cable, Electricity, Betting)
- **Quick Access** to frequently used services

### 📊 Financial Dashboard
- **Account Overview** with real-time balance
- **Transaction History** with categorized spending
- **Revenue Charts** and financial analytics
- **Weekly Summary** statistics

### 🎨 User Experience
- **Dark/Light Theme** support
- **Smooth Animations** and transitions
- **Skeleton Loading** for better perceived performance
- **Haptic Feedback** for enhanced interactions
- **Responsive Design** for all screen sizes

### 🚀 Performance
- **Optimized Data Fetching** with smart caching
- **State Management** with Zustand
- **Navigation Restoration** after app lock
- **Background State Handling**

## 🛠 Tech Stack

- **Framework**: React Native with Expo
- **Language**: TypeScript
- **Navigation**: Expo Router (file-based routing)
- **State Management**: Zustand with persistence
- **UI Components**: Custom themed components
- **Animations**: React Native Animated API
- **Storage**: AsyncStorage + Expo SecureStore
- **Authentication**: Expo Local Authentication
- **Icons**: Expo Vector Icons with SF Symbols mapping

## � Getting Started

### Prerequisites
- Node.js (v18 or higher)
- Expo CLI (`npm install -g @expo/cli`)
- iOS Simulator or Android Emulator (optional)
- Expo Go app on your mobile device

### Installation

1. **Clone the repository**
   ```bash
   git clone https://github.com/[your-username]/finsync.git
   cd finsync
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npx expo start
   ```

4. **Run on your device**
   - Scan QR code with Expo Go app
   - Or run on simulator: `npx expo start --ios` or `npx expo start --android`

## 🏗 Project Structure

```
app/
├── (tabs)/                 # Tab navigation screens
│   ├── index.tsx          # Home dashboard
│   ├── explore.tsx        # Explore features
│   ├── profile.tsx        # User profile
│   └── utilities.tsx      # Utility services
├── vtu/                   # VTU service screens
│   ├── index.tsx          # Airtime purchase
│   ├── buy-data.tsx       # Data bundle purchase
│   ├── buy-cable.tsx      # Cable TV subscriptions
│   ├── buy-electricity.tsx # Electricity bill payment
│   └── fund-betting.tsx   # Betting wallet funding
├── auth screens...        # Authentication flow
└── _layout.tsx           # Root layout with navigation

components/
├── ui/                   # Reusable UI components
├── home/                 # Home screen components
├── security/             # Security-related components
└── themed components...  # Theme-aware components

services/
├── apiClient.ts          # HTTP client configuration
└── apiService.ts         # API service definitions

store/
├── appStore.ts           # App-wide state management
└── simpleStore.ts        # Data and beneficiary management
```

## 🔧 Configuration

### Environment Setup
The app uses TypeScript and requires no additional environment configuration for development.

### API Integration
This is a frontend application. Update the API base URL in `services/apiClient.ts` to connect to your backend services. The app includes mock API service definitions that can be integrated with any compatible backend.

### Firebase (Optional)
Firebase configuration is available in `firebase.ts` for additional features like push notifications and analytics.

## 📱 Screenshots

> Add screenshots of your app here to showcase the UI and features

## 🎯 Demo

> Add a link to a live demo or video walkthrough of the app

## 📱 Supported Services
### Mobile Networks
- MTN Nigeria
- GLO Nigeria  
- Airtel Nigeria
- 9Mobile Nigeria

### Cable TV Providers
- GOtv
- DStv
- Startimes
- Showmax

### Electricity Companies
- AEDC (Abuja Electric)
- BEDC (Benin Electric)
- EKEDC (Eko Electric)
- EEDC (Enugu Electric)
- IBEDC (Ibadan Electric)
- IKEDC (Ikeja Electric)
- And 6 more distribution companies

## 🎯 Key Features Deep Dive

### Beneficiary System
- Automatic customer info population
- Service-specific duplicate detection
- Quick selection for repeat transactions
- Persistent storage across app sessions

### Security Features
- PIN requirement for app access
- Biometric unlock support
- Automatic session timeout
- Secure credential storage

#### Inactivity Lock
If the app stays in the background or inactive state for 5 minutes or longer, the session is automatically re-locked. On returning to the app the user is redirected to the unlock screen (`/auth/app-unlock`) and must re-enter their PIN (or biometrics if enabled). The last background timestamp is persisted using SecureStore so even if the OS kills the app while backgrounded, the inactivity period is still enforced on next launch. Adjust the timeout by changing `INACTIVITY_LOCK_MS` in `app/_layout.tsx`.

### Smart UX
- Network auto-detection for VTU services
- Skeleton loading screens
- Pull-to-refresh functionality
- Haptic feedback integration

## 🚗 Roadmap

- [ ] **Payment Gateway Integration** - Stripe, Paystack, Flutterwave
- [ ] **Bank Transfer Features** - Account-to-account transfers
- [ ] **QR Code Payments** - Scan-to-pay functionality
- [ ] **Expense Tracking** - Categorized spending analysis
- [ ] **Budget Management** - Set and track spending limits
- [ ] **Multi-language Support** - Internationalization
- [ ] **Offline Mode** - Basic functionality without internet
- [ ] **Social Features** - Split bills and group payments

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- Built with [Expo](https://expo.dev/)
- Icons from [SF Symbols](https://developer.apple.com/sf-symbols/)
- Design inspiration from modern fintech apps

---

**Note**: This is a demo application. Ensure proper security audits and compliance checks before using in production environments.
