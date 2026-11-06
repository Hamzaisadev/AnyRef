import React from 'react';

export interface SectionShellProps {
  id?: string;
  eyebrow?: string;
  h2: React.ReactNode;
  intro?: React.ReactNode;
  theme?: 'ink' | 'paper';
  align?: 'left' | 'center';
  className?: string;
  containerClassName?: string;
  headerClassName?: string;
  children: React.ReactNode;
}

export function SectionShell({
  id,
  eyebrow,
  h2,
  intro,
  theme = 'ink',
  align = 'left',
  className = '',
  containerClassName = '',
  headerClassName = '',
  children,
}: SectionShellProps) {
  const isPaper = theme === 'paper';

  return (
    <section
      id={id}
      data-theme={theme}
      className={`relative w-full py-20 sm:py-28 md:py-36 px-4 sm:px-6 md:px-12 transition-colors duration-300 scroll-mt-20 ${
        isPaper ? 'bg-[#F7F6F2] text-[#0F1020]' : 'bg-[#0F1020] text-[#F7F6F2]'
      } ${className}`}
    >
      <div className={`max-w-7xl mx-auto w-full ${containerClassName}`}>
        {(eyebrow || h2 || intro) && (
          <div
            className={`mb-12 sm:mb-16 md:mb-20 ${
              align === 'center' ? 'text-center mx-auto max-w-3xl' : 'max-w-3xl text-left'
            } ${headerClassName}`}
          >
            {eyebrow && (
              <div
                className={`inline-flex items-center space-x-2 px-3 py-1 mb-4 rounded-full text-xs font-mono font-semibold uppercase tracking-widest ${
                  isPaper
                    ? 'bg-[#4B2BFF]/10 text-[#4B2BFF] border border-[#4B2BFF]/20'
                    : 'bg-[#FF8A3D]/10 text-[#FF8A3D] border border-[#FF8A3D]/20'
                }`}
              >
                <span>{eyebrow}</span>
              </div>
            )}

            <h2
              className={`font-tight font-extrabold tracking-[-0.03em] leading-[1.08] text-[clamp(2.25rem,4.5vw,4.25rem)] ${
                isPaper ? 'text-[#0F1020]' : 'text-white'
              }`}
            >
              {h2}
            </h2>

            {intro && (
              <p
                className={`mt-5 sm:mt-6 text-base sm:text-lg md:text-xl font-sans leading-relaxed ${
                  isPaper ? 'text-[#4A4E5C]' : 'text-[#9AA0AE]'
                }`}
              >
                {intro}
              </p>
            )}
          </div>
        )}

        {children}
      </div>
    </section>
  );
}
