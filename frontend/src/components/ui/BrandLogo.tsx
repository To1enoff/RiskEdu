import { Link } from 'react-router-dom';
import { useState } from 'react';

export const BrandLogo = ({ to = '/' }: { to?: string }) => {
  const [broken, setBroken] = useState(false);

  return (
    <Link to={to} className="inline-flex items-center">
      {!broken ? (
        <img
          src="/logo.png"
          alt="RiskEdu"
          className="h-10 w-auto max-w-[220px] object-contain md:h-12"
          onError={() => setBroken(true)}
        />
      ) : (
        <span className="text-xl font-bold text-slate-900">RiskEdu</span>
      )}
    </Link>
  );
};

