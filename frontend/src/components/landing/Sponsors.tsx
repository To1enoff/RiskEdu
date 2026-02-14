const sponsors = ['EduFutures', 'UniConnect', 'CampusMind', 'BlueMetric Labs', 'Student Success UK'];

export const Sponsors = () => (
  <section className="rounded-[28px] border border-slate-200 bg-white px-8 py-10 shadow-soft md:px-12">
    <p className="text-center text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">
      Trusted by progressive institutions
    </p>
    <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-5">
      {sponsors.map((name) => (
        <div
          key={name}
          className="rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-center text-sm font-medium text-slate-700"
        >
          {name}
        </div>
      ))}
    </div>
  </section>
);
