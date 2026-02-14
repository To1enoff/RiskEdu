import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';
import { Card } from '../ui/Card';

export const Hero = () => (
  <section className="hero-bg relative overflow-hidden rounded-[28px] px-8 py-16 text-white md:px-14">
    <div className="absolute -left-12 top-1/3 h-56 w-56 rounded-full bg-blue-400/20 blur-3xl" />
    <div className="absolute -right-10 bottom-0 h-64 w-64 rounded-full bg-indigo-400/20 blur-3xl" />

    <div className="relative grid gap-10 lg:grid-cols-2 lg:items-center">
      <div className="space-y-6 animate-in">
        <p className="inline-flex rounded-full border border-white/30 bg-white/10 px-4 py-1 text-xs uppercase tracking-[0.2em]">
          RiskEdu Intelligence
        </p>
        <h1 className="text-4xl font-bold leading-tight md:text-5xl">
          Predict student risk early.
          <br />
          <span className="text-blue-200">Act with explainable confidence.</span>
        </h1>
        <p className="max-w-xl text-base leading-7 text-blue-100">
          Premium risk intelligence for advisors, instructors, and admins with transparent factors and
          what-if simulation.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link to="/dashboard">
            <Button className="bg-white text-slate-900 hover:bg-slate-100">Open Dashboard</Button>
          </Link>
          <Link to="/login">
            <Button variant="glass" className="text-white">
              Sign In
            </Button>
          </Link>
        </div>
      </div>

      <Card variant="glass" className="animate-float p-6">
        <div className="space-y-4">
          <p className="text-sm text-blue-100">Live Risk Overview</p>
          <div className="rounded-2xl bg-white/85 p-4 text-slate-900">
            <p className="text-xs text-slate-500">Top 10% Risk Alerts</p>
            <p className="mt-1 text-3xl font-bold text-red-600">32 Students</p>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="rounded-2xl bg-red-100/90 p-3 text-center text-xs font-semibold text-red-700">
              High
            </div>
            <div className="rounded-2xl bg-amber-100/90 p-3 text-center text-xs font-semibold text-amber-700">
              Medium
            </div>
            <div className="rounded-2xl bg-emerald-100/90 p-3 text-center text-xs font-semibold text-emerald-700">
              Low
            </div>
          </div>
        </div>
      </Card>
    </div>
  </section>
);
