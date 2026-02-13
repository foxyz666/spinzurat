# Spânzurătoarea Online (Hangman Online)

A multiplayer Hangman game built with Firebase Realtime Database for real-time synchronization between players.

## 🎮 Features

### Party/Lobby System
- **Create Party**: Generate a unique 6-character party code
- **Join Party**: Connect using a friend's party code
- **Party Settings**: 
  - Configurable expiration time (5-60 minutes)
  - Adjustable number of rounds (5-12 rounds)
- **Real-time Player List**: See who's in your party instantly

### Gameplay
- **2-Player Multiplayer**: One player chooses words, the other guesses
- **Role Rotation**: Roles automatically swap after each round
- **Word Selection**: 
  - Easy word suggestions in Romanian
  - Random word generator
  - Custom word/phrase input
- **Letter Guessing**:
  - Visual on-screen keyboard
  - Manual letter input
  - Real-time feedback (green for correct, red for wrong)
- **Romanian Character Support**: Automatic normalization for ă, â, î, ș, ț
- **Visual Hangman**: SVG-based drawing with 7 body parts

### Technical Features
- **Firebase Realtime Database**: All game state synchronized in real-time
- **Room Management**: Rooms stored at `rooms/<partyCode>` in Firebase
- **Transaction-based Updates**: Prevents race conditions in multiplayer
- **Auto-expiration**: Parties automatically expire after set time
- **Countdown Timer**: 5-second countdown before game starts
- **Responsive Design**: Works on desktop and mobile devices

## 🚀 How to Play

### Creating a Party
1. Enter your name
2. Select expiration time and number of rounds
3. Click "Create Party"
4. Share the generated 6-character code with a friend
5. Wait for them to join

### Joining a Party
1. Enter your name
2. Click "Join Party"
3. Enter the party code from your friend
4. Click "Connect"
5. Wait for the game to start

### Game Flow
1. **Lobby**: Wait for second player (auto-starts after 5 seconds)
2. **Choosing Phase**: Chooser selects a word or phrase
3. **Playing Phase**: Guesser guesses letters one at a time
4. **Round End**: Winner declared, roles swap automatically
5. **Next Round**: Process repeats until all rounds are complete

## 🛠️ Technology Stack

- **Frontend**: HTML5, CSS3, Vanilla JavaScript
- **Backend**: Firebase Realtime Database
- **Styling**: Custom CSS with gradient backgrounds and animations
- **Game Logic**: Pure JavaScript with real-time Firebase listeners

## 📁 Project Structure

```
spinzurat/
├── index.html      # Main HTML structure (lobby + game screens)
├── script.js       # Game logic and Firebase integration
├── style.css       # Styling and responsive design
└── README.md       # This file
```

## 🔧 Setup

### Prerequisites
- A web server (can use Python's `python3 -m http.server`)
- Internet connection (for Firebase CDN)

### Firebase Configuration
The project is pre-configured with Firebase credentials in `script.js`. The Firebase project uses:
- **Database**: Firebase Realtime Database (Europe West 1)
- **Database Structure**: `rooms/<partyCode>/{game state}`

### Running Locally
1. Clone the repository
2. Start a local web server:
   ```bash
   python3 -m http.server 8080
   ```
3. Open browser to `http://localhost:8080`
4. Enjoy playing!

## 📊 Code Statistics

- **Total**: 1,062 lines
- **JavaScript**: 697 lines (game logic, Firebase integration)
- **HTML**: 171 lines (UI structure)
- **CSS**: 194 lines (styling)

## 🎯 Game Rules

- **Objective**: Guesser must guess the word before making 7 wrong guesses
- **Winning**: Guess all letters correctly
- **Losing**: Make 7 incorrect guesses (complete hangman)
- **Scoring**: Track wins across multiple rounds
- **Role Swap**: After each round, Chooser becomes Guesser and vice versa

## 🌐 Language

The game interface is in Romanian (Romanian language UI and word suggestions).

## 📝 License

This project is open source and available for educational purposes.