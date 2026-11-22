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
  ['ML smart routing', 'Automatically selects the best available payment route.'],
  ['Built for India', 'Cards, UPI and netbanking in one cohesive checkout.'],
  ['Always in control', 'Risk signals and operations insights without the noise.'],
];

export const LandingPage: React.FC = () => (
  <main className="landing-shell min-h-screen overflow-hidden bg-[#08111f] text-white selection:bg-cyan-300 selection:text-slate-950">
    <div className="landing-orb landing-orb-one" />
    <div className="landing-orb landing-orb-two" />
    <div className="landing-grid absolute inset-0 opacity-40" />

    <nav className="relative z-10 mx-auto flex max-w-7xl items-center justify-between px-6 py-6 lg:px-8">
      <Link to="/" className="flex items-center gap-3" aria-label="Mantu home">
        <span className="grid h-10 w-10 place-items-center rounded-xl bg-gradient-to-br from-cyan-300 to-blue-500 text-lg font-black text-slate-950 shadow-[0_0_30px_rgba(34,211,238,.35)]">M</span>
        <span className="text-lg font-bold tracking-[-0.04em]">mantu<span className="text-cyan-300">.</span></span>
      </Link>
      <div className="hidden items-center gap-8 text-sm text-slate-300 md:flex">
        <a href="#platform" className="transition hover:text-white">Platform</a>
        <a href="#security" className="transition hover:text-white">Security</a>
        <a href="#developers" className="transition hover:text-white">Developers</a>
      </div>
      <div className="flex items-center gap-3">
        <Link to="/login" className="hidden text-sm font-medium text-slate-200 transition hover:text-cyan-200 sm:block">Sign in</Link>
        <Link to="/signup" className="rounded-lg bg-white px-4 py-2.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-100 hover:shadow-[0_0_28px_rgba(255,255,255,.25)]">Start building</Link>
      </div>
    </nav>

    <section className="relative z-10 mx-auto grid max-w-7xl items-center gap-14 px-6 pb-24 pt-14 lg:grid-cols-[1.02fr_.98fr] lg:px-8 lg:pb-32 lg:pt-24">
      <div className="landing-rise">
        <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-300/20 bg-cyan-300/10 px-3 py-1.5 text-xs font-semibold text-cyan-100">
          <Sparkles className="h-3.5 w-3.5" />
          Payments that move at the speed of trust
        </div>
        <h1 className="max-w-3xl text-5xl font-semibold leading-[.96] tracking-[-.065em] text-white sm:text-6xl lg:text-7xl">
          Payments, tuned for every <span className="text-gradient">next move.</span>
        </h1>
        <p className="mt-7 max-w-xl text-base leading-7 text-slate-300 sm:text-lg">
          Mantu gives ambitious businesses one intelligent surface for accepting payments, detecting risk, and seeing what matters next.
        </p>
        <div className="mt-9 flex flex-col gap-3 sm:flex-row">
          <Link to="/signup" className="group inline-flex items-center justify-center gap-2 rounded-lg bg-cyan-300 px-5 py-3.5 text-sm font-bold text-slate-950 transition hover:bg-cyan-200 hover:shadow-[0_0_32px_rgba(103,232,249,.35)]">
            Create your account <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-1" />
          </Link>
          <a href="#platform" className="inline-flex items-center justify-center gap-2 rounded-lg border border-white/15 bg-white/[.035] px-5 py-3.5 text-sm font-semibold text-white transition hover:border-white/30 hover:bg-white/[.08]">
            Explore the platform <ChevronRight className="h-4 w-4" />
          </a>
        </div>
        <div className="mt-10 flex flex-wrap gap-x-6 gap-y-3 text-xs text-slate-400">
          {['No setup fees', 'KYC-first security', 'India-ready payments'].map((item) => <span key={item} className="flex items-center gap-1.5"><Check className="h-3.5 w-3.5 text-cyan-300" />{item}</span>)}
        </div>
      </div>

      <div className="landing-rise landing-delay relative mx-auto w-full max-w-xl">
        <div className="absolute -inset-12 rounded-full bg-cyan-400/10 blur-3xl" />
        <div className="relative overflow-hidden rounded-2xl border border-white/15 bg-[#0d1a2b]/85 p-4 shadow-2xl shadow-black/40 backdrop-blur-xl">
          <div className="mb-5 flex items-center justify-between border-b border-white/10 px-2 pb-4">
            <div className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full bg-cyan-300" /><span className="text-xs font-semibold text-slate-200">Payment intelligence</span></div>
            <span className="rounded-full bg-emerald-400/10 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-emerald-300">Live</span>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-white/10 bg-white/[.045] p-5 sm:col-span-2">
              <div className="flex items-end justify-between"><div><p className="text-xs text-slate-400">Payment success rate</p><p className="mt-2 text-4xl font-semibold tracking-tight">98.7<span className="text-xl text-cyan-300">%</span></p></div><div className="sparkline"><i /><i /><i /><i /><i /><i /><i /></div></div>
              <div className="mt-5 h-px bg-gradient-to-r from-cyan-300/50 via-blue-400/20 to-transparent" />
            </div>
            <div className="rounded-xl border border-white/10 bg-white/[.045] p-4"><ShieldCheck className="h-5 w-5 text-violet-300" /><p className="mt-5 text-xs text-slate-400">Risk screening</p><p className="mt-1 text-lg font-semibold">Always on</p></div>
            <div className="rounded-xl border border-white/10 bg-white/[.045] p-4"><Zap className="h-5 w-5 text-amber-300" /><p className="mt-5 text-xs text-slate-400">Route decision</p><p className="mt-1 text-lg font-semibold">18.4 ms</p></div>
          </div>
        </div>
        <div className="landing-float absolute -bottom-7 -left-5 flex items-center gap-3 rounded-xl border border-white/15 bg-[#12233a]/95 px-4 py-3 shadow-xl backdrop-blur-xl"><span className="grid h-9 w-9 place-items-center rounded-lg bg-emerald-400/15"><BadgeCheck className="h-5 w-5 text-emerald-300" /></span><div><p className="text-xs font-semibold">Payment captured</p><p className="text-[11px] text-slate-400">Smart route selected instantly</p></div></div>
      </div>
    </section>

    <section id="platform" className="relative z-10 border-y border-white/10 bg-white/[.025]">
      <div className="mx-auto grid max-w-7xl gap-5 px-6 py-16 md:grid-cols-3 lg:px-8">
        {signals.map(([title, description], index) => {
          const Icon = [CreditCard, BarChart3, LockKeyhole][index];
          return <article key={title} className="group rounded-xl border border-white/10 bg-[#0d1a2b]/50 p-6 transition duration-300 hover:-translate-y-1 hover:border-cyan-200/30 hover:bg-[#102139]"><Icon className="h-5 w-5 text-cyan-300" /><h2 className="mt-6 text-lg font-semibold tracking-tight">{title}</h2><p className="mt-2 text-sm leading-6 text-slate-400">{description}</p></article>;
        })}
      </div>
    </section>

    <section id="security" className="relative z-10 mx-auto max-w-7xl px-6 py-20 lg:px-8" aria-label="Security">
      <div className="rounded-2xl border border-white/10 bg-gradient-to-br from-[#11223b] to-[#0a1424] px-7 py-10 sm:px-10 sm:py-14"><p className="text-sm font-semibold text-cyan-300">Designed for confidence</p><div className="mt-4 flex flex-col justify-between gap-8 md:flex-row md:items-end"><h2 className="max-w-2xl text-3xl font-semibold leading-tight tracking-[-.04em] sm:text-4xl">Complex payment infrastructure, made calm and clear.</h2><Link to="/signup" className="inline-flex shrink-0 items-center gap-2 text-sm font-bold text-white transition hover:text-cyan-200">Open your merchant account <ArrowRight className="h-4 w-4" /></Link></div></div>
    </section>
  </main>
);
