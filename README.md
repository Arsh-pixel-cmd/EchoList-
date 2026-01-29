# EchoList 📡
**The To-Do List that Syncs via Sound.**

![License](https://img.shields.io/badge/license-MIT-blue.svg) ![React](https://img.shields.io/badge/built%20with-React-61DAFB.svg) ![Status](https://img.shields.io/badge/status-active-success.svg)

**EchoList** is not just another productivity app. It explores a new paradigm of **serverless, identity-less synchronization**. By combining **WebRTC (PeerJS)** for data transport and **Ultrasonic Audio (ggwave)** for device discovery, EchoList allows users to "bump" devices to link them—no login, no cloud account, no friction.

---

## ✨ Features at a Glance

### 🔊 Sonic Handshake (Audio-Based Discovery)
*   **Touch-Free Pairing**: Devices discover each other by broadcasting and listening to encrypted audio signals in the ultrasonic range.
*   **Cross-Device**: Works seamlessly between Desktop and Mobile (iOS/Android).
*   **Technical Feat**: Solved complex mobile browser audio constraints (sample rate mismatches, echo cancellation) to ensure reliable detection.

### ⚡ True P2P Sync (WebRTC)
*   **Real-Time Data**: Tasks appear on connected devices instantly (<50ms latency).
*   **De-centralized**: Data typically flows directly between peers. No central database stores your tasks.
*   **Robust Persistence**:
    *   **Auto-Reconnect**: Survives page reloads by remembering the last trusted peer.
    *   **Full History Catch-up**: New devices instantly download the complete session history upon connection.

### 🧠 Intelligent Reminders (NLP)
*   **Natural Language Parsing**: Type *"Call Mom in 20 mins"* or *"Meeting at 5pm"*.
*   **Zero-UI Scheduling**: The app parses your intent, calculates the date, and schedules a system notification automatically—no date pickers required.

### 🎨 Premium "Glassmorphism" UI
*   **Aesthetics**: Minimalist design with deep gradients, glass-pane blurring, and fluid animations using **Framer Motion**.
*   **Responsive**: Adaptive layout that feels native on both oversized studio monitors and compact mobile screens.

---

## 🛠 Tech Stack

*   **Frontend**: React.js, Vite
*   **Styling**: Tailwind CSS, Framer Motion
*   **Networking**: PeerJS (WebRTC SDPO/Signaling), ggwave (Audio Data Transport)
*   **Utilities**: chrono-node (NLP), Lucide React (Icons)

---

## 🚀 How to Run

1.  **Clone the Repo**
    ```bash
    git clone https://github.com/yourusername/echolist.git
    cd EchoList 
    ```

2.  **Install Dependencies**
    ```bash
    npm install
    ```

3.  **Start Development Server**
    ```bash
    npm run dev
    ```

4.  **Experience the Magic**
    *   Open `http://localhost:5174` on your **Laptop**.
    *   Open the network IP (e.g., `http://192.168.1.50:5174`) on your **Phone**.
    *   Click **Connect** -> **Sonic Handshake**.
    *   Set Laptop to **Broadcast**, Phone to **Listen**.
    *   *Watch them connect via sound!*

---

## 💡 Why This Project?

I built EchoList to challenge the assumption that "Sync requires a Cloud Database". It demonstrates proficiency in:
*   **Advanced Web APIs**: AudioContext, WebRTC, Notification API.
*   **Complex State Management**: Handling distributed state, race conditions, and eventual consistency.
*   **UX Engineering**: Hiding complex networking logic behind a simple, magical "sound" interaction.

---

* Crafted with ❤️ by [Arsh]
