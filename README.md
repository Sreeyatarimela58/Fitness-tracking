# Fitness-tracking
# FitTrack Pro

FitTrack Pro is a modern, single-page fitness tracking application built with **React**. It helps users track their daily workouts, monitor health stats like sleep and water, and visualize their progress with interactive charts.

## 🚀 Features

*   **Dashboard:** See your daily summary, current streak, and "GitHub-style" activity heatmap.
*   **Workout Log:** Log exercises (Run, Swim, Gym) and get **Live Calorie Estimates** as you type.
*   **Analytics:** Visualize your weight loss and activity trends over time with beautiful charts.
*   **Gamification:** Keep your "Streak" alive by working out daily.
*   **Secure:** Logic-based authentication and protected routes.

## 🛠️ Tech Stack

*   **Frontend:** React (Vite)
*   **Language:** JavaScript (ES6+)
*   **Styling:** Tailwind CSS
*   **Animations:** Framer Motion
*   **Charts:** Recharts
*   **Backend:** JSON Server (Local REST API)

## 📦 Installation & Setup

1.  **Clone the repository:**
    ```bash
    git clone https://github.com/StartYourDay/FitTrack-Pro.git
    cd FitTrack-Pro
    ```

2.  **Install dependencies:**
    ```bash
    npm install
    ```

3.  **Start the Backend (Database):**
    Open a terminal and run:
    ```bash
    npm run server
    ```
    *(This runs on http://localhost:3001)*

4.  **Start the Frontend (Website):**
    Open a **second** terminal and run:
    ```bash
    npm run dev
    ```
    *(This runs on http://localhost:3000)*

## 💡 How it Works

*   **Authentication:** Users login/register, and their session is stored in `localStorage`.
*   **Data Flow:** The frontend (`storage.js`) talks to the backend (`db.json`) to save workouts and stats.
*   **Live Calc:** The calorie calculator uses your **Body Weight** (from profile) and **MET values** to estimate energy burn instantly.
