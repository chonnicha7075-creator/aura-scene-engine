# ✦ AURA — Scene Atmosphere Engine

> A SillyTavern extension that transforms the chat UI in real-time based on the scene your bot is narrating.

![version](https://img.shields.io/badge/version-1.0.0-purple)
![ST compatible](https://img.shields.io/badge/SillyTavern-latest-blue)

---

## Features

- 🎭 **8 built-in scene themes** — Dark, Action, Romance, Mystery, Magic, Horror, Wuxia, Neutral
- ✨ **Particle effects** — floating orbs, embers, petals, sparks — unique per scene
- 🎬 **Cinematic transition cards** — appear when scene changes, then gracefully fade
- 🔍 **Dual detection** — explicit `[AURA:scene]` tags OR auto keyword detection
- ⚙️ **Settings panel** — live controls inside ST Extensions tab
- 🎨 **Non-destructive** — works on top of any ST theme, no theme replacement

---

## Installation

1. In SillyTavern, go to **Extensions** → **Install Extension**
2. Paste this URL:
   ```
   https://github.com/chonnicha7075-creator/aura-scene-engine
   ```
3. Click **Install** and reload if prompted.

---

## How to Use

### Method 1: Tag-based (Recommended)

Add this to your **Character Card System Prompt** or **World Info**:

```
When the scene mood changes significantly, include a tag at the START of your response:
[AURA:dark]     — noir, night, shadow, tension
[AURA:action]   — combat, chase, intense moment
[AURA:romance]  — tender, intimate, emotional
[AURA:mystery]  — suspense, unknown, investigation
[AURA:magic]    — spells, enchantment, fantasy
[AURA:horror]   — terror, dread, supernatural
[AURA:wuxia]    — martial arts, swords, historical
[AURA:neutral]  — reset to default
The tag will be automatically hidden from the displayed message.
```

**Example AI output:**
```
[AURA:action]
เขาถลาเข้าหาอย่างรวดเร็ว กำปั้นพุ่งตรงมาที่หน้าคุณ...
```

### Method 2: Auto Keyword Detection

Enable **Auto Keyword Detection** in settings. AURA will detect scene from keywords automatically — no tags needed. Works in Thai and English.

### Method 3: Manual Override

Click any scene button in the AURA settings panel to force-set the scene.

---

## Scene Reference

| Tag | Scene | Triggers |
|-----|-------|----------|
| `[AURA:dark]` | 🌑 Dark / Noir | กลางคืน, มืด, เงา / night, shadow, noir |
| `[AURA:action]` | 🔥 Action | ต่อสู้, ระเบิด / fight, battle, combat |
| `[AURA:romance]` | 🌸 Romance | รัก, จูบ, กอด / love, kiss, embrace |
| `[AURA:mystery]` | 🌫️ Mystery | ปริศนา, สืบสวน / secret, detective |
| `[AURA:magic]` | ✦ Magic | เวทย์, มนตร์ / spell, magic, enchant |
| `[AURA:horror]` | 💀 Horror | สยอง, ผี / ghost, terror, scream |
| `[AURA:wuxia]` | ⚔️ Wuxia | กำลังภายใน, ดาบ / martial, sword |
| `[AURA:neutral]` | ◈ Neutral | resets to default |

---

## Settings

| Option | Description |
|--------|-------------|
| Enable AURA | Master on/off switch |
| Scene Card | Show/hide cinematic transition card |
| Particle Effects | Enable/disable floating particles |
| Auto Detection | Keyword-based scene detection |
| Overlay Opacity | Control atmosphere intensity (10–90%) |

---

## Compatibility

- ✅ Works with all ST themes (dark and light)
- ✅ Compatible with Regex extensions
- ✅ Mobile-friendly (ST mobile app)
- ✅ Thai and English detection

---

## License

MIT — free to use, modify, and share.

---

*Made for SillyTavern roleplay. Because atmosphere matters.* ✦
