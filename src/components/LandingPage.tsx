"use client"

import React, { useState } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import {
  Calendar, CheckCircle2, Heart, ArrowRight, Shield,
  Globe, Clock, Sparkles, Zap, Smile
} from 'lucide-react';
import { useStore } from '@/lib/store';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/firebase';
import { signInWithGoogle } from '@/firebase/non-blocking-login';
import { Loader2 } from 'lucide-react';
import { PlaceHolderImages } from '@/lib/placeholder-images';

const APP_LOGO = PlaceHolderImages.find(img => img.id === 'app-logo')?.imageUrl ?? null;

const CAVEAT: React.CSSProperties = { fontFamily: "'Caveat', cursive" };
const FREDOKA: React.CSSProperties = { fontFamily: "'Fredoka', sans-serif" };
const NUNITO: React.CSSProperties = { fontFamily: "'Nunito', sans-serif" };

// ── Translations ───────────────────────────────────────────────────────────────
const T = {
  en: {
    signIn: 'Sign In', getStarted: 'Get Started',
    heroBadge: 'For Every Family',
    heroTitle: 'Harmony at ', heroTitleAccent: 'Home',
    heroSub: 'The premium family scheduler that brings peace to your daily routine. Shared calendars, chore tracking, and parenting tools — beautifully designed.',
    googleBtn: 'Continue with Google',
    createAccount: 'Create Free Account',
    socialProof: 'Loved by 10,000+ families',
    stat1: 'Families Organized', stat2: 'Tasks Completed', stat3: 'Average Rating', stat4: 'Uptime',
    featuresBadge: 'Everything you need',
    featuresTitle: 'Built for real family life',
    featuresSub: 'Not another productivity tool. A warm, thoughtful space designed around how families actually work.',
    featureTag: 'Included free',
    scenesBadge: 'A Day with Zadoda',
    scenesTitle: 'From sunrise to bedtime',
    scenesSub: "See how Zadoda fits seamlessly into every part of your family's day.",
    howBadge: 'Simple Setup',
    howTitle: 'Up and running in 3 minutes',
    howStep1Title: 'Create your family', howStep1Desc: 'Sign up in seconds. Add your family members — parents and kids — with custom colors and avatars.',
    howStep2Title: 'Build your schedule', howStep2Desc: 'Add events, checklists, and recurring routines. Set them to repeat daily, weekly, or however you need.',
    howStep3Title: 'Stay in sync', howStep3Desc: 'Everyone sees the same plan. Mark tasks done, earn streaks, and finally feel like a team.',
    testiBadge: 'Family Love',
    testiTitle: 'What families are saying',
    secTitle: "Your family's privacy is our priority",
    secSub: 'Industry-standard encryption and Firebase security keep your data private. Only your family has access to your workspace.',
    secItems: ['End-to-end data isolation', 'Parental PIN protection', 'No ad tracking', 'Secure cloud backups', 'Your data, your family only'],
    ctaTitle: 'Ready to bring harmony to your family?',
    ctaSub: "Join thousands of families who've traded morning chaos for calm, connected days — starting today.",
    ctaNote: 'Free forever · No credit card · Your data stays yours',
    footerCopy: '© 2026 Zadoda Family Scheduler. Made with ❤️ for families everywhere.',
    footerLinks: ['Privacy', 'Terms', 'Support'],
  },
  ar: {
    signIn: 'تسجيل الدخول', getStarted: 'ابدأ الآن',
    heroBadge: 'لكل عائلة',
    heroTitle: 'انسجام في ', heroTitleAccent: 'المنزل',
    heroSub: 'المنظم العائلي الذي يجلب السلام إلى روتينك اليومي. تقويم مشترك، متابعة المهام، وأدوات للتربية — مصمم بعناية.',
    googleBtn: 'المتابعة مع Google',
    createAccount: 'إنشاء حساب مجاني',
    socialProof: 'يحبه أكثر من 10,000 عائلة',
    stat1: 'عائلة منظمة', stat2: 'مهمة منجزة', stat3: 'متوسط التقييم', stat4: 'وقت التشغيل',
    featuresBadge: 'كل ما تحتاجه',
    featuresTitle: 'مصمم لحياة العائلة الحقيقية',
    featuresSub: 'ليس مجرد أداة إنتاجية. مساحة دافئة ومدروسة مصممة حول الطريقة التي تعمل بها العائلات فعلاً.',
    featureTag: 'مجاني',
    scenesBadge: 'يوم مع زدودة',
    scenesTitle: 'من الصباح حتى النوم',
    scenesSub: 'شاهد كيف تتلاءم زدودة بسلاسة مع كل جزء من يوم عائلتك.',
    howBadge: 'إعداد بسيط',
    howTitle: 'جاهز للعمل في 3 دقائق',
    howStep1Title: 'أنشئ عائلتك', howStep1Desc: 'سجّل في ثوانٍ. أضف أفراد عائلتك — الوالدين والأطفال — مع ألوان وصور مخصصة.',
    howStep2Title: 'ابنِ جدولك', howStep2Desc: 'أضف فعاليات وقوائم مهام وروتين متكرر. اضبطها لتتكرر يومياً أو أسبوعياً حسب احتياجك.',
    howStep3Title: 'ابقَ على تزامن', howStep3Desc: 'يرى الجميع نفس الخطة. أكمل المهام، اكسب سلاسل الإنجاز، واشعر أخيراً بروح الفريق.',
    testiBadge: 'محبة العائلات',
    testiTitle: 'ماذا تقول العائلات',
    secTitle: 'خصوصية عائلتك هي أولويتنا',
    secSub: 'التشفير القياسي وأمان Firebase يحافظان على خصوصية بياناتك. عائلتك فقط لها حق الوصول إلى مساحتك.',
    secItems: ['عزل بيانات كامل بين العائلات', 'حماية PIN للوالدين', 'بدون تتبع إعلاني', 'نسخ احتياطية آمنة على السحابة', 'بياناتك لعائلتك فقط'],
    ctaTitle: 'هل أنت مستعد لتحقيق الانسجام في عائلتك؟',
    ctaSub: 'انضم إلى آلاف العائلات التي استبدلت فوضى الصباح بأيام هادئة ومترابطة — ابدأ اليوم.',
    ctaNote: 'مجاني للأبد · بدون بطاقة ائتمان · بياناتك تبقى لك',
    footerCopy: '© 2026 زدودة المنظم العائلي. صُنع بـ ❤️ لعائلات في كل مكان.',
    footerLinks: ['الخصوصية', 'الشروط', 'الدعم'],
  },
} as const;

// ── Content arrays (bilingual) ─────────────────────────────────────────────────
const FEATURES_DATA = [
  { emoji: '📅', color: '#7C3AED', bg: '#EDE9FE',
    en: { title: 'Shared Calendar', desc: "One view for the whole family. See who's where, when — from soccer practice to doctor visits." },
    ar: { title: 'تقويم مشترك', desc: 'رؤية واحدة لكل العائلة. شاهد من أين وماذا — من تدريب كرة القدم إلى زيارة الطبيب.' } },
  { emoji: '✅', color: '#059669', bg: '#D1FAE5',
    en: { title: 'Daily Checklists', desc: 'Morning routines, homework, bedtime — visual task lists that build confident, independent kids.' },
    ar: { title: 'قوائم المهام اليومية', desc: 'روتين الصباح، الواجبات، النوم — قوائم مرئية تبني أطفالاً واثقين ومستقلين.' } },
  { emoji: '🧹', color: '#EA580C', bg: '#FED7AA',
    en: { title: 'Chore Tracking', desc: 'Assign, rotate, and track chores. Teach responsibility with accountability kids can actually see.' },
    ar: { title: 'متابعة الواجبات المنزلية', desc: 'خصص وناوب وتابع المهام. علّم المسؤولية بمساءلة يراها الأطفال فعلاً.' } },
  { emoji: '📓', color: '#DB2777', bg: '#FCE7F3',
    en: { title: 'Parent Journal', desc: 'Log observations, track mood, and reflect on your parenting journey in a private, loving space.' },
    ar: { title: 'مجلة الوالدين', desc: 'سجّل ملاحظاتك وتتبع المزاج وتأمل في رحلتك التربوية في مساحة خاصة ودافئة.' } },
  { emoji: '🔥', color: '#D97706', bg: '#FEF3C7',
    en: { title: 'Streaks & Goals', desc: 'Celebrate consistency. Kids earn streaks for completing routines — motivation that actually works.' },
    ar: { title: 'سلاسل الإنجاز والأهداف', desc: 'احتفل بالانتظام. يكسب الأطفال سلاسل عند إتمام الروتين — دافعية تعمل فعلاً.' } },
  { emoji: '📺', color: '#0369A1', bg: '#BAE6FD',
    en: { title: 'Wall Display Mode', desc: "Mount a tablet on your wall as a family dashboard. Everyone sees today's plan at a glance." },
    ar: { title: 'وضع العرض الجداري', desc: 'ثبّت جهازاً على الحائط كلوحة تحكم عائلية. يرى الجميع خطة اليوم دفعة واحدة.' } },
];

const DAY_SCENES_DATA = [
  { time: { en: 'Morning', ar: 'الصباح' }, emoji: '🌅', color: '#F59E0B', bg: 'from-[#FFFBEB] to-[#FEF3C7]', accent: '#D97706',
    en: { title: 'Start every day with a plan', desc: 'Kids wake up and check their morning checklist on the family tablet. No more "what do I do next?" — just confident, independent mornings.',
          items: ['Wake up & make bed ✓', 'Brush teeth ✓', 'Get dressed', 'Eat breakfast', 'Pack school bag'] },
    ar: { title: 'ابدأ كل يوم بخطة', desc: 'يستيقظ الأطفال ويراجعون قائمة الصباح على الجهاز العائلي. لا مزيد من "ماذا أفعل الآن؟" — فقط صباحات واثقة ومستقلة.',
          items: ['الاستيقاظ وترتيب السرير ✓', 'تنظيف الأسنان ✓', 'ارتداء الملابس', 'تناول الإفطار', 'تجهيز حقيبة المدرسة'] },
  },
  { time: { en: 'Afternoon', ar: 'الظهيرة' }, emoji: '⚽', color: '#10B981', bg: 'from-[#ECFDF5] to-[#D1FAE5]', accent: '#059669',
    en: { title: 'Never miss a pickup again', desc: "The shared calendar shows everyone's activities. Parents get a clear view of who needs to be where — no more double-bookings or forgotten practices.",
          items: ['3:00 · Soccer Practice', '4:30 · Piano Lesson', '5:30 · Homework Time', '6:30 · Family Dinner'] },
    ar: { title: 'لا تفوّت موعداً أبداً', desc: 'يعرض التقويم المشترك أنشطة الجميع. يحصل الوالدان على رؤية واضحة لمن يحتاج إلى أين — لا ازدواجية في المواعيد.',
          items: ['3:00 · تدريب كرة القدم', '4:30 · درس البيانو', '5:30 · وقت الواجبات', '6:30 · عشاء العائلة'] },
  },
  { time: { en: 'Evening', ar: 'المساء' }, emoji: '🌙', color: '#7C3AED', bg: 'from-[#F5F3FF] to-[#EDE9FE]', accent: '#7C3AED',
    en: { title: 'Wind down together', desc: 'Parents review the day, log a quick note in the parent journal, and set up tomorrow\'s schedule — all in one place, in just a few minutes.',
          items: ['Bedtime routine checklist', 'Parent daily reflection', "Tomorrow's schedule ready", '🔥 7-day streak earned!'] },
    ar: { title: 'استرخوا معاً', desc: 'يراجع الوالدان اليوم، يسجلون ملاحظة سريعة في المجلة، ويضبطون جدول الغد — كل شيء في مكان واحد في دقائق.',
          items: ['قائمة روتين النوم', 'تأمل الوالدين اليومي', 'جدول الغد جاهز', '🔥 سلسلة 7 أيام محققة!'] },
  },
];

const STATS = [
  { value: '10K+', key: 'stat1' as const, color: '#7C3AED', bg: '#EDE9FE' },
  { value: '250K+', key: 'stat2' as const, color: '#059669', bg: '#D1FAE5' },
  { value: '4.9★', key: 'stat3' as const, color: '#EA580C', bg: '#FED7AA' },
  { value: '99.9%', key: 'stat4' as const, color: '#0369A1', bg: '#BAE6FD' },
];

const PREVIEW_EVENTS = [
  { time: '8:00', title: 'School Drop-off', color: '#10B981', done: true },
  { time: '10:00', title: 'Soccer Practice', color: '#EA580C', done: true },
  { time: '12:30', title: 'Lunch & Reading', color: '#F59E0B', done: false, active: true },
  { time: '3:00', title: 'Homework Time', color: '#0369A1', done: false },
  { time: '6:30', title: 'Family Dinner', color: '#7C3AED', done: false },
];

function AppPreview() {
  return (
    <div className="relative">
      <div className="absolute inset-0 bg-[#7C3AED]/15 blur-3xl rounded-full scale-75 translate-y-8 pointer-events-none" />
      <div className="relative bg-white rounded-[2.5rem] shadow-2xl shadow-[#7C3AED]/15 p-7 w-full max-w-[340px] mx-auto border border-white/80">
        <div className="flex items-center justify-between mb-5">
          <div>
            <p className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400" style={FREDOKA}>Today</p>
            <p className="text-2xl font-bold text-gray-800 leading-none mt-0.5" style={FREDOKA}>Wednesday</p>
            <p className="text-sm font-bold text-gray-400">May 14</p>
          </div>
          <div className="flex -space-x-2">
            {['#EA580C', '#0369A1', '#10B981'].map((c, i) => (
              <div key={i} className="w-9 h-9 rounded-full border-2 border-white flex items-center justify-center text-base shadow-sm" style={{ backgroundColor: c }}>
                {['🧒', '👧', '👨'][i]}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-5">
          <div className="flex justify-between items-center mb-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">Progress</span>
            <span className="text-xs font-black text-[#7C3AED]">2 / 5 done</span>
          </div>
          <div className="h-2.5 bg-gray-100 rounded-full overflow-hidden">
            <div className="h-full rounded-full" style={{ width: '40%', background: 'linear-gradient(to right, #7C3AED, #DB2777)' }} />
          </div>
        </div>
        <div className="space-y-2">
          {PREVIEW_EVENTS.map((ev, i) => (
            <div key={i}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-2xl transition-all ${ev.done ? 'opacity-40' : ''} ${ev.active ? 'shadow-md scale-[1.02]' : ''} ${!ev.done && !ev.active ? 'bg-gray-50' : ''}`}
              style={ev.active ? { backgroundColor: `${ev.color}15`, border: `1.5px solid ${ev.color}40` } : {}}>
              <span className="text-[11px] font-black text-gray-400 w-9 shrink-0">{ev.time}</span>
              <div className="w-1 h-7 rounded-full shrink-0" style={{ backgroundColor: ev.color }} />
              <span className={`flex-1 text-sm font-bold truncate ${ev.done ? 'line-through text-gray-400' : 'text-gray-700'}`}>{ev.title}</span>
              {ev.done && <span className="text-green-500 text-sm shrink-0">✓</span>}
              {ev.active && <span className="text-sm shrink-0 animate-pulse" style={{ color: ev.color }}>▶</span>}
            </div>
          ))}
        </div>
      </div>
      <div className="absolute -bottom-6 -left-6 bg-white rounded-2xl shadow-xl p-4 w-44 border hidden lg:block">
        <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2" style={FREDOKA}>Morning Routine</p>
        {['Wake up', 'Brush teeth', 'Pack bag'].map((item, i) => (
          <div key={i} className="flex items-center gap-2 py-1">
            <div className={`w-4 h-4 rounded-md border-2 flex items-center justify-center shrink-0 text-[9px] ${i < 2 ? 'bg-[#10B981] border-[#10B981] text-white' : 'border-gray-300'}`}>
              {i < 2 && '✓'}
            </div>
            <span className={`text-xs font-bold ${i < 2 ? 'line-through text-gray-400' : ''}`}>{item}</span>
          </div>
        ))}
      </div>
      <div className="absolute -top-4 -right-4 bg-gradient-to-br from-[#F59E0B] to-[#EA580C] text-white rounded-2xl shadow-lg px-3 py-2 hidden lg:flex items-center gap-1.5">
        <span className="text-lg">🔥</span>
        <div>
          <p className="text-[10px] font-black uppercase leading-none" style={FREDOKA}>Streak</p>
          <p className="text-lg font-bold leading-none" style={FREDOKA}>7 days</p>
        </div>
      </div>
    </div>
  );
}

const TESTIMONIALS = [
  { quote: "Zadoda completely transformed our mornings. The kids actually wake up excited to check off their routines. I never thought a scheduling app could do that.", name: "Sarah M.", role: "Mom of 3 · Toronto", avatar: '👩', color: '#7C3AED', stars: 5 },
  { quote: "We've tried every family app out there. Zadoda is the first one where my husband and I are actually both using it consistently — the design just makes sense.", name: "Ahmed & Nour K.", role: "Parents of 2 · Dubai", avatar: '👨‍👩', color: '#059669', stars: 5 },
  { quote: "The parent journal is something I didn't know I needed. Having a private space to reflect on our parenting is genuinely valuable. Highly recommend.", name: "Jennifer P.", role: "Mom of 4 · London", avatar: '👩‍🦰', color: '#EA580C', stars: 5 },
];

// ── Decorative squiggle underline ──────────────────────────────────────────────
function Squiggle({ color }: { color: string }) {
  return (
    <svg className="absolute -bottom-2 left-0 w-full h-3 pointer-events-none" viewBox="0 0 200 12" preserveAspectRatio="none">
      <path d="M0,9 Q25,2 50,9 Q75,16 100,9 Q125,2 150,9 Q175,16 200,9" stroke={color} strokeWidth="3.5" fill="none" strokeLinecap="round" />
    </svg>
  );
}

// ── Main ───────────────────────────────────────────────────────────────────────
export const LandingPage = () => {
  const { setLanguage, settings } = useStore();
  const auth = useAuth();
  const router = useRouter();
  const [googleLoading, setGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState<string | null>(null);

  const lang = settings.language === 'ar' ? 'ar' : 'en';
  const lt = T[lang];
  const isRtl = lang === 'ar';

  const handleGoogle = async () => {
    setGoogleLoading(true);
    setGoogleError(null);
    try {
      await signInWithGoogle(auth);
      router.push('/setup');
    } catch (err: any) {
      console.error('Google sign-in error:', err);
      setGoogleError(err?.code || err?.message || 'Sign-in failed');
      setGoogleLoading(false);
    }
  };

  const GoogleIcon = () => (
    <svg className="w-5 h-5 shrink-0" viewBox="0 0 24 24">
      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
    </svg>
  );

  return (
    <div className="min-h-screen bg-[#FFFDF8] text-[#1E1E2E] overflow-x-hidden" style={NUNITO} dir={isRtl ? 'rtl' : 'ltr'}>

      {/* ── Nav ── */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/85 backdrop-blur-xl border-b border-[#F0E8FF]">
        <div className="max-w-7xl mx-auto px-6 h-24 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Logo — 80px, face centered */}
            <div className="w-20 h-20 rounded-full overflow-hidden shadow-xl shadow-[#7C3AED]/20 border-4 border-white flex-shrink-0 bg-[#EDE9FE]">
              {APP_LOGO ? (
                <Image
                  src={APP_LOGO}
                  alt="Zadoda Logo"
                  width={80}
                  height={80}
                  className="object-cover w-full h-full"
                  style={{ objectPosition: '50% 18%' }}
                  priority
                />
              ) : (
                <Calendar className="text-[#7C3AED] w-10 h-10 m-auto mt-5" />
              )}
            </div>
            <div className="flex flex-col leading-none">
              <span className="text-[1.7rem] font-semibold tracking-tight text-[#1E1E2E]" style={FREDOKA}>zadoda</span>
              <span className="text-[0.65rem] font-bold tracking-[0.22em] text-[#7C3AED] uppercase" style={FREDOKA}>family scheduler</span>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="ghost" className="font-bold text-sm hidden sm:flex" onClick={() => setLanguage(lang === 'en' ? 'ar' : 'en')}>
              <Globe className="w-4 h-4 mr-2" />{lang === 'en' ? 'العربية' : 'English'}
            </Button>
            <Link href="/login"><Button variant="ghost" className="font-bold" style={FREDOKA}>{lt.signIn}</Button></Link>
            <Link href="/signup">
              <Button className="font-bold rounded-full px-6 shadow-lg shadow-[#7C3AED]/25 transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: '#7C3AED', color: 'white', ...FREDOKA }}>
                {lt.getStarted}
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* ── Hero ── */}
      <section className="pt-44 pb-24 px-6 relative overflow-hidden">
        {/* Colorful background blobs */}
        <div className="absolute top-16 -left-24 w-[500px] h-[500px] bg-[#EDE9FE] rounded-full blur-3xl opacity-60 pointer-events-none" />
        <div className="absolute top-32 -right-16 w-[400px] h-[400px] bg-[#FEF3C7] rounded-full blur-3xl opacity-55 pointer-events-none" />
        <div className="absolute bottom-0 left-1/3 w-96 h-96 bg-[#D1FAE5] rounded-full blur-3xl opacity-50 pointer-events-none" />
        {/* Floating decorations */}
        <span className="absolute top-36 right-32 text-5xl rotate-12 opacity-70 hidden lg:block select-none pointer-events-none">⭐</span>
        <span className="absolute top-56 left-16 text-4xl -rotate-6 opacity-60 hidden lg:block select-none pointer-events-none">✨</span>
        <span className="absolute bottom-24 right-16 text-5xl rotate-6 opacity-60 hidden lg:block select-none pointer-events-none">🌈</span>

        <div className="max-w-7xl mx-auto grid lg:grid-cols-2 gap-16 items-center relative z-10">
          <div className="space-y-8">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold uppercase tracking-widest border"
              style={{ backgroundColor: '#EDE9FE', color: '#7C3AED', borderColor: '#C4B5FD', ...FREDOKA }}>
              <Heart className="w-4 h-4" /> {lt.heroBadge}
            </div>
            <h1 className="text-7xl lg:text-8xl font-bold leading-[0.92] text-[#1E1E2E]" style={CAVEAT}>
              {lt.heroTitle}
              <span className="relative inline-block" style={{ color: '#EA580C' }}>
                {lt.heroTitleAccent}
                <Squiggle color="#EA580C" />
              </span>
              <span style={{ color: '#7C3AED' }}>.</span>
            </h1>
            <p className="text-xl text-gray-500 max-w-lg leading-relaxed font-semibold">{lt.heroSub}</p>
            {googleError && (
              <p className="text-sm font-bold text-red-500 bg-red-50 border border-red-200 rounded-2xl px-4 py-2">
                Error: {googleError}
              </p>
            )}
            <div className="flex flex-col sm:flex-row gap-4">
              <button onClick={handleGoogle} disabled={googleLoading}
                className="flex items-center justify-center gap-3 h-14 px-7 rounded-2xl border-2 bg-white font-bold text-base transition-all shadow-sm disabled:opacity-50 hover:shadow-md"
                style={{ borderColor: '#E9D5FF', ...FREDOKA }}>
                {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
                {lt.googleBtn}
              </button>
              <Link href="/signup">
                <Button className="w-full h-14 px-8 text-white text-base font-bold rounded-2xl shadow-xl transition-all hover:scale-105 active:scale-95"
                  style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', ...FREDOKA }}>
                  {lt.createAccount} <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
            </div>
            {/* Social proof */}
            <div className="flex items-center gap-4 pt-2">
              <div className="flex -space-x-2">
                {['#EA580C','#0369A1','#10B981','#D97706','#7C3AED'].map((c, i) => (
                  <div key={i} className="w-8 h-8 rounded-full border-2 border-white text-sm flex items-center justify-center" style={{ backgroundColor: c }}>
                    {['👧','🧒','👩','👨','👶'][i]}
                  </div>
                ))}
              </div>
              <div>
                <div className="flex text-[#F59E0B] text-sm">★★★★★</div>
                <p className="text-xs font-bold text-gray-400">{lt.socialProof}</p>
              </div>
            </div>
          </div>
          <div className="flex justify-center lg:justify-end">
            <AppPreview />
          </div>
        </div>
      </section>

      {/* ── Stats ── */}
      <section className="py-14 px-6 border-y border-[#F0E8FF]" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-5xl mx-auto grid grid-cols-2 lg:grid-cols-4 gap-6">
          {STATS.map((s) => (
            <div key={s.key} className="rounded-3xl p-6 text-center space-y-1.5" style={{ backgroundColor: s.bg }}>
              <p className="text-4xl lg:text-5xl font-bold" style={{ color: s.color, ...FREDOKA }}>{s.value}</p>
              <p className="text-xs font-bold uppercase tracking-widest" style={{ color: s.color, opacity: 0.7, ...FREDOKA }}>{lt[s.key]}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Features ── */}
      <section className="py-28 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#D1FAE5] text-[#059669] rounded-full text-xs font-bold uppercase tracking-widest border border-[#A7F3D0]" style={FREDOKA}>
              <Sparkles className="w-3.5 h-3.5" /> {lt.featuresBadge}
            </div>
            <h2 className="text-5xl lg:text-6xl font-semibold" style={{ ...CAVEAT, color: '#1E1E2E' }}>{lt.featuresTitle}</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-semibold">{lt.featuresSub}</p>
          </div>
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {FEATURES_DATA.map((f) => {
              const fc = f[lang];
              return (
                <div key={fc.title}
                  className="rounded-[2.5rem] p-8 space-y-4 hover:shadow-2xl hover:-translate-y-1.5 transition-all duration-300 cursor-default border-2 border-transparent"
                  style={{ backgroundColor: f.bg }}>
                  <div className="text-5xl">{f.emoji}</div>
                  <div>
                    <h3 className="text-2xl font-semibold text-[#1E1E2E] mb-2" style={FREDOKA}>{fc.title}</h3>
                    <p className="text-sm font-semibold leading-relaxed text-gray-500">{fc.desc}</p>
                  </div>
                  <div className="pt-2">
                    <span className="text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full" style={{ backgroundColor: `${f.color}20`, color: f.color, ...FREDOKA }}>
                      {lt.featureTag}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── A day with Zadoda ── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-20 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FED7AA] text-[#EA580C] rounded-full text-xs font-bold uppercase tracking-widest border border-[#FDBA74]" style={FREDOKA}>
              <Clock className="w-3.5 h-3.5" /> {lt.scenesBadge}
            </div>
            <h2 className="text-5xl lg:text-6xl font-semibold" style={{ ...CAVEAT, color: '#1E1E2E' }}>{lt.scenesTitle}</h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto font-semibold">{lt.scenesSub}</p>
          </div>
          <div className="space-y-10">
            {DAY_SCENES_DATA.map((scene, i) => {
              const sc = scene[lang];
              return (
                <div key={i} className={`rounded-[3rem] bg-gradient-to-br ${scene.bg} p-10 lg:p-14 grid lg:grid-cols-2 gap-10 items-center border-2 border-white shadow-lg`}>
                  <div className={i % 2 === 1 ? 'lg:order-2' : ''}>
                    <div className="flex items-center gap-3 mb-6">
                      <span className="text-4xl">{scene.emoji}</span>
                      <span className="text-sm font-bold uppercase tracking-[0.2em]" style={{ color: scene.accent, ...FREDOKA }}>{scene.time[lang]}</span>
                    </div>
                    <h3 className="text-4xl lg:text-5xl font-semibold text-[#1E1E2E] mb-4 leading-tight" style={CAVEAT}>{sc.title}</h3>
                    <p className="text-base font-semibold text-gray-500 leading-relaxed max-w-md">{sc.desc}</p>
                  </div>
                  <div className={i % 2 === 1 ? 'lg:order-1' : ''}>
                    <div className="bg-white/80 backdrop-blur-sm rounded-[2rem] p-6 space-y-3 shadow-xl shadow-black/5 border border-white">
                      {sc.items.map((item, j) => (
                        <div key={j} className="flex items-center gap-3 p-3 rounded-xl bg-white/90">
                          <div className="w-6 h-6 rounded-lg flex items-center justify-center shrink-0" style={{ backgroundColor: `${scene.accent}25` }}>
                            <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: scene.accent }} />
                          </div>
                          <span className="text-sm font-bold text-[#1E1E2E]">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* ── How it works ── */}
      <section className="py-28 px-6">
        <div className="max-w-5xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#EDE9FE] text-[#7C3AED] rounded-full text-xs font-bold uppercase tracking-widest border border-[#C4B5FD]" style={FREDOKA}>
              <Zap className="w-3.5 h-3.5" /> {lt.howBadge}
            </div>
            <h2 className="text-5xl lg:text-6xl font-semibold" style={{ ...CAVEAT, color: '#1E1E2E' }}>{lt.howTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-8 relative">
            <div className="hidden md:block absolute top-12 left-[20%] right-[20%] h-0.5 opacity-30"
              style={{ background: 'linear-gradient(to right, #7C3AED, #10B981, #EA580C)' }} />
            {[
              { num: '01', color: '#7C3AED', bg: '#EDE9FE', emoji: '👨‍👩‍👧‍👦', title: lt.howStep1Title, desc: lt.howStep1Desc },
              { num: '02', color: '#059669', bg: '#D1FAE5', emoji: '📅', title: lt.howStep2Title, desc: lt.howStep2Desc },
              { num: '03', color: '#EA580C', bg: '#FED7AA', emoji: '🎉', title: lt.howStep3Title, desc: lt.howStep3Desc },
            ].map((step) => (
              <div key={step.num} className="flex flex-col items-center text-center space-y-5">
                <div className="w-28 h-28 rounded-full flex flex-col items-center justify-center relative z-10 shadow-xl gap-1"
                  style={{ backgroundColor: step.bg, border: `3px solid ${step.color}40` }}>
                  <span className="text-4xl">{step.emoji}</span>
                  <span className="text-xs font-black" style={{ color: step.color, ...FREDOKA }}>{step.num}</span>
                </div>
                <div>
                  <h3 className="text-2xl font-semibold text-[#1E1E2E] mb-2" style={FREDOKA}>{step.title}</h3>
                  <p className="text-sm font-semibold text-gray-500 leading-relaxed max-w-xs mx-auto">{step.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Testimonials ── */}
      <section className="py-28 px-6" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-16 space-y-3">
            <div className="inline-flex items-center gap-2 px-4 py-2 bg-[#FCE7F3] text-[#DB2777] rounded-full text-xs font-bold uppercase tracking-widest border border-[#FBCFE8]" style={FREDOKA}>
              <Smile className="w-3.5 h-3.5" /> {lt.testiBadge}
            </div>
            <h2 className="text-5xl lg:text-6xl font-semibold" style={{ ...CAVEAT, color: '#1E1E2E' }}>{lt.testiTitle}</h2>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {TESTIMONIALS.map((t) => (
              <div key={t.name} className="bg-white rounded-[2.5rem] border-2 p-8 space-y-5 hover:shadow-xl hover:-translate-y-1 transition-all duration-300 relative overflow-hidden"
                style={{ borderColor: `${t.color}30` }}>
                {/* Colorful top stripe */}
                <div className="absolute top-0 left-0 right-0 h-2 rounded-t-[2rem]" style={{ backgroundColor: t.color }} />
                <div className="pt-2 flex text-[#F59E0B] text-lg">{'★'.repeat(t.stars)}</div>
                <p className="text-base font-semibold text-gray-600 leading-relaxed">"{t.quote}"</p>
                <div className="flex items-center gap-3 pt-2">
                  <div className="w-12 h-12 rounded-full flex items-center justify-center text-xl shadow-inner" style={{ backgroundColor: `${t.color}18` }}>
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-bold text-sm text-[#1E1E2E]" style={FREDOKA}>{t.name}</p>
                    <p className="text-xs font-semibold text-gray-400">{t.role}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── Security ── */}
      <section className="py-20 px-6">
        <div className="max-w-5xl mx-auto rounded-[4rem] p-12 lg:p-20 text-white relative overflow-hidden shadow-2xl"
          style={{ background: 'linear-gradient(135deg, #7C3AED 0%, #4F46E5 50%, #0369A1 100%)' }}>
          <div className="absolute top-0 right-0 w-80 h-80 bg-white/8 rounded-full translate-x-1/3 -translate-y-1/3" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-black/10 rounded-full -translate-x-1/3 translate-y-1/3" />
          <span className="absolute top-12 right-24 text-5xl opacity-30 hidden lg:block pointer-events-none">🔒</span>
          <div className="relative z-10 grid lg:grid-cols-2 gap-12 items-center">
            <div className="space-y-5">
              <div className="w-14 h-14 bg-white/20 rounded-2xl flex items-center justify-center">
                <Shield className="w-7 h-7" />
              </div>
              <h2 className="text-4xl lg:text-5xl font-semibold leading-tight" style={CAVEAT}>{lt.secTitle}</h2>
              <p className="text-white/75 text-base font-semibold leading-relaxed">{lt.secSub}</p>
            </div>
            <div className="bg-white/12 backdrop-blur-md p-8 rounded-3xl border border-white/20">
              <ul className="space-y-3">
                {lt.secItems.map((item, i) => (
                  <li key={i} className="flex items-center gap-3 font-bold" style={FREDOKA}>
                    <CheckCircle2 className="w-5 h-5 text-[#6EE7B7] shrink-0" /> {item}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── Final CTA ── */}
      <section className="py-28 px-6 relative overflow-hidden">
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#EDE9FE] rounded-full blur-3xl opacity-50" />
          <div className="absolute bottom-0 right-1/4 w-80 h-80 bg-[#FEF3C7] rounded-full blur-3xl opacity-50" />
        </div>
        <div className="max-w-3xl mx-auto text-center space-y-8 relative z-10">
          <p className="text-7xl">🏡</p>
          <h2 className="text-5xl lg:text-7xl font-bold tracking-tight text-[#1E1E2E] leading-tight" style={CAVEAT}>{lt.ctaTitle}</h2>
          <p className="text-xl font-semibold text-gray-400 max-w-xl mx-auto">{lt.ctaSub}</p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center pt-4">
            <button onClick={handleGoogle} disabled={googleLoading}
              className="flex items-center justify-center gap-3 h-16 px-10 rounded-3xl border-2 bg-white font-bold text-lg transition-all shadow-sm disabled:opacity-50 hover:shadow-md"
              style={{ borderColor: '#E9D5FF', ...FREDOKA }}>
              {googleLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <GoogleIcon />}
              {lt.googleBtn}
            </button>
            <Link href="/signup">
              <Button className="h-16 px-10 rounded-3xl text-white text-lg font-bold shadow-2xl transition-all hover:scale-105 active:scale-95"
                style={{ background: 'linear-gradient(135deg, #7C3AED, #DB2777)', ...FREDOKA }}>
                {lt.createAccount} <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
          <p className="text-xs font-bold text-gray-400 uppercase tracking-widest" style={FREDOKA}>{lt.ctaNote}</p>
        </div>
      </section>

      {/* ── Footer ── */}
      <footer className="py-14 border-t border-[#F0E8FF] px-6" style={{ backgroundColor: '#FAFAF8' }}>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full overflow-hidden flex-shrink-0 shadow-md bg-[#EDE9FE]">
              {APP_LOGO ? (
                <Image src={APP_LOGO} alt="Zadoda Logo" width={40} height={40}
                  className="object-cover w-full h-full"
                  style={{ objectPosition: '50% 18%' }} />
              ) : (
                <Calendar className="text-[#7C3AED] w-5 h-5 m-auto mt-2.5" />
              )}
            </div>
            <span className="text-xl font-semibold tracking-tight" style={{ ...FREDOKA, color: '#1E1E2E' }}>zadoda</span>
          </div>
          <p className="text-gray-400 font-semibold text-sm">{lt.footerCopy}</p>
          <div className="flex gap-8">
            {lt.footerLinks.map(l => (
              <Link key={l} href="#" className="text-gray-400 font-bold uppercase text-xs tracking-widest transition-colors hover:text-[#7C3AED]" style={FREDOKA}>{l}</Link>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
};
