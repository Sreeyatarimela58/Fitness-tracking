import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import {
    User, Calendar, Ruler, Weight, Activity, Target, Flame,
    ChevronRight, Info, CheckCircle2, AlertTriangle
} from 'lucide-react';
import { getProfile, saveProfile, calculateBMI } from '../services/storage';
import { motion } from 'framer-motion';

const Gender = {
    Male: 'Male',
    Female: 'Female',
    Other: 'Other'
};

const ActivityLevel = {
    Sedentary: 'Sedentary',
    Light: 'Light',
    Moderate: 'Moderate',
    Active: 'Active',
    VeryActive: 'Very Active'
};

const ProfileSetup = () => {
    const navigate = useNavigate();
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({
        name: '',
        age: 25,
        gender: 'Male',
        height: 170,
        weight: 70,
        activityLevel: 'Moderate',
        goalSteps: 10000,
        goalCalories: 500,
        joinedDate: new Date().toISOString()
    });

    const [bmiResult, setBmiResult] = useState(null);

    useEffect(() => {
        const loadProfile = async () => {
            const existing = await getProfile();
            if (existing) {
                setFormData(existing);
                setIsEditing(true);
            }
        };
        loadProfile();
    }, []);

    useEffect(() => {
        // Prevent division by zero or negative calculation artifacts
        if (formData.height > 0 && formData.weight > 0) {
            setBmiResult(calculateBMI(formData.height, formData.weight));
        } else {
            setBmiResult(null);
        }
    }, [formData.height, formData.weight]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        // Enforce positive numbers for numeric fields
        if (['age', 'height', 'weight', 'goalSteps', 'goalCalories'].includes(name)) {
            if (value === '') {
                setFormData(prev => ({ ...prev, [name]: '' }));
                return;
            }
            const numVal = Number(value);
            if (numVal < 0) return; // Prevent negative input
            setFormData(prev => ({ ...prev, [name]: numVal }));
        } else {
            setFormData(prev => ({ ...prev, [name]: value }));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!formData.name.trim()) {
            toast.error("Please enter your name");
            return;
        }
        if (formData.age < 1 || formData.height < 1 || formData.weight < 1) {
            toast.error("Please enter valid positive numbers for Age, Height, and Weight.");
            return;
        }

        await saveProfile(formData);
        toast.success("Profile saved successfully!");
        navigate('/dashboard');
    };

    // Helper for BMI Gauge Position (Clamp between 0% and 100%)
    // Scale: 15 (min) to 40 (max) covers most ranges
    const getBmiPosition = () => {
        if (!bmiResult) return 0;
        const min = 15;
        const max = 40;
        const pos = ((bmiResult.value - min) / (max - min)) * 100;
        return Math.max(0, Math.min(100, pos));
    };

    const containerVariants = {
        hidden: { opacity: 0 },
        visible: {
            opacity: 1,
            transition: {
                staggerChildren: 0.1
            }
        },
        exit: { opacity: 0, transition: { duration: 0.3 } }
    };

    const itemVariants = {
        hidden: { opacity: 0, y: 30 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: "easeOut" } }
    };

    return (
        <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="max-w-5xl mx-auto pb-12"
        >

            {/* Header */}
            <motion.div variants={itemVariants} className="mb-10 text-center md:text-left">
                <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground mb-2">
                    Setup Your Profile
                </h1>
                <p className="text-muted-foreground text-lg max-w-2xl">
                    Let's personalize your experience. We use these details to calculate accurate health metrics and daily goals.
                </p>
            </motion.div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">

                {/* Left Column: Form */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSubmit} className="space-y-8">

                        {/* Section 1: Personal Details */}
                        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary/10 text-primary">
                                    <User size={18} />
                                </span>
                                Personal Details
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div className="col-span-1 md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Full Name</label>
                                    <div className="relative">
                                        <User className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                                        <input
                                            type="text"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            placeholder="e.g. Alex Johnson"
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Age</label>
                                    <div className="relative">
                                        <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                                        <input
                                            type="number"
                                            name="age"
                                            min="1"
                                            value={formData.age}
                                            onChange={handleChange}
                                            disabled={isEditing}
                                            className={`w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Gender</label>
                                    <div className="relative">
                                        <select
                                            name="gender"
                                            value={formData.gender}
                                            onChange={handleChange}
                                            disabled={isEditing}
                                            className={`w-full pl-3 pr-8 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none appearance-none ${isEditing ? 'opacity-50 cursor-not-allowed' : ''}`}
                                        >
                                            {Object.values(Gender).map(g => <option key={g} value={g}>{g}</option>)}
                                        </select>
                                        <ChevronRight className="absolute right-3 top-1/2 -translate-y-1/2 rotate-90 text-muted-foreground/50 pointer-events-none" size={16} />
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Section 2: Body Stats */}
                        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-blue-500/10 text-blue-500">
                                    <Activity size={18} />
                                </span>
                                Body Stats
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Height (cm)</label>
                                    <div className="relative">
                                        <Ruler className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                                        <input
                                            type="number"
                                            name="height"
                                            min="1"
                                            value={formData.height}
                                            onChange={handleChange}
                                            placeholder="170"
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Weight (kg)</label>
                                    <div className="relative">
                                        <Weight className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
                                        <input
                                            type="number"
                                            name="weight"
                                            min="1"
                                            value={formData.weight}
                                            onChange={handleChange}
                                            placeholder="70"
                                            className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                        />
                                    </div>
                                </div>

                                <div className="md:col-span-2">
                                    <label className="block text-sm font-medium text-muted-foreground mb-1.5">Activity Level</label>
                                    <select
                                        name="activityLevel"
                                        value={formData.activityLevel}
                                        onChange={handleChange}
                                        className="w-full px-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                                    >
                                        {Object.values(ActivityLevel).map(l => <option key={l} value={l}>{l}</option>)}
                                    </select>
                                    <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                                        <Info size={12} />
                                        Used to calculate your recommended calorie intake.
                                    </p>
                                </div>
                            </div>
                        </motion.div>

                        {/* Section 3: Daily Goals */}
                        <motion.div variants={itemVariants} className="bg-card border border-border rounded-2xl p-6 md:p-8 shadow-sm">
                            <h3 className="text-lg font-bold flex items-center gap-2 mb-6 text-foreground">
                                <span className="flex items-center justify-center w-8 h-8 rounded-lg bg-yellow-500/10 text-yellow-500">
                                    <Target size={18} />
                                </span>
                                Daily Goals
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                {/* Steps Input Card */}
                                <div className="bg-secondary/30 p-4 rounded-xl border border-border focus-within:ring-2 focus-within:ring-primary transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="text-sm font-medium text-muted-foreground">Daily Steps</label>
                                        <Target size={16} className="text-primary/70" />
                                    </div>
                                    <input
                                        type="number"
                                        name="goalSteps"
                                        min="1"
                                        value={formData.goalSteps}
                                        onChange={handleChange}
                                        className="w-full bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-muted-foreground/30"
                                    />
                                </div>

                                {/* Calories Input Card */}
                                <div className="bg-secondary/30 p-4 rounded-xl border border-border focus-within:ring-2 focus-within:ring-orange-500 transition-all">
                                    <div className="flex justify-between items-start mb-2">
                                        <label className="text-sm font-medium text-muted-foreground">Daily Burn (kcal)</label>
                                        <Flame size={16} className="text-orange-500/70" />
                                    </div>
                                    <input
                                        type="number"
                                        name="goalCalories"
                                        min="1"
                                        value={formData.goalCalories}
                                        onChange={handleChange}
                                        className="w-full bg-transparent text-2xl font-mono font-bold outline-none placeholder:text-muted-foreground/30"
                                    />
                                </div>
                            </div>
                        </motion.div>

                        <motion.div variants={itemVariants} className="pt-2">
                            <button
                                type="submit"
                                className="w-full bg-primary hover:bg-primary/90 text-primary-foreground font-bold text-lg py-4 rounded-xl shadow-lg shadow-primary/20 transition-all hover:scale-[1.01] active:scale-[0.99] flex items-center justify-center gap-2"
                            >
                                Save & Continue <ChevronRight size={20} />
                            </button>
                        </motion.div>
                    </form>
                </div>

                {/* Right Column: Live BMI Insights (Sticky) */}
                <motion.div variants={itemVariants} className="lg:col-span-1">
                    <div className="sticky top-28 space-y-6">

                        {/* BMI Card */}
                        <div className="bg-card border border-border rounded-2xl overflow-hidden shadow-lg">
                            <div className="bg-secondary/40 p-6 text-center border-b border-border">
                                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground mb-2">Calculated BMI</h3>
                                {bmiResult ? (
                                    <div className="animate-in zoom-in duration-300">
                                        <span className="text-6xl font-black font-sans tracking-tighter text-foreground block mb-2">
                                            {bmiResult.value}
                                        </span>
                                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-sm font-bold border ${bmiResult.category === 'Normal weight' ? 'bg-green-100 text-green-700 border-green-200 dark:bg-green-500/20 dark:text-green-400 dark:border-green-500/30' :
                                            bmiResult.category.includes('Overweight') ? 'bg-yellow-100 text-yellow-700 border-yellow-200 dark:bg-yellow-500/20 dark:text-yellow-400 dark:border-yellow-500/30' :
                                                bmiResult.category === 'Underweight' ? 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/20 dark:text-blue-400 dark:border-blue-500/30' :
                                                    'bg-red-100 text-red-700 border-red-200 dark:bg-red-500/20 dark:text-red-400 dark:border-red-500/30'
                                            }`}>
                                            {bmiResult.category === 'Normal weight' ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
                                            {bmiResult.category}
                                        </span>
                                    </div>
                                ) : (
                                    <div className="text-muted-foreground py-8">
                                        Enter Height & Weight
                                    </div>
                                )}
                            </div>

                            {/* Visual Gauge */}
                            <div className="p-6 bg-card">
                                <div className="relative h-4 w-full rounded-full bg-gradient-to-r from-blue-400 via-green-400 via-yellow-400 to-red-500 mb-2">
                                    {/* Marker */}
                                    {bmiResult && (
                                        <div
                                            className="absolute top-1/2 -translate-y-1/2 w-4 h-8 bg-foreground border-2 border-background rounded-md shadow-md transition-all duration-500 ease-out"
                                            style={{ left: `calc(${getBmiPosition()}% - 8px)` }}
                                        />
                                    )}
                                </div>
                                <div className="flex justify-between text-[10px] text-muted-foreground font-mono font-medium uppercase">
                                    <span>Under</span>
                                    <span>Normal</span>
                                    <span>Over</span>
                                    <span>Obese</span>
                                </div>
                            </div>

                            <div className="px-6 pb-6 pt-2">
                                <p className="text-xs text-muted-foreground leading-relaxed">
                                    <Info size={12} className="inline mr-1 text-primary" />
                                    BMI is a screening tool used to identify potential weight problems. However, it does not measure body fat directly.
                                </p>
                            </div>
                        </div>

                        {/* Summary Box */}
                        <div className="bg-gradient-to-br from-primary/10 to-primary/5 border border-primary/20 rounded-2xl p-6">
                            <h4 className="font-bold text-foreground mb-2">Why track this?</h4>
                            <p className="text-sm text-muted-foreground leading-relaxed">
                                Accurate body metrics help FitTrack Pro calculate your basal metabolic rate (BMR), ensuring your calorie burn estimates are tailored specifically to your physiology.
                            </p>
                        </div>
                    </div>
                </motion.div>
            </div>
        </motion.div>
    );
};

export default ProfileSetup;