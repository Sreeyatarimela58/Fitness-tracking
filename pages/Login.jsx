import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { loginUser } from '../services/storage';
import { Activity, Mail } from 'lucide-react';
import { motion } from 'framer-motion';
import { toast } from 'react-toastify';

const Login = () => {
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    if (!email.trim()) {
      toast.error("Please enter your email");
      return;
    }

    setIsLoading(true);
    try {
      // Simulate network delay for effect
      await new Promise(resolve => setTimeout(resolve, 800));

      const user = await loginUser(email);

      if (user.profile) {
        navigate('/dashboard');
      } else {
        navigate('/setup');
      }
    } catch (error) {
      console.error(error);
      toast.error("Login failed. Please try again.");
    } finally {
      setIsLoading(false);
    }
  };

  const containerVariants = {
    hidden: { opacity: 0, scale: 0.95 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: {
        duration: 0.5,
        ease: "easeOut",
        staggerChildren: 0.1
      }
    },
    exit: {
      opacity: 0,
      scale: 0.95,
      transition: { duration: 0.3 }
    }
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.5 } }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-background to-secondary p-4">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        exit="exit"
        className="w-full max-w-md bg-card border border-border p-8 rounded-2xl shadow-xl flex flex-col items-center text-center space-y-8"
      >

        {/* Official Logo */}
        <motion.div variants={itemVariants} className="flex flex-col items-center gap-3">
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl bg-primary text-primary-foreground shadow-lg ring-4 ring-primary/20">
            <Activity size={40} strokeWidth={2.5} />
          </div>
          <div className="space-y-1">
            <h1 className="text-4xl font-serif font-bold tracking-tight flex items-center gap-2">
              FitTrack
              <span className="text-xs align-top text-primary-foreground font-sans font-bold uppercase tracking-widest bg-primary px-2 py-0.5 rounded-full">PRO</span>
            </h1>
            <p className="text-muted-foreground font-medium">Your complete fitness journey management system.</p>
          </div>
        </motion.div>

        <motion.div variants={itemVariants} className="w-full pt-4 space-y-4">
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground/50" size={18} />
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="Enter your email"
                className="w-full pl-10 pr-4 py-3 bg-background border border-border rounded-xl focus:ring-2 focus:ring-primary focus:border-primary transition-all outline-none"
                required
              />
            </div>

            <button
              type="submit"
              disabled={isLoading}
              className="w-full flex items-center justify-center gap-3 bg-primary hover:bg-primary/90 text-primary-foreground font-bold py-3.5 px-4 rounded-xl transition-all duration-200 shadow-lg shadow-primary/20 active:scale-[0.98] disabled:opacity-70 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <span className="animate-pulse">Logging in...</span>
              ) : (
                <span>Continue with Email</span>
              )}
            </button>
          </form>

          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <span className="w-full border-t border-border" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-card px-2 text-muted-foreground">Or continue with</span>
            </div>
          </div>

          <button
            type="button"
            className="w-full flex items-center justify-center gap-3 bg-white dark:bg-zinc-100 text-gray-800 border border-gray-200 hover:bg-gray-50 font-medium py-3.5 px-4 rounded-xl transition-all duration-200 shadow-sm hover:shadow-md active:scale-[0.98]"
          >
            <svg viewBox="0 0 24 24" width="24" height="24" xmlns="http://www.w3.org/2000/svg">
              <g transform="matrix(1, 0, 0, 1, 27.009001, -39.23856)">
                <path fill="#4285F4" d="M -3.264 51.509 C -3.264 50.719 -3.334 49.969 -3.454 49.239 L -14.754 49.239 L -14.754 53.749 L -8.284 53.749 C -8.574 55.225 -9.429 56.472 -10.689 57.325 L -10.689 60.325 L -6.829 60.325 C -4.569 58.235 -3.264 55.159 -3.264 51.509 Z" />
                <path fill="#34A853" d="M -14.754 63.239 C -11.519 63.239 -8.804 62.157 -6.829 60.323 L -10.689 57.323 C -11.769 58.044 -13.149 58.489 -14.754 58.489 C -17.894 58.489 -20.554 56.345 -21.504 53.485 L -25.494 53.485 L -25.494 56.579 C -23.514 60.538 -19.424 63.239 -14.754 63.239 Z" />
                <path fill="#FBBC05" d="M -21.504 53.485 C -21.739 52.725 -21.869 51.906 -21.869 51.069 C -21.869 50.231 -21.739 49.412 -21.504 48.652 L -21.504 45.558 L -25.494 45.558 C -26.339 47.227 -26.814 49.097 -26.814 51.069 C -26.814 53.041 -26.339 54.911 -25.494 56.579 L -21.504 53.485 Z" />
                <path fill="#EA4335" d="M -14.754 43.649 C -12.984 43.649 -11.404 44.257 -10.159 45.45 L -6.729 42.02 C -8.804 40.09 -11.519 38.899 -14.754 38.899 C -19.424 38.899 -23.514 41.599 -25.494 45.558 L -21.504 48.652 C -20.554 45.792 -17.894 43.649 -14.754 43.649 Z" />
              </g>
            </svg>
            <span className="font-semibold">Continue with Google</span>
          </button>
        </motion.div>

        <motion.p variants={itemVariants} className="text-xs text-muted-foreground px-8 leading-relaxed">
          By continuing, you verify that you are a real human being and not a robot.
        </motion.p>
      </motion.div>
    </div>
  );
};

export default Login;