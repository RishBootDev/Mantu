import React from 'react';
import { Link } from 'react-router-dom';
import {
  ArrowRight,
  BadgeCheck,
  BarChart3,
  Check,
  ChevronRight,
  CreditCard,
  LockKeyhole,
  ShieldCheck,
  Sparkles,
  Zap,
} from 'lucide-react';

const signals = [
  ['ML smart routing', 'Automatically selects the best available payment route with sub-20ms latency.'],
  ['Built for India', 'Seamless Card Vault tokenization, instant UPI switches, and NetBanking in one unified flow.'],
  ['Always in control', 'Intelligent fraud scoring and real-time transaction screening without false declines.'],
];

export const LandingPage: React.FC = () => (
  <main className="landing-shell relative min-h-screen overflow-hidden text-white selection:bg-cyan-300 selection:text-slate-950">
    {/* Full Animated Video Background */}
    <video
      autoPlay
      loop
      muted
      playsInline
      className="fixed inset-0 h-full w-full object-cover -z-20 pointer-events-none"
    >
      <source src="/landing-bg.mp4" type="video/mp4" />
      <source src="/landing%20page/motionsites-background-a70144cf.mp4" type="video/mp4" />
    </video>

    {/* Ambient Dark Overlay to Guarantee Crisp Contrast & Legibility */}
    <div className="fixed inset-0 bg-slate-950/55 -z-10 pointer-events-none" />
    <div className="landing-grid fixed inset-0 opacity-25 -z-10 pointer-events-none" />

    {/* Navigation */}
    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link to="/" className="flex items-center gap-3" aria-label="Mantu home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-lg font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,.45)]">
          M
        </span>
        <span className="text-xl font-bold tracking-tight text-white">
          mantu<span className="text-cyan-300">.</span>
        </span>
      </Link>
      <div className="hidden items-center gap-8 text-sm font-medium text-slate-200 md:flex">
        <a href="#platform" className="transition hover:text-cyan-300">Platform</a>
        <a href="#security" className="transition hover:text-cyan-300">Security</a>
        <a href="#developers" className="transition hover:text-cyan-300">Developers</a>
      </div>
      <div className="flex items-center gap-4">
        <Link to="/login" className="hidden text-sm font-semibold text-slate-100 transition hover:text-cyan-300 sm:block">
          Sign in
        </Link>
        <Link
          to="/signup"
          className="rounded-lg bg-cyan-300 px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_0_24px_rgba(103,232,249,.5)]"
        >
          Start building
        </Link>
      </div>
    </nav>

    {/* Hero Section */}
    <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-12 lg:grid-cols-[1.05fr_.95fr] lg:px-8 lg:pb-32 lg:pt-20">
      <div className="landing-rise">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-cyan-300/40 bg-cyan-400/15 px-3.5 py-1.5 text-xs font-semibold text-cyan-200 backdrop-blur-md shadow-sm">
          <Sparkles className="h-3.5 w-3.5 text-cyan-300" />
          Payments that move at the speed of trust
        </div>
        <h1 className="max-w-3xl text-5xl font-bold leading-[1.02] tracking-tight text-white sm:text-6xl lg:text-7xl">
          Payments, tuned for every <span className="text-gradient">next move.</span>
        </h1>
        <p className="mt-6 max-w-xl text-base leading-relaxed text-slate-100 sm:text-lg">
          Mantu gives ambitious businesses one intelligent, ultra-fast platform for accepting payments, routing transactions, and screening risk in real time.
        </p>
        <div className="mt-8 flex flex-col gap-3.5 sm:flex-row">
          <Link
            to="/signup"
            className="group inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-6 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_0_32px_rgba(103,232,249,.5)]"
          >
            Create your account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a
            href="#platform"
            className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/25 bg-white/10 px-6 py-3.5 text-sm font-semibold text-white backdrop-blur-md transition hover:border-white/40 hover:bg-white/20"
          >
            Explore the platform <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-9 flex flex-wrap gap-x-6 gap-y-3 text-xs font-medium text-slate-200">
          {['No setup fees', 'KYC-first security', 'India-ready payments'].map((item) => (
            <span key={item} className="flex items-center gap-1.5">
              <Check className="h-4 w-4 text-cyan-300" />
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Hero Visual Card */}
      <div className="landing-rise landing-delay relative mx-auto w-full max-w-xl">
        <div className="absolute -inset-10 rounded-full bg-cyan-400/15 blur-3xl pointer-events-none" />
        <div className="relative overflow-hidden rounded-2xl border border-white/20 bg-slate-950/70 p-5 shadow-2xl shadow-black/60 backdrop-blur-2xl">
          <div className="mb-5 flex items-center justify-between border-b border-white/15 px-2 pb-4">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-full bg-cyan-300 shadow-[0_0_8px_#67e8f9]" />
              <span className="text-xs font-semibold text-white tracking-wide">Payment intelligence</span>
            </div>
            <span className="rounded-full border border-emerald-400/40 bg-emerald-400/20 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">
              Live
            </span>
          </div>

          <div className="grid gap-3.5 sm:grid-cols-2">
            <div className="rounded-xl border border-white/15 bg-white/[.07] p-5 sm:col-span-2 backdrop-blur-sm">
              <div className="flex items-end justify-between">
                <div>
                  <p className="text-xs font-medium text-slate-200">Payment success rate</p>
                  <p className="mt-1.5 text-4xl font-bold tracking-tight text-white">
                    98.7<span className="text-2xl text-cyan-300">%</span>
                  </p>
                </div>
                <div className="sparkline">
                  <i /><i /><i /><i /><i /><i /><i />
                </div>
              </div>
              <div className="mt-5 h-px bg-gradient-to-r from-cyan-300/60 via-blue-400/30 to-transparent" />
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-sm">
              <ShieldCheck className="h-5 w-5 text-violet-300" />
              <p className="mt-4 text-xs font-medium text-slate-200">Risk screening</p>
              <p className="mt-0.5 text-lg font-bold text-white">Always on</p>
            </div>

            <div className="rounded-xl border border-white/15 bg-white/[.07] p-4 backdrop-blur-sm">
              <Zap className="h-5 w-5 text-amber-300" />
              <p className="mt-4 text-xs font-medium text-slate-200">Route decision</p>
              <p className="mt-0.5 text-lg font-bold text-white">18.4 ms</p>
            </div>
          </div>
        </div>

        {/* Floating Success Pill */}
        <div className="landing-float absolute -bottom-6 -left-4 flex items-center gap-3 rounded-xl border border-white/25 bg-slate-950/85 px-4 py-3 shadow-2xl backdrop-blur-xl">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/25 border border-emerald-400/30">
            <BadgeCheck className="h-5 w-5 text-emerald-300" />
          </span>
          <div>
            <p className="text-xs font-bold text-white">Payment captured</p>
            <p className="text-[11px] font-medium text-slate-200">Smart route selected instantly</p>
          </div>
        </div>
      </div>
    </section>

    {/* Platform Features Section */}
    <section id="platform" className="relative z-10 border-y border-white/15 bg-slate-950/45 backdrop-blur-lg">
      <div className="mx-auto grid max-w-7xl gap-6 px-6 py-20 md:grid-cols-3 lg:px-8">
        {signals.map(([title, description], index) => {
          const Icon = [CreditCard, BarChart3, LockKeyhole][index];
          return (
            <article
              key={title}
              className="group rounded-xl border border-white/15 bg-slate-950/65 p-6 backdrop-blur-md transition duration-300 hover:-translate-y-1 hover:border-cyan-300/40 hover:bg-slate-900/80 shadow-lg"
            >
              <div className="grid h-11 w-11 place-items-center rounded-lg bg-cyan-300/15 border border-cyan-300/30">
                <Icon className="h-5 w-5 text-cyan-300" />
              </div>
              <h2 className="mt-5 text-lg font-bold tracking-tight text-white">{title}</h2>
              <p className="mt-2 text-sm leading-relaxed text-slate-200">{description}</p>
            </article>
          );
        })}
      </div>
    </section>

    {/* Security Section */}
    <section id="security" className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8" aria-label="Security">
      <div className="rounded-2xl border border-white/20 bg-gradient-to-br from-slate-900/85 via-slate-950/90 to-black/90 p-8 sm:p-12 backdrop-blur-xl shadow-2xl">
        <p className="text-xs font-bold uppercase tracking-wider text-cyan-300">
          Designed for confidence
        </p>
        <div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end">
          <h2 className="max-w-2xl text-3xl font-bold leading-tight tracking-tight text-white sm:text-4xl">
            Complex payment infrastructure, made calm and clear.
          </h2>
          <Link
            to="/signup"
            className="inline-flex shrink-0 items-center gap-2 rounded-lg bg-white px-5 py-3 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 hover:shadow-[0_0_24px_rgba(255,255,255,.4)]"
          >
            Open your merchant account <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </div>
    </section>
  </main>
);
