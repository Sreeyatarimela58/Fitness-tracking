import React, { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { Plus, Trash2, Edit2, Search, Filter, X, Flame, AlertCircle, Heart, Clock, Smile, Frown, Meh, Zap, Battery, Gauge, CalendarDays, History } from 'lucide-react';
import { getWorkouts, saveWorkout, deleteWorkout, getProfile, estimateCalories } from '../services/storage';
import { motion, AnimatePresence } from 'framer-motion';

const WorkoutType = {
  Running: 'Running',
  Cycling: 'Cycling',
  Weightlifting: 'Weightlifting',
  Yoga: 'Yoga',
  HIIT: 'HIIT',
  Swimming: 'Swimming',
  Walking: 'Walking',
  Other: 'Other'
};

const Intensity = {
  Low: 'Low',
  Medium: 'Medium',
  High: 'High'
};

const Feeling = {
  Amazing: 'Amazing',
  Good: 'Good',
  Okay: 'Okay',
  Tired: 'Tired',
  Hurt: 'Hurt'
};

const Workouts = () => {
  const [workouts, setWorkouts] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filterType, setFilterType] = useState('All');
  const [searchTerm, setSearchTerm] = useState('');

  // Form State
  const [editingId, setEditingId] = useState(null);
  const [formData, setFormData] = useState({
    date: new Date().toLocaleDateString('en-CA'),
    time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
    type: WorkoutType.Running,
    duration: 30,
    intensity: Intensity.Medium,
    feeling: Feeling.Good,
    rpe: 5,
    notes: '',
    steps: 0,
    distance: 0,
    avgHeartRate: 0,
  });

  // Validation & Estimation State
  const [errors, setErrors] = useState({});
  const [estimatedCalories, setEstimatedCalories] = useState(0);

  useEffect(() => {
    loadWorkouts();
  }, []);

  // Live Calorie Estimation
  useEffect(() => {
    const updateCalories = async () => {
      if (isModalOpen) {
        const profile = await getProfile();
        const calories = estimateCalories(
          (formData.type) || WorkoutType.Running,
          Number(formData.duration) || 0,
          (formData.intensity) || Intensity.Medium,
          profile?.weight || 70
        );
        setEstimatedCalories(calories);
      }
    };
    updateCalories();
  }, [formData.type, formData.duration, formData.intensity, isModalOpen]);

  const loadWorkouts = async () => {
    // Sort by Date AND Time
    const w = await getWorkouts();
    setWorkouts(w.sort((a, b) => {
      const dateA = new Date(`${a.date}T${a.time || '00:00'}`);
      const dateB = new Date(`${b.date}T${b.time || '00:00'}`);
      return dateB.getTime() - dateA.getTime();
    }));
  };

  const handleDelete = async (id) => {
    if (window.confirm('Are you sure you want to delete this workout?')) {
      await deleteWorkout(id);
      loadWorkouts();
      toast.info('Workout deleted');
    }
  };

  const openModal = (workout) => {
    setErrors({});
    if (workout) {
      setEditingId(workout.id);
      setFormData(workout);
    } else {
      setEditingId(null);
      setFormData({
        date: new Date().toLocaleDateString('en-CA'),
        time: new Date().toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit' }),
        type: WorkoutType.Running,
        duration: 30,
        intensity: Intensity.Medium,
        feeling: Feeling.Good,
        rpe: 5,
        notes: '',
        steps: 0,
        distance: 0,
        avgHeartRate: 0
      });
    }
    setIsModalOpen(true);
  };

  const validateForm = () => {
    const newErrors = {};

    if (!formData.date) newErrors.date = "Date is required";
    if (!formData.time) newErrors.time = "Time is required";
    if (!formData.duration || Number(formData.duration) <= 0) newErrors.duration = "Duration > 0 required";
    if (formData.steps && Number(formData.steps) < 0) newErrors.steps = "Cannot be negative";
    if (formData.distance && Number(formData.distance) < 0) newErrors.distance = "Cannot be negative";
    if (formData.avgHeartRate && (Number(formData.avgHeartRate) < 30 || Number(formData.avgHeartRate) > 220)) newErrors.avgHeartRate = "Invalid BPM";
    if (formData.rpe && (Number(formData.rpe) < 1 || Number(formData.rpe) > 10)) newErrors.rpe = "1-10 range";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fix the errors in the form.");
      return;
    }

    const newWorkout = {
      id: editingId || Date.now().toString(),
      date: formData.date,
      time: formData.time || '12:00',
      type: formData.type,
      duration: Number(formData.duration),
      intensity: formData.intensity,
      feeling: formData.feeling || Feeling.Good,
      rpe: Number(formData.rpe) || 5,
      caloriesBurned: estimatedCalories,
      steps: Number(formData.steps) || 0,
      distance: Number(formData.distance) || 0,
      avgHeartRate: Number(formData.avgHeartRate) || 0,
      notes: formData.notes
    };

    await saveWorkout(newWorkout);
    loadWorkouts();
    setIsModalOpen(false);
    toast.success(editingId ? 'Workout updated!' : 'Workout logged!');
  };

  // Filter Logic
  const filteredWorkouts = workouts.filter(w => {
    const matchesType = filterType === 'All' || w.type === filterType;
    const matchesSearch = w.notes?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      w.type.toLowerCase().includes(searchTerm.toLowerCase());
    return matchesType && matchesSearch;
  });

  // Split into Today vs History
  const todayStr = new Date().toLocaleDateString('en-CA');
  const todayWorkouts = filteredWorkouts.filter(w => w.date === todayStr);
  // History workouts are filtered out but we don't render them anymore

  // Helper for Feeling Icon
  const getFeelingIcon = (feeling) => {
    switch (feeling) {
      case Feeling.Amazing: return <Zap size={16} className="text-yellow-500" />;
      case Feeling.Good: return <Smile size={16} className="text-green-500" />;
      case Feeling.Okay: return <Meh size={16} className="text-blue-500" />;
      case Feeling.Tired: return <Battery size={16} className="text-orange-500" />;
      case Feeling.Hurt: return <Frown size={16} className="text-red-500" />;
      default: return <Smile size={16} className="text-green-500" />;
    }
  };

  const getRpeColor = (val) => {
    if (val <= 3) return 'text-green-500 bg-green-500/10 border-green-500/20';
    if (val <= 6) return 'text-yellow-500 bg-yellow-500/10 border-yellow-500/20';
    if (val <= 8) return 'text-orange-500 bg-orange-500/10 border-orange-500/20';
    return 'text-red-500 bg-red-500/10 border-red-500/20';
  };

  const listVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.05
      }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
  };

  const WorkoutCard = ({ workout, showActions = true }) => (
    <motion.div
      variants={itemVariants}
      layout
      className="bg-card border border-border rounded-xl p-5 shadow-sm hover:shadow-md transition-shadow flex flex-col md:flex-row gap-4 justify-between items-start md:items-center group"
    >
      <div className="flex items-start md:items-center gap-4 w-full md:w-auto">
        <div className={`p-4 rounded-2xl bg-gradient-to-br from-primary/10 to-primary/5 text-primary shadow-inner shrink-0`}>
          <span className="font-bold text-xl font-serif">{workout.type.charAt(0)}</span>
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2 mb-1">
            <h3 className="font-semibold text-lg truncate">{workout.type}</h3>
            <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${workout.intensity === Intensity.High ? 'border-red-200 text-red-600 bg-red-50 dark:bg-red-900/20 dark:text-red-300 dark:border-red-800' :
              workout.intensity === Intensity.Medium ? 'border-orange-200 text-orange-600 bg-orange-50 dark:bg-orange-900/20 dark:text-orange-300 dark:border-orange-800' :
                'border-green-200 text-green-600 bg-green-50 dark:bg-green-900/20 dark:text-green-300 dark:border-green-800'
              }`}>
              {workout.intensity}
            </span>
          </div>

          <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Clock size={14} />
              <span>{new Date(workout.date).toLocaleDateString()} • {workout.time || '--:--'}</span>
            </div>
            <div className="flex items-center gap-1.5">
              <Flame size={14} className="text-orange-500" />
              <span>{workout.caloriesBurned} kcal</span>
            </div>
            {workout.avgHeartRate && workout.avgHeartRate > 0 && (
              <div className="flex items-center gap-1.5">
                <Heart size={14} className="text-red-500" />
                <span>{workout.avgHeartRate} bpm</span>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between w-full md:w-auto gap-4 pl-4 md:pl-0 border-l md:border-l-0 border-border">
        {/* Feeling & Notes Snippet */}
        <div className="flex flex-col items-start md:items-end text-sm">
          <div className="flex gap-2">
            {workout.rpe && (
              <div className={`flex items-center gap-1.5 mb-1 px-2 py-1 rounded-lg border text-xs font-bold ${getRpeColor(workout.rpe)}`}>
                <Gauge size={14} />
                <span>RPE {workout.rpe}</span>
              </div>
            )}
            {workout.feeling && (
              <div className="flex items-center gap-1.5 mb-1 px-2 py-1 bg-secondary rounded-lg border border-border">
                {getFeelingIcon(workout.feeling)}
                <span className="font-medium text-xs">{workout.feeling}</span>
              </div>
            )}
          </div>
          {workout.notes && <p className="text-xs italic text-muted-foreground/60 max-w-[150px] truncate">"{workout.notes}"</p>}
        </div>

        {showActions && (
          <div className="flex gap-1 opacity-100 md:opacity-0 group-hover:opacity-100 transition-opacity">
            <button
              onClick={() => openModal(workout)}
              className="p-2 text-muted-foreground hover:bg-secondary hover:text-foreground rounded-lg transition-colors"
            >
              <Edit2 size={16} />
            </button>
            <button
              onClick={() => handleDelete(workout.id)}
              className="p-2 text-destructive hover:bg-destructive/10 rounded-lg transition-colors"
            >
              <Trash2 size={16} />
            </button>
          </div>
        )}
      </div>
    </motion.div>
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <h1 className="text-3xl font-serif font-bold tracking-tight">Workout Log</h1>
        <button
          onClick={() => openModal()}
          className="flex items-center gap-2 bg-primary text-primary-foreground px-4 py-2 rounded-lg font-medium hover:opacity-90 transition-opacity"
        >
          <Plus size={18} /> Log Workout
        </button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card border border-border p-4 rounded-xl shadow-sm">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" size={18} />
          <input
            type="text"
            placeholder="Search notes or types..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-background border border-border rounded-lg pl-10 pr-4 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          />
        </div>
        <div className="flex items-center gap-2">
          <Filter className="text-muted-foreground" size={18} />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="bg-background border border-border rounded-lg px-3 py-2 focus:ring-2 focus:ring-primary focus:outline-none"
          >
            <option value="All">All Types</option>
            {Object.values(WorkoutType).map(t => <option key={t} value={t}>{t}</option>)}
          </select>
        </div>
      </div>

      {/* Today's Workouts Section */}
      {todayWorkouts.length > 0 ? (
        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          className="space-y-3"
        >
          <div className="flex items-center gap-2 text-primary font-bold uppercase tracking-wider text-xs">
            <CalendarDays size={14} />
            Today's Overview
          </div>
          <div className="grid gap-4">
            {todayWorkouts.map(workout => (
              <WorkoutCard key={workout.id} workout={workout} showActions={false} />
            ))}
          </div>
          <div className="border-b border-border my-6"></div>
        </motion.div>
      ) : (
        <motion.div variants={itemVariants} className="text-center py-12 text-muted-foreground bg-card border border-border rounded-xl">
          No workouts logged for today. Time to get moving!
        </motion.div>
      )}

      {/* Modal Overlay */}
      <AnimatePresence>
        {isModalOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          >
            <motion.div
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-card border border-border w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col"
            >
              <div className="p-5 border-b border-border flex justify-between items-center bg-muted/20">
                <h2 className="text-xl font-bold font-serif tracking-tight">{editingId ? 'Edit Workout' : 'Log New Workout'}</h2>
                <button onClick={() => setIsModalOpen(false)} className="text-muted-foreground hover:text-foreground p-1 rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors">
                  <X size={24} />
                </button>
              </div>

              <form onSubmit={handleSave} className="p-6 overflow-y-auto custom-scrollbar">

                {/* Live Estimate Banner */}
                <div className="mb-6 bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-950/30 dark:to-orange-900/20 border border-orange-200 dark:border-orange-900/50 rounded-xl p-4 flex items-center justify-between shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="bg-orange-500/20 p-2.5 rounded-xl text-orange-600 dark:text-orange-400">
                      <Flame size={24} fill="currentColor" />
                    </div>
                    <div>
                      <p className="text-xs font-bold text-orange-800 dark:text-orange-300 uppercase tracking-widest">Estimated Burn</p>
                      <p className="text-3xl font-black text-orange-900 dark:text-orange-100 font-mono leading-none mt-0.5">
                        {estimatedCalories} <span className="text-sm font-sans font-medium text-orange-800/70 dark:text-orange-300/70">kcal</span>
                      </p>
                    </div>
                  </div>
                  <div className="text-right text-xs font-medium text-muted-foreground max-w-[140px] leading-tight opacity-70">
                    Based on your weight, activity type & duration.
                  </div>
                </div>

                <div className="space-y-6">
                  {/* Row 1: Date & Time */}
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Date</label>
                      <input
                        type="date"
                        max={new Date().toLocaleDateString('en-CA')}
                        value={formData.date}
                        onChange={e => setFormData({ ...formData, date: e.target.value })}
                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all ${errors.date ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Time</label>
                      <input
                        type="time"
                        value={formData.time}
                        onChange={e => setFormData({ ...formData, time: e.target.value })}
                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all ${errors.time ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>
                  </div>

                  {/* Row 2: Type & Duration */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Activity Type</label>
                      <div className="relative">
                        <select
                          value={formData.type}
                          onChange={e => setFormData({ ...formData, type: e.target.value })}
                          className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 pr-10 focus:ring-2 focus:ring-primary focus:outline-none appearance-none transition-all"
                        >
                          {Object.values(WorkoutType).map(t => <option key={t} value={t}>{t}</option>)}
                        </select>
                        <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-muted-foreground">
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M6 9l6 6 6-6" /></svg>
                        </div>
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Duration (min)</label>
                      <input
                        type="number"
                        min="1"
                        value={formData.duration}
                        onChange={e => setFormData({ ...formData, duration: Number(e.target.value) })}
                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all ${errors.duration ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>
                  </div>

                  {/* Row 3: Metrics (Heart Rate, Steps, Distance) */}
                  <div className={`grid gap-4 ${(formData.type === WorkoutType.Running || formData.type === WorkoutType.Walking) ? 'grid-cols-3' : 'grid-cols-1'}`}>
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1">
                        <Heart size={10} /> BPM
                      </label>
                      <input
                        type="number"
                        min="0"
                        max="220"
                        placeholder="--"
                        value={formData.avgHeartRate || ''}
                        onChange={e => setFormData({ ...formData, avgHeartRate: Number(e.target.value) })}
                        className={`w-full bg-secondary/50 border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all ${errors.avgHeartRate ? 'border-destructive' : 'border-border'}`}
                      />
                    </div>

                    {(formData.type === WorkoutType.Running || formData.type === WorkoutType.Walking) && (
                      <>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Steps</label>
                          <input
                            type="number"
                            min="0"
                            placeholder="--"
                            value={formData.steps || ''}
                            onChange={e => setFormData({ ...formData, steps: Number(e.target.value) })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                          />
                        </div>
                        <div className="space-y-1.5">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Km</label>
                          <input
                            type="number"
                            min="0"
                            step="0.1"
                            placeholder="--"
                            value={formData.distance || ''}
                            onChange={e => setFormData({ ...formData, distance: Number(e.target.value) })}
                            className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Row 4: Intensity & Feeling */}
                  <div className="space-y-4 pt-2">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-1.5">
                        <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Intensity</label>
                        <div className="flex flex-col gap-2">
                          {Object.values(Intensity).map((int) => (
                            <button
                              key={int}
                              type="button"
                              onClick={() => setFormData({ ...formData, intensity: int })}
                              className={`py-2 px-3 rounded-lg text-sm font-semibold border transition-all text-center ${formData.intensity === int
                                ? int === Intensity.High ? 'bg-red-500 text-white border-red-600'
                                  : int === Intensity.Medium ? 'bg-orange-500 text-white border-orange-600'
                                    : 'bg-green-500 text-white border-green-600'
                                : 'bg-background border-border hover:bg-secondary text-muted-foreground'
                                }`}
                            >
                              {int}
                            </button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Effort (RPE)</label>
                          <span className={`text-xs font-bold px-2 py-0.5 rounded ${getRpeColor(Number(formData.rpe) || 5)}`}>{formData.rpe}/10</span>
                        </div>
                        <div className="h-full flex items-center bg-secondary/30 rounded-xl px-2 border border-border">
                          <input
                            type="range"
                            min="1"
                            max="10"
                            step="1"
                            value={formData.rpe || 5}
                            onChange={(e) => setFormData({ ...formData, rpe: Number(e.target.value) })}
                            className="w-full accent-primary h-2 bg-secondary rounded-lg appearance-none cursor-pointer"
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-muted-foreground px-1">
                          <span>Easy</span>
                          <span>Max</span>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">How did it feel?</label>
                      <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
                        {Object.values(Feeling).map((f) => (
                          <button
                            key={f}
                            type="button"
                            onClick={() => setFormData({ ...formData, feeling: f })}
                            className={`flex-1 flex flex-col items-center gap-1 min-w-[60px] p-2 rounded-xl border transition-all ${formData.feeling === f
                              ? 'bg-primary/10 border-primary text-primary shadow-[0_0_0_1px_rgba(var(--primary))]'
                              : 'bg-background border-border hover:bg-secondary text-muted-foreground'
                              }`}
                          >
                            {getFeelingIcon(f)}
                            <span className="text-[10px] font-medium">{f}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>

                  {/* Row 5: Notes */}
                  <div className="space-y-1.5">
                    <label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Notes</label>
                    <textarea
                      rows={3}
                      value={formData.notes}
                      onChange={e => setFormData({ ...formData, notes: e.target.value })}
                      className="w-full bg-secondary/50 border border-border rounded-xl px-4 py-3 focus:ring-2 focus:ring-primary focus:outline-none transition-all resize-none"
                      placeholder="How did the workout go?"
                    />
                  </div>
                </div>

                <div className="pt-6">
                  <button
                    type="submit"
                    className="w-full bg-primary text-primary-foreground font-bold py-4 rounded-xl shadow-lg shadow-primary/20 hover:scale-[1.01] active:scale-[0.99] transition-all"
                  >
                    {editingId ? 'Update Workout' : 'Log Workout'}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export default Workouts;