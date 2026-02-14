import { Card } from '../ui/Card';

const features = [
  {
    title: 'Explainable AI',
    description: 'Top factors behind each student score to make interventions transparent.',
  },
  {
    title: 'What-if Simulator',
    description: 'Change attendance, logins, or hours and instantly see risk delta.',
  },
  {
    title: 'Role-aware Workflow',
    description: 'Advisor, instructor, and admin views aligned to real responsibilities.',
  },
];

export const FeatureGrid = () => (
  <section className="section-soft rounded-[28px] px-8 py-12 md:px-12">
    <div className="mb-8 space-y-3 animate-in">
      <h2 className="text-3xl font-bold text-slate-900">Features Built for Academic Outcomes</h2>
      <p className="max-w-2xl text-slate-600">
        RiskEdu blends predictive modeling and UX clarity so teams move from reactive reporting to
        proactive support.
      </p>
    </div>
    <div className="grid gap-4 md:grid-cols-3">
      {features.map((feature) => (
        <Card key={feature.title} className="p-6 transition-all duration-300 hover:scale-[1.02]">
          <h3 className="text-lg font-semibold text-slate-900">{feature.title}</h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">{feature.description}</p>
        </Card>
      ))}
    </div>
  </section>
);
