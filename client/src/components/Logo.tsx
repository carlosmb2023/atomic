import { Link } from "wouter";

interface LogoProps {
  size?: 'small' | 'medium' | 'large';
  animate?: boolean;
  className?: string;
}

export default function Logo({ size = 'medium', animate = true, className = '' }: LogoProps) {
  const sizeClasses = {
    small: 'h-10',
    medium: 'h-16 md:h-20',
    large: 'h-24 md:h-32',
  };
  
  const animationClass = animate ? 'logo-glow' : '';
  
  return (
    <Link href="/">
      <div className="inline-block cursor-pointer">
        <svg 
          className={`${sizeClasses[size]} ${animationClass} ${className}`}
          viewBox="0 0 200 200" 
          fill="none" 
          xmlns="http://www.w3.org/2000/svg"
          aria-label="Atomic AI Logo"
        >
          <circle cx="100" cy="100" r="30" fill="#0a101a" stroke="#1677ff" strokeWidth="3" />
          <path
            d="M100 100 M60 100 A40 40 0 1 1 100 140 A40 40 0 1 1 140 100 A40 40 0 1 1 100 60 A40 40 0 1 1 60 100"
            stroke="#1677ff"
            strokeWidth="3"
            fill="none"
          />
          <path
            d="M100 40 A60 60 0 1 1 40 100 A60 60 0 1 1 100 160 A60 60 0 1 1 160 100 A60 60 0 1 1 100 40"
            stroke="#1677ff"
            strokeWidth="3"
            fill="none"
          />
          <circle cx="45" cy="100" r="5" fill="#1677ff" />
          <circle cx="155" cy="100" r="5" fill="#1677ff" />
          <circle cx="100" cy="45" r="5" fill="#1677ff" />
          <circle cx="100" cy="155" r="5" fill="#1677ff" />
          <filter id="glow">
            <feGaussianBlur stdDeviation="2.5" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </svg>
      </div>
    </Link>
  );
}
