"use client"

import React from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Calendar, CheckCircle2, Users, Heart, ArrowRight, Shield, Globe } from 'lucide-react';
import { useStore } from '@/lib/store';

export const LandingPage = () => {
  const { setLanguage, settings } = useStore();
  
  return (
    <div className="min-h-screen bg-[#FDFCF9] text-[#2D3436] selection:bg-[#6C5CE7] selection:text-white">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/70 backdrop-blur-xl border-b border-[#E0E0E0]">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-[#6C5CE7] rounded-xl flex items-center justify-center shadow-lg shadow-[#6C5CE7]/30">
              <Calendar className="text-white w-6 h-6" />
            </div>
            <span className="text-2xl font-black tracking-tighter lowercase">zadoda</span>
          </div>
          
          <div className="flex items-center gap-4">
            <Button 
              variant="ghost" 
              className="font-bold text-sm"
              onClick={() => setLanguage(settings.language === 'en' ? 'ar' : 'en')}
            >
              <Globe className="w-4 h-4 mr-2" />
              {settings.language === 'en' ? 'العربية' : 'English'}
            </Button>
            <Link href="/login">
              <Button variant="ghost" className="font-bold">Sign In</Button>
            </Link>
            <Link href="/signup">
              <Button className="bg-[#6C5CE7] hover:bg-[#5849C4] text-white font-bold rounded-full px-6 shadow-lg shadow-[#6C5CE7]/20 transition-all hover:scale-105 active:scale-95">
                Get Started
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-40 pb-20 px-6">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-12 items-center">
          <div className="space-y-8 animate-in fade-in slide-in-from-left duration-1000">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#6C5CE7]/10 text-[#6C5CE7] rounded-full text-sm font-black uppercase tracking-widest">
              <Heart className="w-4 h-4" />
              For Every Family
            </div>
            <h1 className="text-6xl lg:text-8xl font-black tracking-tighter leading-[0.9] text-[#2D3436]">
              Harmony at <br />
              <span className="text-[#6C5CE7]">Home</span>.
            </h1>
            <p className="text-xl text-[#636E72] max-w-lg leading-relaxed font-medium">
              Zadoda is the premium family scheduler designed to bring peace to your daily routine. From shared calendars to chore tracking, we help your family stay connected and organized.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 pt-4">
              <Link href="/signup">
                <Button className="w-full sm:w-auto h-16 px-10 bg-[#6C5CE7] hover:bg-[#5849C4] text-white text-lg font-black rounded-3xl shadow-2xl shadow-[#6C5CE7]/40 transition-all hover:scale-105 active:scale-95">
                  Start Your Family Journey
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Link href="/login">
                <Button variant="outline" className="w-full sm:w-auto h-16 px-10 text-lg font-black rounded-3xl border-2 hover:bg-white transition-all">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
          
          <div className="relative animate-in fade-in zoom-in duration-1000 delay-200">
            <div className="relative z-10 rounded-[3rem] overflow-hidden shadow-2xl shadow-[#6C5CE7]/10 border-8 border-white">
              <Image 
                src="/zadoda_landing_hero_1778585693448.png" 
                alt="Zadoda App Interface" 
                width={800} 
                height={600} 
                className="w-full h-auto object-cover"
                priority
              />
            </div>
            {/* Decorative elements */}
            <div className="absolute -top-12 -right-12 w-48 h-48 bg-[#FAB1A0] rounded-full blur-[100px] opacity-30" />
            <div className="absolute -bottom-12 -left-12 w-64 h-64 bg-[#55EFC4] rounded-full blur-[100px] opacity-30" />
          </div>
        </div>
      </section>

      {/* Features Grid */}
      <section className="py-32 bg-white px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-20">
            <h2 className="text-4xl lg:text-5xl font-black tracking-tighter">Everything your family needs</h2>
            <p className="text-lg text-[#636E72] max-w-2xl mx-auto font-medium">Simple tools for complex lives. Zadoda brings clarity to the chaos of family management.</p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            <FeatureCard 
              icon={<Calendar className="w-8 h-8" />}
              title="Shared Calendar"
              description="Coordinate appointments, practices, and events with a unified family view that everyone can see."
              color="#6C5CE7"
            />
            <FeatureCard 
              icon={<CheckCircle2 className="w-8 h-8" />}
              title="Chore Tracking"
              description="Teach responsibility with interactive chore lists, progress tracking, and encouraging rewards."
              color="#00B894"
            />
            <FeatureCard 
              icon={<Users className="w-8 h-8" />}
              title="Family Profiles"
              description="Individualized views for parents and children, ensuring everyone sees what matters most to them."
              color="#0984E3"
            />
          </div>
        </div>
      </section>

      {/* Security Section */}
      <section className="py-32 px-6">
        <div className="max-w-5xl mx-auto bg-[#6C5CE7] rounded-[4rem] p-12 lg:p-24 text-white relative overflow-hidden shadow-2xl shadow-[#6C5CE7]/40">
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-6">
              <div className="w-16 h-16 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center">
                <Shield className="w-8 h-8" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-black tracking-tighter leading-tight">Your family's privacy is our priority</h2>
              <p className="text-white/80 text-lg font-medium leading-relaxed">
                We use industry-standard encryption and Firebase security to keep your family data private and secure. Only your family members have access to your workspace.
              </p>
            </div>
            <div className="flex justify-center">
              <div className="bg-white/10 backdrop-blur-md p-8 rounded-3xl border border-white/20 w-full">
                <ul className="space-y-4">
                  {[
                    "End-to-end encryption",
                    "Parental PIN protection",
                    "No tracking cookies",
                    "Secure cloud backups",
                    "GDPR Compliant"
                  ].map((item, i) => (
                    <li key={i} className="flex items-center gap-3 font-black text-lg">
                      <CheckCircle2 className="w-6 h-6 text-[#55EFC4]" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            </div>
          </div>
          {/* Abstract circles */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-white/5 rounded-full translate-x-1/2 -translate-y-1/2" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/5 rounded-full -translate-x-1/2 translate-y-1/2" />
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 border-t border-[#E0E0E0] px-6">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-[#6C5CE7] rounded-lg flex items-center justify-center">
              <Calendar className="text-white w-5 h-5" />
            </div>
            <span className="text-xl font-black tracking-tighter lowercase">zadoda</span>
          </div>
          <p className="text-[#636E72] font-medium">&copy; 2026 Zadoda Family Scheduler. All rights reserved.</p>
          <div className="flex gap-8">
            <Link href="#" className="text-[#636E72] hover:text-[#6C5CE7] font-black uppercase text-xs tracking-widest">Privacy</Link>
            <Link href="#" className="text-[#636E72] hover:text-[#6C5CE7] font-black uppercase text-xs tracking-widest">Terms</Link>
            <Link href="#" className="text-[#636E72] hover:text-[#6C5CE7] font-black uppercase text-xs tracking-widest">Support</Link>
          </div>
        </div>
      </footer>
    </div>
  );
};

const FeatureCard = ({ icon, title, description, color }: { icon: React.ReactNode, title: string, description: string, color: string }) => (
  <div className="p-10 rounded-[3rem] bg-[#FDFCF9] border border-[#E0E0E0] hover:border-transparent hover:shadow-2xl hover:shadow-[#6C5CE7]/5 transition-all group">
    <div 
      className="w-16 h-16 rounded-2xl flex items-center justify-center mb-8 group-hover:scale-110 transition-transform shadow-lg shadow-black/5"
      style={{ backgroundColor: `${color}15`, color }}
    >
      {icon}
    </div>
    <h3 className="text-2xl font-black tracking-tight mb-4">{title}</h3>
    <p className="text-[#636E72] font-medium leading-relaxed">{description}</p>
  </div>
);
