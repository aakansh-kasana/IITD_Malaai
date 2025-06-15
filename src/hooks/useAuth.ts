import { useState, useEffect } from 'react';
import { User as SupabaseUser } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { User } from '../types';

export const useAuth = () => {
  const [user, setUser] = useState<User | null>(null);
  const [supabaseUser, setSupabaseUser] = useState<SupabaseUser | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // Get initial session with timeout
    const getInitialSession = async () => {
      try {
        // Set a timeout to prevent infinite loading
        const timeoutPromise = new Promise((_, reject) => 
          setTimeout(() => reject(new Error('Authentication timeout')), 5000)
        );

        const sessionPromise = supabase.auth.getSession();
        
        const { data: { session }, error } = await Promise.race([
          sessionPromise,
          timeoutPromise
        ]) as any;

        if (error && !error.message.includes('Demo mode') && !error.message.includes('timeout')) {
          throw error;
        }
        
        if (session?.user) {
          setSupabaseUser(session.user);
          await loadUserProfile(session.user.id);
        } else {
          // No session found, continue without user
          setLoading(false);
        }
      } catch (err) {
        console.warn('Authentication initialization failed, continuing in demo mode:', err);
        // Don't set error for demo mode or timeout, just continue
        setLoading(false);
      }
    };

    getInitialSession();

    // Listen for auth changes with error handling
    let subscription: any;
    try {
      const { data: { subscription: authSubscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
          console.log('Auth state changed:', event, session?.user?.email);
          
          if (session?.user) {
            setSupabaseUser(session.user);
            await loadUserProfile(session.user.id);
          } else {
            setSupabaseUser(null);
            setUser(null);
          }
          setLoading(false);
        }
      );
      subscription = authSubscription;
    } catch (err) {
      console.warn('Auth state listener failed, continuing in demo mode:', err);
      setLoading(false);
    }

    return () => {
      if (subscription) {
        subscription.unsubscribe();
      }
    };
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      // Load user profile with timeout
      const timeoutPromise = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('Profile load timeout')), 3000)
      );

      const profilePromise = supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      const { data: profile, error: profileError } = await Promise.race([
        profilePromise,
        timeoutPromise
      ]) as any;

      if (profileError && !profileError.message.includes('Demo mode') && !profileError.message.includes('timeout')) {
        throw profileError;
      }

      // If in demo mode or no profile, create a demo user
      if (!profile || profileError?.message.includes('Demo mode') || profileError?.message.includes('timeout')) {
        const demoUser: User = {
          id: userId,
          name: 'Demo User',
          email: 'demo@example.com',
          level: 1,
          xp: 0,
          currentStreak: 0,
          gradeLevel: 'high',
          achievements: [],
          completedModules: []
        };
        setUser(demoUser);
        setError(null);
        return;
      }

      // Load achievements and module progress with timeout
      const achievementsPromise = supabase
        .from('user_achievements')
        .select('*')
        .eq('user_id', userId)
        .order('unlocked_at', { ascending: false });

      const moduleProgressPromise = supabase
        .from('user_module_progress')
        .select('module_id')
        .eq('user_id', userId);

      const [achievementsResult, moduleProgressResult] = await Promise.allSettled([
        Promise.race([achievementsPromise, timeoutPromise]),
        Promise.race([moduleProgressPromise, timeoutPromise])
      ]);

      const achievements = achievementsResult.status === 'fulfilled' ? achievementsResult.value.data || [] : [];
      const moduleProgress = moduleProgressResult.status === 'fulfilled' ? moduleProgressResult.value.data || [] : [];

      const userProfile: User = {
        id: profile.id,
        name: profile.name,
        email: profile.email,
        level: profile.level,
        xp: profile.xp,
        currentStreak: profile.current_streak,
        gradeLevel: profile.grade_level as 'middle' | 'high' | 'college',
        achievements: achievements.map(a => ({
          id: a.achievement_id,
          title: a.title,
          description: a.description,
          icon: a.icon,
          rarity: a.rarity as 'common' | 'rare' | 'epic' | 'legendary',
          unlockedAt: new Date(a.unlocked_at)
        })),
        completedModules: moduleProgress.map(m => m.module_id)
      };

      setUser(userProfile);
      setError(null);
    } catch (err) {
      console.warn('Error loading user profile, creating demo user:', err);
      // Create demo user if database connection fails
      const demoUser: User = {
        id: userId,
        name: 'Demo User',
        email: 'demo@example.com',
        level: 1,
        xp: 0,
        currentStreak: 0,
        gradeLevel: 'high',
        achievements: [],
        completedModules: []
      };
      setUser(demoUser);
      setError('Running in demo mode - database not connected');
    }
  };

  const signUp = async (email: string, password: string, name: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            name
          }
        }
      });

      if (error) {
        if (error.message.includes('Demo mode')) {
          // Create a demo user for demo mode
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            name,
            email,
            level: 1,
            xp: 0,
            currentStreak: 0,
            gradeLevel: 'high',
            achievements: [],
            completedModules: []
          };
          setUser(demoUser);
          return { data: { user: { id: demoUser.id, email } }, error: null };
        }
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign up failed';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      setLoading(true);
      setError(null);

      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        if (error.message.includes('Demo mode')) {
          // Create a demo user for demo mode
          const demoUser: User = {
            id: 'demo-' + Date.now(),
            name: 'Demo User',
            email,
            level: 1,
            xp: 0,
            currentStreak: 0,
            gradeLevel: 'high',
            achievements: [],
            completedModules: []
          };
          setUser(demoUser);
          return { data: { user: { id: demoUser.id, email } }, error: null };
        }
        throw error;
      }

      return { data, error: null };
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Sign in failed';
      setError(errorMessage);
      return { data: null, error: errorMessage };
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    try {
      setLoading(true);
      const { error } = await supabase.auth.signOut();
      if (error && !error.message.includes('Demo mode')) {
        throw error;
      }
      
      setUser(null);
      setSupabaseUser(null);
    } catch (err) {
      console.error('Error signing out:', err);
      // Force logout even if there's an error
      setUser(null);
      setSupabaseUser(null);
    } finally {
      setLoading(false);
    }
  };

  const updateUserProgress = async (moduleId: string, xpGained: number) => {
    if (!user) return;

    try {
      // Update module progress
      const { error: moduleError } = await supabase
        .from('user_module_progress')
        .upsert({
          user_id: user.id,
          module_id: moduleId,
          xp_gained: xpGained,
          score: 100 // Default score, can be customized
        });

      // Update user profile
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;
      const newStreak = user.currentStreak + 1;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          level: newLevel,
          current_streak: newStreak
        })
        .eq('id', user.id);

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        completedModules: [...prev.completedModules, moduleId]
      } : null);

    } catch (err) {
      console.error('Error updating user progress:', err);
      // Update local state for demo mode
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;
      const newStreak = user.currentStreak + 1;
      
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel,
        currentStreak: newStreak,
        completedModules: [...prev.completedModules, moduleId]
      } : null);
    }
  };

  const addAchievement = async (achievement: {
    id: string;
    title: string;
    description: string;
    icon: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  }) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('user_achievements')
        .insert({
          user_id: user.id,
          achievement_id: achievement.id,
          title: achievement.title,
          description: achievement.description,
          icon: achievement.icon,
          rarity: achievement.rarity
        });

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        achievements: [...prev.achievements, {
          ...achievement,
          unlockedAt: new Date()
        }]
      } : null);

    } catch (err) {
      console.error('Error adding achievement:', err);
      // Update local state for demo mode
      setUser(prev => prev ? {
        ...prev,
        achievements: [...prev.achievements, {
          ...achievement,
          unlockedAt: new Date()
        }]
      } : null);
    }
  };

  const saveDebateSession = async (
    topic: string,
    userSide: 'pro' | 'con',
    finalScore: number,
    xpGained: number,
    roundsCompleted: number
  ) => {
    if (!user) return;

    try {
      const { error } = await supabase
        .from('debate_sessions')
        .insert({
          user_id: user.id,
          topic,
          user_side: userSide,
          final_score: finalScore,
          xp_gained: xpGained,
          rounds_completed: roundsCompleted
        });

      // Update user XP
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;

      const { error: profileError } = await supabase
        .from('user_profiles')
        .update({
          xp: newXp,
          level: newLevel
        })
        .eq('id', user.id);

      // Update local state even if database update fails (demo mode)
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel
      } : null);

    } catch (err) {
      console.error('Error saving debate session:', err);
      // Update local state for demo mode
      const newXp = user.xp + xpGained;
      const newLevel = Math.floor(newXp / 200) + 1;
      
      setUser(prev => prev ? {
        ...prev,
        xp: newXp,
        level: newLevel
      } : null);
    }
  };

  return {
    user,
    supabaseUser,
    loading,
    error,
    signUp,
    signIn,
    signOut,
    updateUserProgress,
    addAchievement,
    saveDebateSession
  };
};