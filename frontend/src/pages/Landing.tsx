import { CTA } from '../components/landing/CTA';
import { FeatureGrid } from '../components/landing/FeatureGrid';
import { Hero } from '../components/landing/Hero';
import { Sponsors } from '../components/landing/Sponsors';
import { Card } from '../components/ui/Card';

export const Landing = () => (
  <div className="space-y-8">
    <Hero />
    <FeatureGrid />

    <section className="grid gap-4 md:grid-cols-3">
      {[
        ['1. Upload Data', 'Ingest train/validate datasets and map raw columns automatically.'],
        ['2. Predict Risk', 'Generate fail probability with explainability and risk buckets.'],
        ['3. Simulate Action', 'Use what-if controls to plan targeted interventions.'],
      ].map(([title, description]) => (
        <Card key={title} className="p-6 transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold">{title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{description}</p>
        </Card>
      ))}
    </section>

    <Sponsors />
    <CTA />
  </div>
);
