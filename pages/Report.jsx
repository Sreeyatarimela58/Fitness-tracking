import React, { useRef, useState, useEffect } from 'react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { Download, Calendar, TrendingUp, Award, Droplets, Moon, Heart, Clock, Activity, Zap, Flame, Smile, Frown, Meh, Battery, Gauge, ZapIcon } from 'lucide-react';
import { getProfile, getWorkouts, getStreakInfo, getAllDailyStats } from '../services/storage';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, ResponsiveContainer, Tooltip } from 'recharts';

const Feeling = {
  Amazing: 'Amazing',
  Good: 'Good',
  Okay: 'Okay',
  Tired: 'Tired',
  Hurt: 'Hurt'
};

const Report = () => {
  const reportRef = useRef(null);
  const [isGenerating, setIsGenerating] = useState(false);
  const [profile, setProfile] = useState(null);
  const [workouts, setWorkouts] = useState([]);
  const [streak, setStreak] = useState(null);
  const [dailyStats, setDailyStats] = useState([]);

  useEffect(() => {
    const loadData = async () => {
      setProfile(await getProfile());
      setWorkouts(await getWorkouts());
      setStreak(await getStreakInfo());
      setDailyStats(await getAllDailyStats());
    };
    loadData();
  }, []);

  if (!profile) return null;

  // Logic for Weekly Stats
  const now = new Date();
  const oneWeekAgo = new Date(now);
  oneWeekAgo.setDate(now.getDate() - 7);

  // Filter workouts for the last 7 days
  const weeklyWorkouts = workouts.filter(w => new Date(w.date) >= oneWeekAgo);

  // Get recent 10 workouts for the log table (sorted by date desc)
  const recentWorkouts = [...workouts]
    .sort((a, b) => new Date(b.date + 'T' + b.time).getTime() - new Date(a.date + 'T' + a.time).getTime())
    .slice(0, 10);

  const totalCalories = weeklyWorkouts.reduce((acc, w) => acc + w.caloriesBurned, 0);

  // Weekly Sleep & Water Stats
  const weeklyDailyStats = dailyStats.filter(s => new Date(s.date) >= oneWeekAgo);
  const totalSleep = weeklyDailyStats.reduce((acc, s) => acc + s.sleepHours, 0);
  const totalWater = weeklyDailyStats.reduce((acc, s) => acc + s.waterIntake, 0);
  const daysLogged = weeklyDailyStats.length || 1;
  const avgSleep = (totalSleep / daysLogged).toFixed(1);
  const avgWater = Math.round(totalWater / daysLogged);

  // Chart data for PDF
  const dailyCalories = {};
  // Initialize last 7 days with 0
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    const dateStr = d.toLocaleDateString('en-CA'); // YYYY-MM-DD
    dailyCalories[dateStr] = 0;
  }

  weeklyWorkouts.forEach(w => {
    if (dailyCalories[w.date] !== undefined) {
      dailyCalories[w.date] += w.caloriesBurned;
    }
  });

  const chartData = Object.keys(dailyCalories).sort().map(date => ({
    name: new Date(date).toLocaleDateString('en-US', { weekday: 'short' }),
    calories: dailyCalories[date]
  }));

  const handleDownloadPdf = async () => {
    if (!reportRef.current) return;
    setIsGenerating(true);

    try {
      const element = reportRef.current;

      // We use onclone to force the captured document into Light Mode for a clean paper-like PDF,
      // even if the user is currently viewing the app in Dark Mode.
      const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        backgroundColor: '#ffffff',
        onclone: (clonedDoc) => {
          // Remove 'dark' class from the cloned document root to force light variables
          clonedDoc.documentElement.classList.remove('dark');

          // Explicitly ensure the report background is white in the clone
          const printable = clonedDoc.getElementById('printable-report');
          if (printable) {
            printable.style.backgroundColor = '#ffffff';
            printable.style.color = '#09090b'; // zinc-950
            printable.style.borderColor = '#e4e4e7'; // zinc-200
          }
        }
      });

      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF('p', 'mm', 'a4');
      const pdfWidth = pdf.internal.pageSize.getWidth();
      const pdfHeight = (canvas.height * pdfWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 0, 0, pdfWidth, pdfHeight);
      pdf.save(`FitTrack_Report_${new Date().toLocaleDateString('en-CA')}.pdf`);
    } catch (error) {
      console.error('PDF Generation failed', error);
    } finally {
      setIsGenerating(false);
    }
  };

  const getIntensityColor = (rpe) => {
    if (rpe <= 3) return 'bg-emerald-100 text-emerald-800 border-emerald-200 dark:bg-emerald-900/30 dark:text-emerald-300 dark:border-emerald-800';
    if (rpe <= 6) return 'bg-amber-100 text-amber-800 border-amber-200 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-800';
    if (rpe <= 8) return 'bg-orange-100 text-orange-800 border-orange-200 dark:bg-orange-900/30 dark:text-orange-300 dark:border-orange-800';
    return 'bg-red-100 text-red-800 border-red-200 dark:bg-red-900/30 dark:text-red-300 dark:border-red-800';
  };

  const getFeelingIcon = (feeling) => {
    switch (feeling) {
      case Feeling.Amazing: return <ZapIcon size={14} className="text-yellow-500" />;
      case Feeling.Good: return <Smile size={14} className="text-emerald-500" />;
      case Feeling.Okay: return <Meh size={14} className="text-blue-500" />;
      case Feeling.Tired: return <Battery size={14} className="text-orange-500" />;
      case Feeling.Hurt: return <Frown size={14} className="text-red-500" />;
      default: return <Smile size={14} className="text-emerald-500" />;
    }
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className="bg-popover border border-border p-3 rounded-lg shadow-lg text-sm outline-none">
          <p className="font-semibold text-popover-foreground mb-1">{label}</p>
          <p className="text-primary font-medium">
            {payload[0].value} kcal
          </p>
        </div>
      );
    }
    return null;
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-center gap-4">
        <div>
          <h1 className="text-3xl font-serif font-bold tracking-tight text-foreground">Weekly Report</h1>
          <p className="text-muted-foreground">Export your performance summary.</p>
        </div>
        <button
          onClick={handleDownloadPdf}
          disabled={isGenerating}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity disabled:opacity-50 shadow-sm"
        >
          <Download size={18} />
          {isGenerating ? 'Generating...' : 'Export PDF'}
        </button>
      </div>

      <div className="flex justify-center pb-12">
        {/* Printable Area - Theme Responsive */}
        <div
          ref={reportRef}
          id="printable-report"
          className="w-full max-w-4xl bg-card text-card-foreground p-8 md:p-12 rounded-xl shadow-xl border border-border"
          style={{ minHeight: '800px' }}
        >
          {/* Header */}
          <div className="flex justify-between items-end border-b-2 border-primary pb-6 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-2">
                <div className="p-2 bg-primary rounded-lg text-primary-foreground">
                  <Activity size={24} />
                </div>
                <h2 className="text-4xl font-serif font-bold tracking-tight text-foreground">FitTrack Pro</h2>
              </div>
              <p className="text-muted-foreground font-medium">Performance Report</p>
            </div>
            <div className="text-right">
              <p className="font-bold text-xl text-foreground">{profile.name}</p>
              <p className="text-sm text-muted-foreground">
                {oneWeekAgo.toLocaleDateString()} - {now.toLocaleDateString()}
              </p>
            </div>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-3 gap-6 mb-10">
            <div className="bg-secondary/30 p-5 rounded-xl border border-border text-center shadow-sm">
              <Calendar className="mx-auto text-blue-500 mb-3" size={28} />
              <h3 className="text-3xl font-black text-foreground">{weeklyWorkouts.length}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Workouts</p>
            </div>
            <div className="bg-secondary/30 p-5 rounded-xl border border-border text-center shadow-sm">
              <Flame className="mx-auto text-orange-500 mb-3" size={28} />
              <h3 className="text-3xl font-black text-foreground">{totalCalories.toLocaleString()}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Calories</p>
            </div>
            <div className="bg-secondary/30 p-5 rounded-xl border border-border text-center shadow-sm">
              <Award className="mx-auto text-amber-500 mb-3" size={28} />
              <h3 className="text-3xl font-black text-foreground">{streak?.currentStreak || 0}</h3>
              <p className="text-sm font-medium text-muted-foreground uppercase tracking-wide">Day Streak</p>
            </div>
          </div>

          {/* Health Stats Row */}
          <div className="grid grid-cols-2 gap-6 mb-10">
            <div className="bg-indigo-50 dark:bg-indigo-900/10 p-5 rounded-xl border border-indigo-100 dark:border-indigo-800/30 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-indigo-700 dark:text-indigo-300 font-bold uppercase tracking-wider mb-1">Avg Sleep</p>
                <h3 className="text-3xl font-bold text-foreground">{avgSleep} <span className="text-lg font-medium text-muted-foreground">hrs</span></h3>
              </div>
              <div className="bg-background p-3 rounded-full text-indigo-500 shadow-sm border border-indigo-100 dark:border-indigo-800">
                <Moon size={24} />
              </div>
            </div>
            <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-xl border border-blue-100 dark:border-blue-800/30 flex items-center justify-between shadow-sm">
              <div>
                <p className="text-xs text-blue-700 dark:text-blue-300 font-bold uppercase tracking-wider mb-1">Avg Hydration</p>
                <h3 className="text-3xl font-bold text-foreground">{avgWater} <span className="text-lg font-medium text-muted-foreground">cups</span></h3>
              </div>
              <div className="bg-background p-3 rounded-full text-blue-500 shadow-sm border border-blue-100 dark:border-blue-800">
                <Droplets size={24} />
              </div>
            </div>
          </div>

          {/* Chart Section */}
          <div className="mb-10">
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mb-4">
              <TrendingUp size={20} className="text-primary" />
              Calorie Trend (Last 7 Days)
            </h3>
            <div className="h-64 border border-border rounded-xl p-4 bg-secondary/10">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} opacity={0.3} stroke="currentColor" />
                  <XAxis
                    dataKey="name"
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <YAxis
                    tick={{ fill: '#a1a1aa', fontSize: 12 }}
                    axisLine={false}
                    tickLine={false}
                  />
                  <Tooltip content={<CustomTooltip />} cursor={{ fill: 'var(--muted)', opacity: 0.3 }} />
                  <Bar
                    dataKey="calories"
                    fill="#10b981"
                    radius={[4, 4, 0, 0]}
                    barSize={32}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          {/* Detailed Log Table */}
          <div>
            <h3 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2 mb-4">
              <Clock size={20} className="text-primary" />
              Recent Sessions
            </h3>
            <div className="border border-border rounded-xl overflow-hidden shadow-sm">
              <table className="w-full text-sm text-left border-collapse">
                <thead className="bg-secondary/50 text-muted-foreground font-bold uppercase tracking-wider text-xs">
                  <tr>
                    <th className="px-5 py-3 border-b border-border">Date & Time</th>
                    <th className="px-5 py-3 border-b border-border">Activity</th>
                    <th className="px-5 py-3 border-b border-border">Performance</th>
                    <th className="px-5 py-3 border-b border-border">Stats</th>
                    <th className="px-5 py-3 border-b border-border text-right">Feeling</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border bg-card">
                  {recentWorkouts.length > 0 ? (
                    recentWorkouts.map((w) => (
                      <tr key={w.id} className="hover:bg-muted/30 transition-colors">
                        <td className="px-5 py-3 whitespace-nowrap">
                          <div className="font-bold text-foreground">{new Date(w.date).toLocaleDateString()}</div>
                          <div className="text-xs text-muted-foreground font-mono">{w.time}</div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-2">
                            <span className="font-semibold text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded-md border border-emerald-100 dark:border-emerald-800 text-xs">
                              {w.type}
                            </span>
                          </div>
                          {w.notes && (
                            <p className="text-xs text-muted-foreground mt-1 max-w-[160px] truncate italic">
                              "{w.notes}"
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <div className="flex flex-col gap-1.5 items-start">
                            {w.avgHeartRate && w.avgHeartRate > 0 ? (
                              <span className="text-xs font-bold text-rose-700 dark:text-rose-400 flex items-center gap-1 bg-rose-50 dark:bg-rose-900/20 px-1.5 py-0.5 rounded border border-rose-100 dark:border-rose-800">
                                <Heart size={10} fill="currentColor" /> {w.avgHeartRate} bpm
                              </span>
                            ) : (
                              <span className="text-[10px] text-muted-foreground pl-1">-</span>
                            )}
                            {w.rpe && (
                              <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border ${getIntensityColor(w.rpe)} flex items-center gap-1`}>
                                <Gauge size={10} /> RPE {w.rpe}
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <div className="text-xs space-y-1">
                            <div className="flex items-center gap-1.5 text-foreground/80">
                              <Clock size={12} className="text-muted-foreground" />
                              <span className="font-mono">{w.duration} min</span>
                            </div>
                            <div className="flex items-center gap-1.5 text-orange-600 dark:text-orange-400 font-semibold">
                              <Flame size={12} />
                              <span className="font-mono">{w.caloriesBurned} kcal</span>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="flex justify-end">
                            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-medium bg-secondary text-secondary-foreground border border-border">
                              {getFeelingIcon(w.feeling)}
                              {w.feeling}
                            </span>
                          </div>
                        </td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={5} className="px-5 py-8 text-center text-muted-foreground italic">
                        No recent workouts recorded.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>

          <div className="text-center text-xs text-muted-foreground/50 mt-12 flex justify-center items-center gap-3 border-t border-border pt-6">
            <span>Generated by FitTrack Pro</span>
            <span className="w-1 h-1 rounded-full bg-border"></span>
            <span>{new Date().toLocaleString()}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Report;