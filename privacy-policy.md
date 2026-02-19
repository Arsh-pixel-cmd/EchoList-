# Privacy Policy — EchoList

**Last Updated:** February 20, 2026

## Introduction

EchoList ("we", "our", "the app") is an open-source task management application. This Privacy Policy explains how we handle your information.

## Data Collection

**We do not collect, store, or transmit any personal data to external servers.**

EchoList is a local-first application. All data — including tasks, reminders, and notification history — is stored exclusively on your device using your browser's local storage or the native app's local database.

## Information We Do NOT Collect

- Personal identifiers (name, email, phone number)
- Location data
- Device identifiers or fingerprints
- Usage analytics or behavioral data
- Photos, contacts, or any other sensitive device data

## Permissions

EchoList may request the following device permissions:

| Permission | Purpose |
|:-----------|:--------|
| **Notifications** | To deliver local reminders for your scheduled tasks. Notifications are generated entirely on-device. |
| **Microphone** | Used exclusively for the Sonic Sync feature, which transmits ultrasonic audio signals between nearby devices on the same network. No audio is recorded, stored, or transmitted to any server. |
| **Camera** | Optional. Used only if you choose to capture a photo for a task. Photos are stored locally and never uploaded. |

## Sonic Sync (Peer-to-Peer)

The Sonic Sync feature connects two devices using ultrasonic audio and a peer-to-peer WebRTC connection. This connection is:

- **Direct:** Data is transmitted device-to-device, not through any server.
- **Ephemeral:** No connection data or task data is stored after the session ends.
- **Local Network Only:** Both devices must be on the same Wi-Fi network.

## Third-Party Services

EchoList uses **Vercel Analytics** on the web version only to collect anonymous, aggregate page-view statistics. This does not include any personal data or task content. You can learn more at [Vercel's Privacy Policy](https://vercel.com/legal/privacy-policy).

No other third-party services, SDKs, or trackers are included in the application.

## Data Storage

All data is stored locally on your device:

- **Web:** Browser `localStorage`
- **Android/iOS:** Capacitor local storage (sandboxed to the app)

Uninstalling the app or clearing browser data will permanently delete all stored tasks and notification history.

## Children's Privacy

EchoList does not knowingly collect data from children under 13. Since no personal data is collected from any user, this app is safe for all ages.

## Changes to This Policy

We may update this Privacy Policy from time to time. Changes will be reflected in the "Last Updated" date above. Continued use of the app constitutes acceptance of the updated policy.

## Contact

If you have questions about this Privacy Policy, please open an issue on our GitHub repository:

**GitHub:** [github.com/Arsh-pixel-cmd/EchoList-](https://github.com/Arsh-pixel-cmd/EchoList-)

---

*EchoList is open source. You can inspect the entire codebase to verify these claims.*
