import React from 'react';

interface BrandLogoProps {
  className?: string;
  showText?: boolean;
  light?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const BrandLogo: React.FC<BrandLogoProps> = ({
  className = '',
  showText = true,
  light = true,
  size = 'md',
}) => {
  const iconSizes = {
    sm: 'w-7 h-7',
    md: 'w-9 h-9',
    lg: 'w-11 h-11',
  };

  return (
    <div className={`flex items-center gap-2.5 ${className}`}>
      {/* Kerala Incinerator Logo Icon: Geometric flame & clean air prism */}
      <div
        className={`${iconSizes[size]} shrink-0 rounded-xl bg-gradient-to-tr from-[#2563EB] to-[#38BDF8] p-1.5 flex items-center justify-center shadow-sm shadow-blue-500/20`}
      >
        <svg
          viewBox="0 0 24 24"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="w-full h-full text-white"
        >
          {/* Stylized incinerator / flame vortex icon */}
          <path
            d="M12 2L15 7H9L12 2Z"
            fill="currentColor"
            fillOpacity="0.9"
          />
          <path
            d="M7 8L12 4L17 8L15 15L12 18L9 15L7 8Z"
            fill="currentColor"
          />
          <path
            d="M12 9L14 13H10L12 9Z"
            fill="#0F172A"
            fillOpacity="0.4"
          />
          <path
            d="M4 19C7 21 17 21 20 19C18 22 6 22 4 19Z"
            fill="currentColor"
            fillOpacity="0.8"
          />
        </svg>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span
            className={`font-extrabold tracking-tight leading-tight ${
              light ? 'text-white' : 'text-[#0F172A]'
            } ${size === 'sm' ? 'text-sm' : size === 'lg' ? 'text-lg' : 'text-base'}`}
          >
            Kerala Incinerator
          </span>
          <span
            className={`text-[10px] tracking-wide leading-none mt-0.5 ${
              light ? 'text-slate-400' : 'text-slate-500'
            }`}
          >
            Clean Environment, Better Tomorrow.
          </span>
        </div>
      )}
    </div>
  );
};

