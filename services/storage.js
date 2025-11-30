const API_URL = "http://localhost:3001";

const KEYS = {
  AUTH: "fit_track_auth",
  USER_ID: "fit_track_user_id",
  EMAIL: "fit_track_email",
};

// --- Helper for fetch ---
const api = async (endpoint, options) => {
  const response = await fetch(`${API_URL}${endpoint}`, options);
  if (!response.ok) {
    throw new Error(`API Error: ${response.statusText}`);
  }
  return response.json();
};

// --- Auth ---
export const loginUser = async (email, password) => {
  // 1. Check if user exists
  const users = await api(`/users?email=${email.toLowerCase()}`);

  if (users.length === 0) {
    throw new Error("User not found");
  }

  const user = users[0];

  // 2. Verify password (if user has one)
  // For legacy users without password, we might allow login or force reset. 
  // Here we assume strict check if password exists in DB, or if we want to enforce it.
  // For this implementation, we check if password matches.
  if (user.password && user.password !== password) {
    throw new Error("Invalid password");
  }

  // If user has no password in DB (legacy), we might allow them in? 
  // Or better, fail and ask them to register/reset. 
  // Let's assume for now we strictly require password match if it exists.
  // If it doesn't exist, we might want to fail or handle legacy. 
  // Given the requirement "include password too", let's enforce it.
  if (!user.password) {
    // If no password set, maybe allow login if they didn't provide one? 
    // But UI will force password. Let's just fail if DB has no password but user provided one.
    // Or maybe auto-migrate? Let's keep it simple: strict match.
    // Actually, if legacy user tries to login, they won't have password.
    // We should probably tell them to "Signup" again to set password or handle it.
    // For now, let's just check equality.
    // If user.password is undefined, undefined !== "somepass" -> Error.
    if (password) {
      // If they provided a password but user has none, we can't verify.
      // Let's treat it as "Invalid credentials" for security.
      throw new Error("Invalid credentials");
    }
  }

  // 3. Save session
  localStorage.setItem(KEYS.AUTH, "true");
  localStorage.setItem(KEYS.USER_ID, user.id);
  localStorage.setItem(KEYS.EMAIL, user.email);
  return user;
};

export const registerUser = async (email, password) => {
  const users = await api(`/users?email=${email.toLowerCase()}`);
  if (users.length > 0) {
    throw new Error("User already exists");
  }

  const user = await api("/users", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email: email.toLowerCase(),
      password: password, // In a real app, hash this!
      joinedDate: new Date().toISOString(),
      profile: null,
    }),
  });

  localStorage.setItem(KEYS.AUTH, "true");
  localStorage.setItem(KEYS.USER_ID, user.id);
  localStorage.setItem(KEYS.EMAIL, user.email);
  return user;
};

export const logoutUser = () => {
  localStorage.removeItem(KEYS.AUTH);
  localStorage.removeItem(KEYS.USER_ID);
  localStorage.removeItem(KEYS.EMAIL);
};

export const isAuthenticated = () => {
  return (
    localStorage.getItem(KEYS.AUTH) === "true" &&
    !!localStorage.getItem(KEYS.EMAIL)
  );
};

export const getCurrentUserId = () => {
  return localStorage.getItem(KEYS.USER_ID);
};

// --- Profile ---
export const saveProfile = async (profileData) => {
  const userId = getCurrentUserId();
  console.log(
    "saveProfile called for userId:",
    userId,
    "with data:",
    profileData
  );
  if (!userId) {
    console.error("No userId found in saveProfile");
    return;
  }

  try {
    const res = await api(`/users/${userId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ profile: profileData }),
    });
    console.log("saveProfile response:", res);
    return res;
  } catch (error) {
    console.error("saveProfile error:", error);
    throw error;
  }
};

export const getProfile = async () => {
  const userId = getCurrentUserId();
  if (!userId) return null;

  try {
    const user = await api(`/users/${userId}`);
    console.log("getProfile fetched user:", user);
    return user.profile || null;
  } catch (error) {
    console.error("Error fetching profile:", error);
    return null;
  }
};

export const clearProfile = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  return api(`/users/${userId}`, {
    method: "PATCH",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ profile: null }),
  });
};

export const calculateBMI = (heightCm, weightKg) => {
  if (!heightCm || !weightKg) return { value: 0, category: "Unknown" };
  const heightM = heightCm / 100;
  const bmi = parseFloat((weightKg / (heightM * heightM)).toFixed(1));

  let category = "";
  if (bmi < 18.5) category = "Underweight";
  else if (bmi < 24.9) category = "Normal weight";
  else if (bmi < 29.9) category = "Overweight";
  else category = "Obesity";

  return { value: bmi, category };
};

// --- Workouts ---
export const getWorkouts = async () => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return api(`/workouts?userId=${userId}`);
};

export const saveWorkout = async (workout) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const workouts = await getWorkouts();
  const existing = workouts.find((w) => w.id === workout.id);

  const workoutWithUser = { ...workout, userId };

  if (existing) {
    await api(`/workouts/${workout.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workoutWithUser),
    });
  } else {
    await api("/workouts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(workoutWithUser),
    });
  }

  await updateStreak(workout.date);
};

export const deleteWorkout = async (id) => {
  await api(`/workouts/${id}`, { method: "DELETE" });
};

const WorkoutType = {
  Running: "Running",
  Cycling: "Cycling",
  Weightlifting: "Weightlifting",
  Yoga: "Yoga",
  HIIT: "HIIT",
  Swimming: "Swimming",
  Walking: "Walking",
  Other: "Other",
  Strength: "Weightlifting",
};

const Intensity = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

// Simple calorie estimation algorithm
export const estimateCalories = (type, durationMins, intensity, weightKg) => {
  const metTable = {
    [WorkoutType.Walking]: 3.5,
    [WorkoutType.Running]: 9.8,
    [WorkoutType.Cycling]: 7.5,
    [WorkoutType.Strength]: 5.0,
    [WorkoutType.Yoga]: 2.5,
    [WorkoutType.HIIT]: 8.0,
    [WorkoutType.Swimming]: 6.0,
    [WorkoutType.Other]: 4.0,
  };

  let met = metTable[type] || 4.0;

  if (intensity === Intensity.Low) met *= 0.8;
  if (intensity === Intensity.High) met *= 1.2;

  const calories = met * weightKg * (durationMins / 60);
  return Math.round(calories);
};

// --- Daily Stats (Sleep & Water) ---
export const getAllDailyStats = async () => {
  const userId = getCurrentUserId();
  if (!userId) return [];
  return api(`/dailyStats?userId=${userId}`);
};

export const getDailyStats = async (date) => {
  const allStats = await getAllDailyStats();
  const stats = allStats.find((s) => s.date === date);
  return (
    stats || { date, waterIntake: 0, sleepHours: 0, userId: getCurrentUserId() }
  );
};

export const saveDailyStats = async (stats) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const allStats = await getAllDailyStats();
  const existing = allStats.find((s) => s.date === stats.date);

  const statsWithUser = { ...stats, userId };

  if (existing) {
    // @ts-ignore
    const id = existing.id;
    await api(`/dailyStats/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsWithUser),
    });
  } else {
    await api("/dailyStats", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(statsWithUser),
    });
  }
};

// --- Streak & Points ---
export const getStreakInfo = async () => {
  const userId = getCurrentUserId();
  if (!userId)
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: null,
      totalPoints: 0,
    };

  const streaks = await api(`/streak?userId=${userId}`);
  if (streaks.length === 0) {
    return {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: null,
      totalPoints: 0,
    };
  }
  return streaks[0];
};

const updateStreak = async (workoutDate) => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const streak = await getStreakInfo();
  const lastDate = streak.lastLogDate;

  if (lastDate === workoutDate) return;

  const wDate = new Date(workoutDate);
  const lDate = lastDate ? new Date(lastDate) : null;

  if (!lDate) {
    streak.currentStreak = 1;
    streak.longestStreak = 1;
    streak.totalPoints += 10;
    streak.lastLogDate = workoutDate;
  } else {
    const diffTime = Math.abs(wDate.getTime() - lDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    if (diffDays === 1) {
      streak.currentStreak += 1;
      if (streak.currentStreak > streak.longestStreak) {
        streak.longestStreak = streak.currentStreak;
      }
      streak.totalPoints += 10;
    } else if (diffDays > 1) {
      streak.currentStreak = 1;
      streak.totalPoints += 10;
    }

    await recalculateStreakFull();
    return;
  }

  const streakWithUser = { ...streak, userId };

  // Check if streak record exists to PUT or POST
  const existingStreaks = await api(`/streak?userId=${userId}`);
  if (existingStreaks.length > 0) {
    await api(`/streak/${existingStreaks[0].id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(streakWithUser),
    });
  } else {
    await api("/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(streakWithUser),
    });
  }
};

export const recalculateStreakFull = async () => {
  const userId = getCurrentUserId();
  if (!userId) return;

  const workouts = await getWorkouts();
  // ... (Calculation logic same as before) ...

  // Logic copy-paste from previous, just ensuring we save with userId
  if (workouts.length === 0) {
    // Save empty
    const emptyStreak = {
      currentStreak: 0,
      longestStreak: 0,
      lastLogDate: null,
      totalPoints: 0,
      userId,
    };
    const existing = await api(`/streak?userId=${userId}`);
    if (existing.length > 0) {
      await api(`/streak/${existing[0].id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyStreak),
      });
    } else {
      await api("/streak", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(emptyStreak),
      });
    }
    return;
  }

  const uniqueDates = Array.from(new Set(workouts.map((w) => w.date))).sort();
  let currentStreak = 0;
  let longestStreak = 0;
  let points = uniqueDates.length * 10;
  let tempStreak = 0;

  for (let i = 0; i < uniqueDates.length; i++) {
    if (i === 0) {
      tempStreak = 1;
    } else {
      const prev = new Date(uniqueDates[i - 1]);
      const curr = new Date(uniqueDates[i]);
      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.round(diffTime / (1000 * 60 * 60 * 24));

      if (diffDays === 1) {
        tempStreak++;
      } else {
        tempStreak = 1;
      }
    }
    if (tempStreak > longestStreak) longestStreak = tempStreak;
  }

  const lastLogDate = uniqueDates[uniqueDates.length - 1];
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const last = new Date(lastLogDate);
  last.setHours(0, 0, 0, 0);

  const diffFromToday = Math.round(
    (today.getTime() - last.getTime()) / (1000 * 60 * 60 * 24)
  );

  if (diffFromToday <= 1) {
    currentStreak = tempStreak;
  } else {
    currentStreak = 0;
  }

  const newStreakInfo = {
    currentStreak,
    longestStreak,
    lastLogDate,
    totalPoints: points,
    userId,
  };

  const existing = await api(`/streak?userId=${userId}`);
  if (existing.length > 0) {
    await api(`/streak/${existing[0].id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStreakInfo),
    });
  } else {
    await api("/streak", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(newStreakInfo),
    });
  }
};
