import { NavLink } from 'react-router-dom';

export const CourseNav = ({ courseId }: { courseId: string }) => {
  const tabs = [
    { to: `/student/courses/${courseId}/syllabus`, label: 'Syllabus' },
    { to: `/student/courses/${courseId}/weeks`, label: 'Weeks' },
    { to: `/student/courses/${courseId}/exams`, label: 'Exams' },
    { to: `/student/courses/${courseId}/risk`, label: 'Risk' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {tabs.map((tab) => (
        <NavLink
          key={tab.to}
          to={tab.to}
          className={({ isActive }) =>
            `rounded-2xl px-4 py-2 text-sm font-semibold transition-all duration-200 ${
              isActive
                ? 'btn-accent text-white shadow-soft'
                : 'border border-slate-200 bg-white text-slate-600 hover:border-slate-300'
            }`
          }
        >
          {tab.label}
        </NavLink>
      ))}
    </div>
  );
};
