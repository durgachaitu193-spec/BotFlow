import React, { ReactNode } from "react";

const SecondaryButton = ({
  className,
  children,
  onClick,
  icon,
}: {
  className?: string;
  children: ReactNode;
  icon?: ReactNode;
  onClick?: () => void;
}) => {
  return (
    <button
      onClick={onClick}
      className={`shadow-none border-none outline-none p-0 font-primary bg-transparent text-white flex items-center gap-x-2 justify-between transition-all ${className}`}
    >
      {icon}
      <div className="flex items-center gap-x-0">
        <span>[</span>
        <span className="hover:text-primary font-bold">{children}</span>
        <span>]</span>
      </div>
    </button>
  );
};

export default SecondaryButton;
