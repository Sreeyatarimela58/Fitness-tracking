import React, { useEffect, useState, useRef } from "react";
import { NavLink, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Dumbbell,
  FileText,
  User,
  LogOut,
  Sun,
  Moon,
} from "lucide-react";
import { logoutUser, getProfile, clearProfile } from "../services/storage";

// interface LayoutProps {
//   children: React.ReactNode;
// }

const AnimatedLogo = () => {
  const pathRef = useRef(null);

  const triggerAnimation = () => {
    if (pathRef.current) {
      // Reset the dash offset to 'hide' the path or prepare it
      pathRef.current.style.transition = "none";
      pathRef.current.style.strokeDasharray = "60"; // Length of the path approx
      pathRef.current.style.strokeDashoffset = "60";

      // Force a browser reflow to apply the reset immediately
      void pathRef.current.getBoundingClientRect();

      // Apply the animation
      pathRef.current.style.transition =
        "stroke-dashoffset 0.8s cubic-bezier(0.4, 0, 0.2, 1)";
      pathRef.current.style.strokeDashoffset = "0";
    }
  };

  return (
    <div
      className="relative flex h-10 w-10 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-sm ring-2 ring-primary/10 transition-transform duration-300 ease-out group-hover:scale-105 group-hover:ring-primary/30 group-active:scale-95 overflow-hidden"
      onMouseEnter={triggerAnimation}
    >
      <svg
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        className="w-6 h-6"
      >
        <path ref={pathRef} d="M22 12h-4l-3 9L9 3l-3 9H2" />
      </svg>
    </div>
  );
};

const Layout = ({ children }) => {
  const [isDark, setIsDark] = useState(true);
  const location = useLocation();
  const navigate = useNavigate();
  const [profile, setProfile] = useState(null); // Using any to avoid importing UserProfile if not already imported, or I can import it.

  useEffect(() => {
    const fetchProfile = async () => {
      const p = await getProfile();
      setProfile(p);
    };
    fetchProfile();
  }, [location.pathname]); // Re-fetch on navigation in case profile updates

  useEffect(() => {
    const savedTheme = localStorage.getItem("theme");
    if (savedTheme) {
      setIsDark(savedTheme === "dark");
    } else {
      setIsDark(true);
    }
  }, []);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add("dark");
      localStorage.setItem("theme", "dark");
    } else {
      document.documentElement.classList.remove("dark");
      localStorage.setItem("theme", "light");
    }
  }, [isDark]);

  const toggleTheme = () => setIsDark(!isDark);

  const handleLogout = async () => {
    // await clearProfile(); // REMOVED: Do not clear profile on logout, just local session
    setProfile(null);
    logoutUser();
    navigate("/");
  };

  if (location.pathname === "/") {
    return (
      <main className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans">
        {children}
      </main>
    );
  }

  const navItems = [
    { path: "/dashboard", icon: LayoutDashboard, label: "Dashboard" },
    { path: "/workouts", icon: Dumbbell, label: "Workouts" },
    { path: "/report", icon: FileText, label: "Report" },
  ];

  return (
    <div className="min-h-screen bg-background text-foreground transition-colors duration-300 font-sans selection:bg-primary/20">
      {/* Floating Navbar Island */}
      <nav className="fixed top-4 md:top-6 inset-x-4 md:inset-x-0 md:w-full md:max-w-4xl md:mx-auto z-50 animate-in fade-in slide-in-from-top-4 duration-700">
        <div className="h-16 md:h-20 px-4 md:px-6 rounded-2xl border border-border/60 bg-background/80 backdrop-blur-xl shadow-lg ring-1 ring-black/5 dark:ring-white/5 flex items-center justify-between">
          {/* Left: Interactive Logo */}
          <div className="flex-shrink-0">
            <Link
              to="/dashboard"
              className="group flex items-center gap-2 md:gap-3"
            >
              <AnimatedLogo />
              <div className="hidden md:flex flex-col gap-0 leading-none">
                <span className="font-serif font-bold tracking-tight text-xl transition-colors duration-300 group-hover:text-primary">
                  FitTrack
                </span>
              </div>
            </Link>
          </div>

          {/* Center: Navigation */}
          <div className="flex items-center gap-1 md:gap-2">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                className={({ isActive }) =>
                  `relative flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all duration-300 hover:scale-105 active:scale-95 ${
                    isActive
                      ? "bg-primary/10 text-primary shadow-sm ring-1 ring-primary/20"
                      : "text-muted-foreground hover:bg-secondary hover:text-foreground"
                  }`
                }
              >
                <item.icon
                  size={20}
                  className="transition-transform duration-300"
                />
                <span className="hidden sm:inline-block">{item.label}</span>
              </NavLink>
            ))}
          </div>

          {/* Right: Profile & Actions */}
          <div className="flex items-center gap-2 md:gap-4 pl-2 border-l border-border/50">
            {/* Profile Link (Refined) */}
            <NavLink
              to="/profile"
              className={({ isActive }) =>
                `group flex items-center gap-2 md:gap-3 p-1 pr-3 rounded-full transition-all border hover:scale-105 active:scale-95 ${
                  isActive
                    ? "bg-secondary border-border"
                    : "hover:bg-secondary border-transparent"
                }`
              }
            >
              {/* Official Avatar Style */}
              <div className="h-8 w-8 rounded-full bg-secondary border border-border text-foreground flex items-center justify-center text-xs font-bold shadow-sm group-hover:border-primary/50 transition-colors">
                {profile ? (
                  profile.name.charAt(0).toUpperCase()
                ) : (
                  <User size={14} />
                )}
              </div>
              <span className="hidden md:block text-sm font-medium max-w-[80px] truncate">
                {profile ? profile.name.split(" ")[0] : "Profile"}
              </span>
            </NavLink>

            <div className="flex items-center gap-1">
              <button
                onClick={toggleTheme}
                className="p-2 rounded-full text-muted-foreground hover:bg-secondary hover:text-foreground transition-all hover:rotate-12 active:scale-90"
                title={isDark ? "Switch to Light Mode" : "Switch to Dark Mode"}
              >
                {isDark ? <Sun size={18} /> : <Moon size={18} />}
              </button>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-all hover:rotate-6 active:scale-90"
                title="Log Out"
              >
                <LogOut size={18} />
              </button>
            </div>
          </div>
        </div>
      </nav>

      {/* Main Content Area */}
      <main className="w-full max-w-5xl mx-auto pt-28 md:pt-36 px-4 md:px-6 pb-20">
        {children}
      </main>
    </div>
  );
};

export default Layout;
