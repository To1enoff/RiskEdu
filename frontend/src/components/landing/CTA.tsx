import { Link } from 'react-router-dom';
import { Button } from '../ui/Button';

export const CTA = () => (
  <section className="hero-bg rounded-[28px] px-8 py-12 text-white md:px-12">
    <div className="flex flex-col items-start justify-between gap-6 md:flex-row md:items-center">
      <div>
        <h3 className="text-3xl font-bold">Start reducing student risk this week</h3>
        <p className="mt-2 max-w-2xl text-blue-100">
          Launch advisor workflows, simulation-driven interventions, and department analytics from one
          platform.
        </p>
      </div>
      <Link to="/login">
        <Button className="bg-white text-slate-900 hover:bg-slate-100">Get Started</Button>
      </Link>
    </div>
  </section>
);
