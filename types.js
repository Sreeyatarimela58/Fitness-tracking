// export enum Gender {
//   Male = 'Male',
//   Female = 'Female',
//   Other = 'Other'
// }

// export enum ActivityLevel {
//   Sedentary = 'Sedentary',
//   Light = 'Light',
//   Moderate = 'Moderate',
//   Active = 'Active',
//   VeryActive = 'Very Active'
// }

// export enum WorkoutType {
//   Running = 'Running',
//   Walking = 'Walking',
//   Cycling = 'Cycling',
//   Strength = 'Strength',
//   Yoga = 'Yoga',
//   HIIT = 'HIIT',
//   Swimming = 'Swimming',
//   Other = 'Other'
// }

// export enum Intensity {
//   Low = 'Low',
//   Medium = 'Medium',
//   High = 'High'
// }

// export enum Feeling {
//   Amazing = 'Amazing',
//   Good = 'Good',
//   Okay = 'Okay',
//   Tired = 'Tired',
//   Hurt = 'Hurt'
// }

// export interface UserProfile {
//   name: string;
//   age: number;
//   gender: Gender;
//   height: number; // cm
//   weight: number; // kg
//   activityLevel: ActivityLevel;
//   goalSteps: number;
//   goalCalories: number;
//   joinedDate: string;
// }

// export interface WorkoutLog {
//   id: string;
//   date: string; // ISO date string YYYY-MM-DD
//   time: string; // HH:mm
//   type: WorkoutType;
//   duration: number; // minutes
//   distance?: number; // km
//   steps?: number;
//   avgHeartRate?: number; // bpm
//   intensity: Intensity;
//   feeling: Feeling;
//   rpe?: number; // Rate of Perceived Exertion (1-10)
//   caloriesBurned: number;
//   notes?: string;
// }

// export interface StreakInfo {
//   currentStreak: number;
//   longestStreak: number;
//   lastLogDate: string | null;
//   totalPoints: number;
// }

// export interface DailyStats {
//   date: string; // YYYY-MM-DD
//   waterIntake: number; // 0-8+
//   sleepHours: number;
// }