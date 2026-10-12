<div align="center">

# Flippy Bits

<img src="https://img.shields.io/badge/TYPE-SCRIPT-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
<img src="https://img.shields.io/badge/TESTED-WITH%20VITEST-6E9F18?style=for-the-badge&logo=vitest&logoColor=white" alt="Vitest" />
<img src="https://img.shields.io/badge/DEPLOYED-ON%20VERCEL-000000?style=for-the-badge&logo=vercel&logoColor=white" alt="Vercel" />

### `01000110 01101100 01101001 01110000`

**FLIP THE BITS. MATCH THE TARGETS. SURVIVE THE FALL.**

A binary-inspired arcade game where logic meets reflexes. Manipulate an 8-bit value, eliminate falling targets, build consecutive matches, and survive as the difficulty escalates.

<br />

[**▶ PLAY THE GAME**](https://flippybits.vercel.app/) · [Features](#-gameplay--features) · [Installation](#-getting-started) · [Testing](#-testing--quality-assurance)

<br />

<img src="https://img.shields.io/badge/STATUS-LIVE-00C853?style=flat-square" alt="Live deployment" />
<img src="https://img.shields.io/badge/PLATFORM-WEB-00BCD4?style=flat-square" alt="Web platform" />
<img src="https://img.shields.io/badge/PROJECT-EDUCATIONAL-9C27B0?style=flat-square" alt="Educational project" />

</div>

---

## ◈ The Concept

**Flippy Bits** transforms binary manipulation into a fast-paced arcade challenge.

Falling targets must be resolved before they reach the bottom of the screen. Every decision matters: flip the correct bits, maintain your streak, and adapt as targets accelerate.

What begins as a simple binary-matching game gradually becomes a test of precision, reaction time, and decision-making under pressure.

<div align="center">

| `01` | `10` | `11` | `00` |
|:---:|:---:|:---:|:---:|
| FLIP | MATCH | SCORE | REPEAT |

</div>

## ◈ Gameplay & Features

### 🎮 Core Mechanics

<table>
<tr>
<td width="50%">

### ⚙️ Bit Manipulation

Control individual bits using mouse or keyboard input to modify the current 8-bit value.

</td>
<td width="50%">

### 🎯 Falling Targets

Match incoming `FallenBit` targets before they reach the bottom of the game area.

</td>
</tr>
<tr>
<td width="50%">

### 🧮 Live Score Tracking

Monitor your current score and binary value as you progress through the game.

</td>
<td width="50%">

### ♻️ Instant Restart

Press `R` to restart the game and take on the challenge again.

</td>
</tr>
<tr>
<td width="50%">

### ⏱️ Dynamic Spawning

Targets appear at random intervals between 1 and 3 seconds, keeping gameplay unpredictable.

</td>
<td width="50%">

### 📈 Progressive Difficulty

Survive longer and score higher as target movement speeds up, increasing the pressure over time.

</td>
</tr>
</table>

### 🏆 HD Extension Features

The extended implementation introduces additional mechanics beyond the core game requirements.

<details>
<summary><strong>01 · Pause & Resume System</strong></summary>

Press `P` or `Escape` to pause or resume the game.

- Stops targets from moving while paused.
- Prevents bit-flipping interactions during a pause.
- Ensures pausing cannot be used to manipulate an active match.

</details>

<details>
<summary><strong>02 · Special Target — Steep FallenBit</strong></summary>

Not every target follows the standard falling behaviour.

The special steep target follows a delayed, step-based movement pattern:

1. Remains stationary for a short interval.
2. Jumps downward by a fixed distance.
3. Waits before performing the next jump.
4. Repeats until matched or it reaches the bottom.

This introduces a distinct movement pattern into the game's target system.

</details>

<details>
<summary><strong>03 · Double-Score Bonus</strong></summary>

Reward consistency with a temporary scoring multiplier.

- Match three targets correctly in succession to activate the bonus.
- Earn double points during the active bonus period.
- Wait through a cooldown before activating the bonus again.

Consecutive successful matches become more valuable, encouraging accurate and consistent play.

</details>

<details>
<summary><strong>04 · Adaptive Difficulty Scaling</strong></summary>

The game becomes progressively more challenging through two independent factors:

- **Survival time:** targets accelerate as the player survives longer.
- **Score progression:** increasing score contributes additional speed.

Combining both factors creates a more demanding experience as the game progresses.

</details>

<details>
<summary><strong>05 · Automated Unit Testing</strong></summary>

The project includes a Vitest-based test suite covering core game logic.

Current test areas include:

- Scoring behaviour.
- Target-matching logic.
- Target movement.

These tests help validate important gameplay rules independently of the full browser interface.

</details>

---

## ◈ Controls

<div align="center">

| Input | Action |
|:---:|---|
| 🖱️ Mouse | Flip individual bits |
| ⌨️ Keyboard | Flip individual bits |
| <kbd>P</kbd> | Pause / Resume |
| <kbd>ESC</kbd> | Pause / Resume |
| <kbd>R</kbd> | Restart Game |

</div>

> **Objective:** Resolve every target before it reaches the bottom. Maintain your accuracy, build your score, and survive the increasing difficulty.

---

## ◈ Technology Stack

<div align="center">

| Technology | Role |
|:---|:---|
| <img src="https://cdn.simpleicons.org/typescript/3178C6" width="18" alt="TypeScript" /> **TypeScript** | Core game logic and type safety |
| <img src="https://cdn.simpleicons.org/html5/E34F26" width="18" alt="HTML5" /> **HTML5** | Game structure |
| <img src="https://cdn.simpleicons.org/css3/1572B6" width="18" alt="CSS3" /> **CSS3** | Styling and layout |
| <img src="https://cdn.simpleicons.org/nodedotjs/5FA04E" width="18" alt="Node.js" /> **Node.js & npm** | Development and dependency management |
| <img src="https://cdn.simpleicons.org/vitest/6E9F18" width="18" alt="Vitest" /> **Vitest** | Automated testing |
| <img src="https://cdn.simpleicons.org/prettier/F7B93E" width="18" alt="Prettier" /> **Prettier** | Code formatting |
| <img src="https://cdn.simpleicons.org/vercel/000000" width="18" alt="Vercel" /> **Vercel** | Web deployment |

</div>

---

## ◈ Getting Started

Run the project locally to explore the implementation, modify the gameplay, and execute the automated tests.

### Prerequisites

- [Node.js](https://nodejs.org/)
- npm
- [Git](https://git-scm.com/)

### 01 — Clone the Repository

```bash
git clone <YOUR_GITHUB_REPOSITORY_URL>
cd <YOUR_REPOSITORY_NAME>
```

### 02 — Install Dependencies

```bash
npm install
```

### 03 — Start the Development Server

```bash
npm run dev
```

Open the local URL displayed in your terminal.

### 04 — Run the Tests

```bash
npm test
```

### 05 — Format the Code

```bash
npx prettier . --write
```

---

## ◈ Project Structure

```text
flippy-bits/
│
├── src/
│   ├── main.ts              # Main entry point and game logic
│   └── style.css            # Game styling
│
├── test/
│   └── *.test.ts            # Unit tests
│
├── index.html               # HTML game scaffold
├── package.json             # Dependencies and npm scripts
├── .prettierrc.json         # Prettier configuration
└── README.md                # Project documentation
```

The primary game implementation lives in `src/main.ts`, keeping the core mechanics accessible for development and assessment. Additional modules can be introduced where separating responsibilities improves clarity.

---

## ◈ Testing & Quality Assurance

The project uses **Vitest** to test important game logic.

```bash
npm test
```

| Test Area | Purpose |
|---|---|
| Scoring | Validate scoring behaviour |
| Matching | Verify target-resolution logic |
| Movement | Check target movement behaviour |

Consistent formatting is maintained with Prettier:

```bash
npx prettier . --write
```

---

## ◈ Live Deployment

<div align="center">

### 🚀 READY TO PLAY?

Experience Flippy Bits directly in your browser.

[![Play on Vercel](https://img.shields.io/badge/PLAY%20NOW-Flippy%20Bits-000000?style=for-the-badge&logo=vercel&logoColor=white)](https://flippybits.vercel.app/)

**[https://flippybits.vercel.app/](https://flippybits.vercel.app/)**

No local setup is required to play the deployed version.

</div>

---

## ◈ Learning Outcomes

This project demonstrates the practical application of several software development concepts:

- **Binary representation:** manipulating individual bits within an 8-bit value.
- **TypeScript:** using static types to structure application logic.
- **Event-driven programming:** responding to keyboard and mouse input.
- **Game-loop design:** managing movement, timing, spawning, and state transitions.
- **Object-oriented design:** implementing specialised target behaviour.
- **Testing:** validating core logic using automated unit tests.
- **Difficulty balancing:** combining multiple progression factors.
- **Deployment:** publishing a browser-based application through Vercel.

---

## ◈ Project Information

| Detail | Description |
|---|---|
| Project | Flippy Bits |
| Project Type | Browser-based arcade game |
| Primary Language | TypeScript |
| Testing Framework | Vitest |
| Deployment Platform | Vercel |
| Purpose | Educational programming assignment |

---

<div align="center">

### `01000110 01001100 01001001 01010000`

**FLIP THE BITS. OWN THE GAME.**

[▶ Launch Flippy Bits](https://flippybits.vercel.app/)

<sub>Built with TypeScript · Tested with Vitest · Deployed on Vercel</sub>

</div>