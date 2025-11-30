import React, { useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Legend,
  AreaChart,
  Area,
} from "recharts";
import {
  Flame,
  Footprints,
  Trophy,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  BarChart2,
  PlusCircle,
  Droplets,
  Moon,
  Plus,
  Minus,
  X,
  Edit3,
} from "lucide-react";
import {
  getProfile,
  getWorkouts,
  getStreakInfo,
  recalculateStreakFull,
  getDailyStats,
  saveDailyStats,
  getAllDailyStats,
  getCurrentUserId,
} from "../services/storage";

const Intensity = {
  Low: "Low",
  Medium: "Medium",
  High: "High",
};

const Dashboard = () => {
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [streak, setStreak] = useState(null);

  // Robust Date Helper: Uses en-CA for YYYY-MM-DD format which matches input[type="date"]
  const getLocalISODate = (d) => {
    const date = d || new Date();
    return date.toLocaleDateString("en-CA");
  };

  const today = getLocalISODate();

  // Daily Stats State
  const [todayStats, setTodayStats] = useState({
    date: today,
    waterIntake: 0,
    sleepHours: 0,
  });
  const [dailyStatsHistory, setDailyStatsHistory] = useState([]);

  // Modal State for Health Stats
  const [isHealthModalOpen, setIsHealthModalOpen] = useState(false);
  const [tempHealthStats, setTempHealthStats] = useState({
    water: 0,
    sleep: 0,
  });

  // Year Switching State
  const currentYear = new Date().getFullYear();
  const [selectedYear, setSelectedYear] = useState(currentYear);
  const [availableYears, setAvailableYears] = useState([currentYear]);

  // Explicit Colors for Recharts (works better than CSS vars)
  const COLORS = {
    primary: "#10b981", // Emerald 500
    secondary: "#3b82f6", // Blue 500
    accent: "#f59e0b", // Amber 500
    danger: "#ef4444", // Red 500
    chart1: "#10b981",
    chart2: "#0ea5e9",
    chart3: "#6366f1",
    chart4: "#f97316",
    chart5: "#ec4899",
    grid: "#e5e7eb", // Gray 200
    text: "#9ca3af", // Gray 400
  };

  const PIE_COLORS = [
    COLORS.chart1,
    COLORS.chart2,
    COLORS.chart3,
    COLORS.chart4,
    COLORS.chart5,
    "#8884d8",
    "#82ca9d",
  ];

  useEffect(() => {
    const loadData = async () => {
      try {
        await recalculateStreakFull(); // Ensure streak is fresh
        const p = await getProfile();
        setProfile(p);

        const loadedWorkouts = await getWorkouts();
        setWorkouts(loadedWorkouts);

        const s = await getStreakInfo();
        setStreak(s);

        // Load Today's Stats
        const stats = await getDailyStats(today);
        setTodayStats(stats);
        const history = await getAllDailyStats();
        setDailyStatsHistory(history);

        // Calculate available years from data
        if (loadedWorkouts.length > 0) {
          const workoutYears = new Set(
            loadedWorkouts.map((w) => new Date(w.date).getFullYear())
          );
          workoutYears.add(currentYear);
          setAvailableYears(Array.from(workoutYears).sort((a, b) => b - a)); // Descending
        }
      } catch (error) {
        console.error("Failed to load dashboard data", error);
        toast.error("Failed to load dashboard data: " + error.message); // Debug
      }
    };
    loadData();
  }, []);

  const handleWaterUpdate = async (count) => {
    const newCount = Math.max(0, count);
    const newStats = { ...todayStats, waterIntake: newCount };
    setTodayStats(newStats);
    await saveDailyStats(newStats);
    const history = await getAllDailyStats();
    setDailyStatsHistory(history);
  };

  const handleSleepUpdate = async (delta) => {
    const newHours = Math.max(0, Math.min(24, todayStats.sleepHours + delta));
    const newStats = { ...todayStats, sleepHours: newHours };
    setTodayStats(newStats);
    await saveDailyStats(newStats);
    const history = await getAllDailyStats();
    setDailyStatsHistory(history);
  };

  const openHealthModal = () => {
    setTempHealthStats({
      water: todayStats.waterIntake,
      sleep: todayStats.sleepHours,
    });
    setIsHealthModalOpen(true);
  };

  const saveHealthStats = async (e) => {
    e.preventDefault();
    const newStats = {
      ...todayStats,
      waterIntake: Number(tempHealthStats.water),
      sleepHours: Number(tempHealthStats.sleep),
    };
    setTodayStats(newStats);
    await saveDailyStats(newStats);
    const history = await getAllDailyStats();
    setDailyStatsHistory(history);
    setIsHealthModalOpen(false);
  };

  if (!profile) return null;

  // --- Data Processing for Summary & Charts ---
  const todayWorkouts = workouts.filter((w) => w.date === today);
  const todaySteps = todayWorkouts.reduce(
    (acc, w) => acc + (Number(w.steps) || 0),
    0
  );
  const todayCalories = todayWorkouts.reduce(
    (acc, w) => acc + (Number(w.caloriesBurned) || 0),
    0
  );

  // Weekly Data
  const getLast7Days = () => {
    const days = [];
    for (let i = 6; i >= 0; i--) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      days.push(getLocalISODate(d));
    }
    return days;
  };

  const weeklyData = getLast7Days().map((date) => {
    const dayWorkouts = workouts.filter((w) => w.date === date);
    const dayStats = dailyStatsHistory.find((s) => s.date === date);

    const dateObj = new Date(date + "T12:00:00");

    return {
      day: dateObj.toLocaleDateString("en-US", { weekday: "short" }),
      steps: dayWorkouts.reduce((acc, w) => acc + (Number(w.steps) || 0), 0),
      calories: dayWorkouts.reduce(
        (acc, w) => acc + (Number(w.caloriesBurned) || 0),
        0
      ),
      sleep: dayStats ? Number(dayStats.sleepHours) : 0,
      water: dayStats ? Number(dayStats.waterIntake) : 0,
    };
  });

  const hasWeeklySteps = weeklyData.some((d) => d.steps > 0);
  const hasWeeklyCalories = weeklyData.some((d) => d.calories > 0);
  const hasWeeklySleep = weeklyData.some((d) => d.sleep > 0);
  const hasWeeklyWater = weeklyData.some((d) => d.water > 0);

  // 1. Workout Types Distribution
  const typeDistribution = workouts.reduce((acc, w) => {
    if (w.type) {
      acc[w.type] = (acc[w.type] || 0) + 1;
    }
    return acc;
  }, {});

  const pieData = Object.keys(typeDistribution).map((type) => ({
    name: type,
    value: typeDistribution[type],
  }));

  // 2. Intensity Distribution
  const intensityCount = workouts.reduce(
    (acc, w) => {
      if (w.intensity) {
        acc[w.intensity] = (acc[w.intensity] || 0) + 1;
      }
      return acc;
    },
    { [Intensity.Low]: 0, [Intensity.Medium]: 0, [Intensity.High]: 0 }
  );

  const intensityData = [
    { name: "Low", value: intensityCount[Intensity.Low], color: COLORS.chart1 },
    {
      name: "Medium",
      value: intensityCount[Intensity.Medium],
      color: COLORS.accent,
    },
    {
      name: "High",
      value: intensityCount[Intensity.High],
      color: COLORS.danger,
    },
  ].filter((d) => d.value > 0);

  // 3. Top Calorie Burning Activities
  const caloriesByType = Object.entries(
    workouts.reduce((acc, w) => {
      if (w.type) {
        acc[w.type] = (acc[w.type] || 0) + (Number(w.caloriesBurned) || 0);
      }
      return acc;
    }, {})
  )
    .map(([name, value]) => ({ name, value }))
    //@ts-ignore
    .sort((a, b) => b.value - a.value)
    .slice(0, 5);

  // --- LeetCode Style Heatmap Logic ---
  const generateHeatmapData = (year) => {
    const startDate = new Date(year, 0, 1);
    while (startDate.getDay() !== 0) {
      startDate.setDate(startDate.getDate() - 1);
    }
    const endDate = new Date(year, 11, 31);
    while (endDate.getDay() !== 6) {
      endDate.setDate(endDate.getDate() + 1);
    }

    const data = [];
    const currentDate = new Date(startDate);
    const workoutMap = new Map();

    workouts.forEach((w) => {
      const count = workoutMap.get(w.date) || 0;
      workoutMap.set(w.date, count + 1);
    });

    while (currentDate <= endDate) {
      const dateStr = getLocalISODate(currentDate);
      data.push({
        date: dateStr,
        count: workoutMap.get(dateStr) || 0,
        dayOfWeek: currentDate.getDay(),
        month: currentDate.toLocaleString("default", { month: "short" }),
        inSelectedYear: currentDate.getFullYear() === year,
      });
      currentDate.setDate(currentDate.getDate() + 1);
    }

    const weeks = [];
    let currentWeek = [];
    for (const day of data) {
      currentWeek.push(day);
      if (day.dayOfWeek === 6) {
        weeks.push(currentWeek);
        currentWeek = [];
      }
    }
    if (currentWeek.length > 0) weeks.push(currentWeek);
    return weeks;
  };

  const heatmapWeeks = generateHeatmapData(selectedYear);
  const monthLabels = [];
  heatmapWeeks.forEach((week, index) => {
    const containsFirstOfMonth = week.some(
      (d) => new Date(d.date + "T12:00:00").getDate() === 1
    );
    if (containsFirstOfMonth) {
      const monthName = week.find(
        (d) => new Date(d.date + "T12:00:00").getDate() === 1
      )?.month;
      if (
        monthName &&
        (monthLabels.length === 0 ||
          monthLabels[monthLabels.length - 1].label !== monthName)
      ) {
        monthLabels.push({ index, label: monthName });
      }
    }
  });

  const getIntensityClass = (count, inSelectedYear) => {
    if (!inSelectedYear)
      return "bg-transparent border-dashed border-border opacity-20";
    if (count === 0) return "bg-secondary dark:bg-zinc-800/50";
    if (count === 1) return "bg-primary/30 dark:bg-emerald-900/40";
    if (count <= 2) return "bg-primary/50 dark:bg-emerald-700/50";
    if (count <= 3) return "bg-primary/70 dark:bg-emerald-600/70";
    return "bg-primary dark:bg-emerald-500";
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-2 rounded shadow-lg text-sm z-50">
          <p className="font-semibold text-popover-foreground">{label}</p>
          <p className="text-primary font-mono">{`${payload[0].name}: ${Number(
            payload[0].value
          ).toLocaleString()}`}</p>
        </div>
      );
    }
    return null;
  };

  // Helper for Empty States
  const ChartEmptyState = ({ title, message }) => (
    <div className="h-full w-full flex flex-col items-center justify-center text-center p-6 bg-gray-50 dark:bg-zinc-900 rounded-lg border-2 border-dashed border-gray-200 dark:border-zinc-700">
      <div className="bg-white dark:bg-zinc-800 p-3 rounded-full mb-3 shadow-sm">
        <BarChart2 className="text-gray-400 dark:text-zinc-500" size={24} />
      </div>
      {title && (
        <h4 className="font-semibold text-gray-900 dark:text-gray-100 mb-1">
          {title}
        </h4>
      )}
      <p className="text-sm text-gray-500 dark:text-gray-400 mb-4 max-w-[200px]">
        {message}
      </p>
      <button
        onClick={() => navigate("/workouts")}
        className="flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-primary hover:text-primary/80 transition-colors"
      >
        <PlusCircle size={14} /> Log first workout
      </button>
    </div>
  );

  const minYear = Math.min(currentYear - 4, ...availableYears);
  const maxYear = Math.max(currentYear, ...availableYears);

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">
            Hello, {profile.name.split(" ")[0]}
          </h1>
          <p className="text-muted-foreground">
            Your fitness analytics at a glance.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={openHealthModal}
            className="flex items-center gap-2 bg-secondary hover:bg-secondary/80 text-foreground px-3 py-2 rounded-lg font-medium transition-colors text-sm border border-border"
          >
            <Edit3 size={16} /> Log Health
          </button>

          <div className="flex items-center gap-2 bg-accent/50 px-4 py-2 rounded-full border border-border">
            <Trophy className="text-yellow-500" size={20} />
            <span className="font-mono font-bold">
              {streak?.totalPoints} pts
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          title="Steps Today"
          value={todaySteps}
          goal={profile.goalSteps}
          icon={Footprints}
          color="text-emerald-500"
        />
        <SummaryCard
          title="Calories Burned"
          value={todayCalories}
          goal={profile.goalCalories}
          icon={Flame}
          color="text-orange-500"
        />

        {/* Sleep Tracker Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2 relative overflow-hidden group">
          <div className="flex justify-between items-start">
            <span className="text-muted-foreground text-sm font-medium">
              Sleep
            </span>
            <div className="p-2 bg-indigo-500/10 rounded-lg text-indigo-500">
              <Moon size={20} />
            </div>
          </div>
          <div className="flex items-center justify-between mt-2">
            <div className="flex items-baseline gap-1">
              <span className="text-2xl font-bold font-mono">
                {todayStats.sleepHours}
              </span>
              <span className="text-xs text-muted-foreground">hrs</span>
            </div>
            <div className="flex items-center gap-1">
              <button
                onClick={() => handleSleepUpdate(-0.5)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Decrease 30m"
              >
                <Minus size={16} />
              </button>
              <button
                onClick={() => handleSleepUpdate(0.5)}
                className="p-1 rounded hover:bg-secondary text-muted-foreground hover:text-foreground transition-colors"
                title="Increase 30m"
              >
                <Plus size={16} />
              </button>
            </div>
          </div>
          <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-3">
            <div
              className="h-full bg-indigo-500 transition-all duration-500"
              style={{
                width: `${Math.min(100, (todayStats.sleepHours / 8) * 100)}%`,
              }}
            ></div>
          </div>
        </div>

        {/* Hydration Tracker Card */}
        <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
          <div className="flex justify-between items-start mb-2">
            <span className="text-muted-foreground text-sm font-medium">
              Water
            </span>
            <div className="p-2 bg-blue-500/10 rounded-lg text-blue-500">
              <Droplets size={20} />
            </div>
          </div>
          <div className="flex justify-between items-center px-1">
            {Array.from({ length: 8 }).map((_, i) => (
              <button
                key={i}
                onClick={() =>
                  handleWaterUpdate(
                    i + 1 === todayStats.waterIntake &&
                      todayStats.waterIntake === 1
                      ? 0
                      : i + 1
                  )
                }
                className={`transition-all duration-300 hover:scale-110 ${
                  i < todayStats.waterIntake
                    ? "text-blue-500"
                    : "text-secondary dark:text-zinc-800"
                }`}
                title="Toggle glass"
              >
                <svg
                  width="16"
                  height="24"
                  viewBox="0 0 24 24"
                  fill={i < todayStats.waterIntake ? "currentColor" : "none"}
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                >
                  <path d="M12 2.69l5.66 5.66a8 8 0 1 1-11.31 0z" />
                </svg>
              </button>
            ))}
          </div>
          <div className="text-xs text-muted-foreground text-center mt-2 flex justify-between items-center px-1">
            <span>{todayStats.waterIntake} glasses</span>
            <button
              onClick={() => handleWaterUpdate(todayStats.waterIntake + 1)}
              className="text-blue-500 hover:text-blue-600 text-[10px] font-bold uppercase"
            >
              + Add
            </button>
          </div>
        </div>
      </div>

      {/* LeetCode Style Heatmap */}
      <div className="bg-card border border-border rounded-xl p-6 shadow-sm overflow-hidden">
        <div className="flex justify-between items-center mb-4">
          <div className="flex items-center gap-2">
            <CalendarDays size={18} className="text-muted-foreground" />
            <h3 className="text-lg font-serif font-bold tracking-tight">
              Activity Log
            </h3>
          </div>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 bg-secondary rounded-lg p-0.5">
              <button
                onClick={() => setSelectedYear((prev) => prev - 1)}
                className="p-1 hover:bg-background rounded-md text-muted-foreground transition-colors disabled:opacity-30"
                disabled={selectedYear <= minYear}
              >
                <ChevronLeft size={16} />
              </button>
              <span className="text-xs font-bold font-mono px-2 min-w-[40px] text-center">
                {selectedYear}
              </span>
              <button
                onClick={() => setSelectedYear((prev) => prev + 1)}
                className="p-1 hover:bg-background rounded-md text-muted-foreground transition-colors disabled:opacity-30"
                disabled={selectedYear >= maxYear}
              >
                <ChevronRight size={16} />
              </button>
            </div>
            <div className="hidden sm:flex items-center gap-1 text-xs text-muted-foreground">
              <span>Less</span>
              <div className="w-3 h-3 bg-secondary rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/30 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary/60 rounded-sm"></div>
              <div className="w-3 h-3 bg-primary rounded-sm"></div>
              <span>More</span>
            </div>
          </div>
        </div>

        <div className="w-full overflow-x-auto pb-2 no-scrollbar">
          <div className="min-w-max">
            <div className="flex mb-2 pl-8">
              {monthLabels.map((m, i) => (
                <span
                  key={i}
                  className="text-xs text-muted-foreground"
                  style={{
                    width: `${
                      (monthLabels[i + 1]?.index - m.index) * 16 || 40
                    }px`,
                    minWidth: "40px",
                    display: "inline-block",
                  }}
                >
                  {m.label}
                </span>
              ))}
            </div>
            <div className="flex gap-1">
              <div className="flex flex-col gap-1 pr-2 pt-[14px]">
                <span className="text-[10px] h-3 text-muted-foreground leading-3"></span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3">
                  Mon
                </span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3"></span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3">
                  Wed
                </span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3"></span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3">
                  Fri
                </span>
                <span className="text-[10px] h-3 text-muted-foreground leading-3"></span>
              </div>
              {heatmapWeeks.map((week, weekIndex) => (
                <div key={weekIndex} className="flex flex-col gap-1">
                  {week.map((day) => (
                    <div
                      key={day.date}
                      className={`w-3 h-3 rounded-[2px] ${getIntensityClass(
                        day.count,
                        day.inSelectedYear
                      )} border border-transparent hover:border-black/10 dark:hover:border-white/20 transition-all cursor-pointer`}
                      title={`${day.count} workouts on ${new Date(
                        day.date + "T12:00:00"
                      ).toLocaleDateString()}`}
                    />
                  ))}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Row 1: Weekly Progress (Activity) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-6">
            Weekly Steps
          </h3>
          <div className="h-64 flex-1">
            {hasWeeklySteps ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.2}
                      stroke={COLORS.grid}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="steps"
                      fill={COLORS.chart1}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No steps logged this week." />
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-6">
            Weekly Calories
          </h3>
          <div className="h-64 flex-1">
            {hasWeeklyCalories ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={weeklyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.2}
                      stroke={COLORS.grid}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Line
                      type="monotone"
                      dataKey="calories"
                      stroke={COLORS.chart2}
                      strokeWidth={3}
                      dot={{ r: 4 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No calories burned yet this week." />
            )}
          </div>
        </div>
      </div>

      {/* Row 2: Health Trends (Sleep & Water) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-6">
            Sleep Trends
          </h3>
          <div className="h-64 flex-1">
            {hasWeeklySleep ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={weeklyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.2}
                      stroke={COLORS.grid}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip content={<CustomTooltip />} />
                    <Area
                      type="monotone"
                      dataKey="sleep"
                      stroke={COLORS.chart3}
                      fill={COLORS.chart3}
                      fillOpacity={0.2}
                      strokeWidth={3}
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No sleep data logged this week." />
            )}
          </div>
        </div>

        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-6">
            Hydration
          </h3>
          <div className="h-64 flex-1">
            {hasWeeklyWater ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={weeklyData}>
                    <CartesianGrid
                      strokeDasharray="3 3"
                      vertical={false}
                      opacity={0.2}
                      stroke={COLORS.grid}
                    />
                    <XAxis
                      dataKey="day"
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <YAxis
                      tick={{ fill: COLORS.text }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="water"
                      fill={COLORS.secondary}
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No water intake logged this week." />
            )}
          </div>
        </div>
      </div>

      {/* Row 3: Distributions & Top Activities */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Chart 3: Workout Types (Pie) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-2">
            Activity Types
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Breakdown by workout type
          </p>
          <div className="h-64 flex-1">
            {pieData.length > 0 ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={pieData}
                      cx="50%"
                      cy="50%"
                      innerRadius={50}
                      outerRadius={70}
                      paddingAngle={5}
                      dataKey="value"
                    >
                      {pieData.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={PIE_COLORS[index % PIE_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No activities logged yet." />
            )}
          </div>
        </div>

        {/* Chart 4: Intensity Distribution (Donut) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-2">
            Intensity Levels
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Training effort distribution
          </p>
          <div className="h-64 flex-1">
            {intensityData.length > 0 ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={intensityData}
                      cx="50%"
                      cy="50%"
                      innerRadius={60}
                      outerRadius={80}
                      dataKey="value"
                      startAngle={180}
                      endAngle={0}
                    >
                      {intensityData.map((entry, index) => (
                        <Cell key={`cell-int-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip content={<CustomTooltip />} />
                    <Legend
                      verticalAlign="bottom"
                      height={36}
                      iconType="circle"
                      wrapperStyle={{ fontSize: "12px" }}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="Log workouts to see intensity stats." />
            )}
          </div>
        </div>

        {/* Chart 5: Top Activities by Calories (Bar) */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-sm flex flex-col lg:col-span-1 md:col-span-2">
          <h3 className="text-lg font-serif font-bold tracking-tight mb-2">
            Top Burners
          </h3>
          <p className="text-sm text-muted-foreground mb-4">
            Most effective activities
          </p>
          <div className="h-64 flex-1">
            {caloriesByType.length > 0 ? (
              <div
                style={{ width: "100%", height: "100%", minHeight: "200px" }}
              >
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    layout="vertical"
                    data={caloriesByType}
                    margin={{ top: 0, right: 30, left: 10, bottom: 0 }}
                  >
                    <CartesianGrid
                      strokeDasharray="3 3"
                      horizontal={true}
                      vertical={false}
                      opacity={0.2}
                      stroke={COLORS.grid}
                    />
                    <XAxis type="number" hide />
                    <YAxis
                      dataKey="name"
                      type="category"
                      width={70}
                      tick={{ fill: COLORS.text, fontSize: 12 }}
                      axisLine={false}
                      tickLine={false}
                    />
                    <Tooltip
                      cursor={{ fill: "var(--accent)" }}
                      content={<CustomTooltip />}
                    />
                    <Bar
                      dataKey="value"
                      fill={COLORS.chart4}
                      radius={[0, 4, 4, 0]}
                      barSize={20}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <ChartEmptyState message="No data to rank activities." />
            )}
          </div>
        </div>
      </div>

      {/* Manual Health Entry Modal */}
      {isHealthModalOpen && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <div className="bg-card border border-border w-full max-w-sm rounded-2xl shadow-2xl p-6 animate-in zoom-in-95 duration-200">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold font-serif">Log Daily Stats</h2>
              <button
                onClick={() => setIsHealthModalOpen(false)}
                className="text-muted-foreground hover:text-foreground"
              >
                <X size={24} />
              </button>
            </div>
            <form onSubmit={saveHealthStats} className="space-y-6">
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Moon size={16} className="text-indigo-500" /> Sleep Hours
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0"
                  max="24"
                  value={tempHealthStats.sleep}
                  onChange={(e) =>
                    setTempHealthStats((prev) => ({
                      ...prev,
                      sleep: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Droplets size={16} className="text-blue-500" /> Water Intake
                  (Glasses)
                </label>
                <input
                  type="number"
                  step="1"
                  min="0"
                  value={tempHealthStats.water}
                  onChange={(e) =>
                    setTempHealthStats((prev) => ({
                      ...prev,
                      water: Number(e.target.value),
                    }))
                  }
                  className="w-full bg-background border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none"
                />
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-primary-foreground font-bold py-3 rounded-xl shadow-md hover:opacity-90 transition-opacity"
              >
                Save Stats
              </button>
            </form>
          </div>
        </div>
      )}

      {/* Debug Footer */}
      <div className="text-center text-xs text-muted-foreground mt-8 pb-4 opacity-50 hover:opacity-100 transition-opacity">
        <p>
          Debug Info: User ID:{" "}
          <span className="font-mono">{getCurrentUserId()}</span> | Email:{" "}
          <span className="font-mono">{profile.email}</span>
        </p>
      </div>
    </div>
  );
};

// Helper Components
const SummaryCard = ({ title, value, goal, icon: Icon, color }) => {
  const val = Number(value) || 0;
  const g = Number(goal) || 1;
  const percent = Math.min(Math.round((val / g) * 100), 100);

  return (
    <div className="bg-card border border-border rounded-xl p-5 shadow-sm space-y-2">
      <div className="flex justify-between items-start">
        <span className="text-muted-foreground text-sm font-medium">
          {title}
        </span>
        <div
          className={`p-2 rounded-lg bg-opacity-10 ${color.replace(
            "text-",
            "bg-"
          )} ${color}`}
        >
          <Icon size={20} />
        </div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-2xl font-bold font-mono text-foreground">
          {val.toLocaleString()}
        </span>
        <span className="text-xs text-muted-foreground">
          / {g.toLocaleString()}
        </span>
      </div>
      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-2">
        <div
          className={`h-full ${color.replace("text-", "bg-")}`}
          style={{ width: `${percent}%` }}
        ></div>
      </div>
    </div>
  );
};

export default Dashboard;
