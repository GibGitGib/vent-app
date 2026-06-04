# Vent App — iOS Lock Screen Widget Blueprint

## What It Does

A Lock Screen widget that lets users start venting **without navigating the app**.
One tap → Face ID → listening mode → notification → full app.

```
┌─────────────────────────────────────────────────────┐
│                   LOCK SCREEN                        │
│                                                      │
│   ┌──────────┐                                       │
│   │  💛 Vent  │  ← Lock Screen Widget                 │
│   │  Tap to   │     User taps this                    │
│   │   vent    │                                       │
│   └──────────┘                                       │
│        │                                              │
│        ▼ Face ID authenticates (seamless)             │
│   ┌──────────────────────────────────────────┐       │
│   │           VENT APP OPENS                   │       │
│   │                                            │       │
│   │         🎙️  (auto-recording)               │       │
│   │      Tap to start venting                  │       │
│   │   Say "done" or "that's it" to finish     │       │
│   │                                            │       │
│   └──────────────────────────────────────────┘       │
│        │                                              │
│        ▼ User vents, says "done"                       │
│        ▼ AI processes locally (Ollama)                 │
│        ▼ App sends LOCAL NOTIFICATION                  │
│                                                      │
│   ┌──────────────────────────────────────────┐       │
│   │  🔔  VENT APP                              │       │
│   │  Your vent was heard 💛                    │       │
│   │  "I hear you. That sounds really..."       │       │
│   │  ─────────────────────────────             │       │
│   │  [ Tap to open full app ]                  │       │
│   └──────────────────────────────────────────┘       │
│        │                                              │
│        ▼ User taps notification                        │
│   ┌──────────────────────────────────────────┐       │
│   │           FULL APP                         │       │
│   │                                            │       │
│   │  Chat history, personality switcher,       │       │
│   │  mood tracking, settings                    │       │
│   │                                            │       │
│   └──────────────────────────────────────────┘       │
└─────────────────────────────────────────────────────┘
```

## Technical Implementation

### 1. Lock Screen Widget (WidgetKit / SwiftUI)

```swift
// VentWidget.swift
import WidgetKit
import SwiftUI

struct VentWidget: View {
    var body: some View {
        ZStack {
            // Dark background matching app
            Color(red: 0.10, green: 0.10, blue: 0.18)

            VStack(spacing: 4) {
                Text("💛")
                    .font(.system(size: 20))
                Text("Vent")
                    .font(.system(size: 11, weight: .bold))
                    .foregroundColor(.white)
            }
        }
        // THIS IS THE KEY LINE:
        // Deep link opens app directly to quick-vent recording mode
        .widgetURL(URL(string: "ventapp://quick-vent"))
    }
}

struct VentWidgetEntryView: View {
    var entry: Provider.Entry

    var body: some View {
        VentWidget()
    }
}

// Register as Lock Screen widget (accessoryCircular / accessoryRectangular)
@main
struct VentWidgetBundle: WidgetBundle {
    var body: some Widget {
        VentWidget()
            .configurationDisplayName("Quick Vent")
            .description("One tap to start venting.")
            .supportedFamilies([
                .accessoryCircular,     // Small circle (Lock Screen)
                .accessoryRectangular   // Wider rectangle (Lock Screen)
            ])
    }
}
```

### 2. Deep Link Handler (AppDelegate / SceneDelegate)

```swift
// In AppDelegate.swift or VentApp.swift (SwiftUI lifecycle)

import SwiftUI

@main
struct VentApp: App {
    @StateObject private var appState = AppState()

    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
                .onOpenURL { url in
                    handleDeepLink(url)
                }
        }
    }

    func handleDeepLink(_ url: URL) {
        // ventapp://quick-vent → start recording immediately
        if url.host == "quick-vent" || url.path.contains("quick-vent") {
            appState.launchMode = .quickVent  // triggers recording UI
        }
    }
}

enum LaunchMode {
    case normal
    case quickVent  // Lock Screen widget path
}

class AppState: ObservableObject {
    @Published var launchMode: LaunchMode = .normal
}
```

### 3. Recording View (auto-starts on deep link)

```swift
// QuickVentView.swift
struct QuickVentView: View {
    @State private var isRecording = false
    @State private var transcript = ""
    @State private var aiResponse = ""
    @State private var phase: VentPhase = .ready

    enum VentPhase { case ready, listening, processing, done }

    var body: some View {
        VStack(spacing: 24) {
            // Record button (matching PWA design)
            Button(action: toggleRecording) {
                ZStack {
                    Circle()
                        .fill(phase == .listening ? Color.yellow.opacity(0.2) : Color.clear)
                        .frame(width: 120, height: 120)

                    Circle()
                        .stroke(phase == .listening ? Color.yellow : Color.red, lineWidth: 4)
                        .frame(width: 120, height: 120)

                    Text(phase == .listening ? "🎧" : "🎙️")
                        .font(.system(size: 48))
                }
            }

            Text(phase == .ready ? "Tap to start venting" :
                 phase == .listening ? "Listening... say \"done\" when finished" :
                 phase == .processing ? "Processing..." : "Done!")
                .foregroundColor(.gray)

            if !transcript.isEmpty {
                Text(transcript)
                    .padding()
                    .background(Color.white.opacity(0.05))
                    .cornerRadius(12)
            }
        }
        .onAppear {
            // Auto-start if launched from widget
            if appState.launchMode == .quickVent {
                startRecording()
            }
        }
    }
}
```

### 4. Local Notification (after vent completes)

```swift
import UserNotifications

func sendVentCompleteNotification(response: String) {
    let content = UNMutableNotificationContent()
    content.title = "Vent App 💛"
    content.body = String(response.prefix(80)) + (response.count > 80 ? "..." : "")
    content.sound = .default

    // 👇 THIS makes it a lock-screen notification the user can tap
    // to open the full app
    content.userInfo = ["deepLink": "ventapp://chat"]

    let trigger = UNTimeIntervalNotificationTrigger(timeInterval: 1, repeats: false)
    let request = UNNotificationRequest(
        identifier: "vent-complete-\(Date().timeIntervalSince1970)",
        content: content,
        trigger: trigger
    )

    UNUserNotificationCenter.current().add(request)
}
```

### 5. Notification Tap Handler

```swift
// AppDelegate or App entry point
func userNotificationCenter(
    _ center: UNUserNotificationCenter,
    didReceive response: UNNotificationResponse,
    withCompletionHandler completionHandler: @escaping () -> Void
) {
    if let deepLink = response.notification.request.content.userInfo["deepLink"] as? String {
        // ventapp://chat → open full conversation
        handleDeepLink(URL(string: deepLink)!)
    }
    completionHandler()
}
```

## Required Permissions & Capabilities

### Info.plist additions:
```xml
<key>NSSpeechRecognitionUsageDescription</key>
<string>Vent App needs microphone access to hear what you want to get off your chest.</string>

<key>NSMicrophoneUsageDescription</key>
<string>Vent App listens when you want to vent. Nothing is recorded permanently.</string>

<key>CFBundleURLTypes</key>
<array>
    <dict>
        <key>CFBundleURLSchemes</key>
        <array>
            <string>ventapp</string>
        </array>
    </dict>
</array>
```

### Xcode Capabilities:
- ☑ Push Notifications
- ☑ Background Modes (audio — allows recording to continue briefly if phone locks)
- ☑ App Groups (for Widget ↔ App data sharing, optional)

## User Experience Summary

| Step | User Action | What Happens |
|------|-------------|--------------|
| 1 | **Tap widget on Lock Screen** | Face ID authenticates, app opens to recording screen |
| 2 | **Start talking** | Voice recognition begins. "Say done to finish" shown |
| 3 | **Say "done"** | Recording stops, text sent to local Ollama |
| 4 | **(wait 2-5 seconds)** | AI processes and responds |
| 5 | **Notification appears** | "Your vent was heard 💛" with response preview |
| 6 | **Tap notification** | Full app opens with chat history and personality controls |

## Privacy Design

- **No cloud**: Ollama runs locally on-device (or user's own server)
- **No data leaves the phone**: Speech recognition uses Apple's on-device Speech framework
- **Local storage only**: Conversation history stays in app sandbox
- **Widget shows no data**: Lock Screen widget only shows icon + "Vent" — no content leaks

## PWA Fallback (what we built today)

For users who don't have the native iOS app yet, the PWA at `vent-app/index.html` handles:
- `?mode=quick-vent` URL param → same lock-screen-like instant recording flow
- In-app notification prompt after vent session
- Full conversation access on tap

Add to Home Screen on iPhone → functions as a standalone app with the same flow.
