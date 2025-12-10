import React, { InputHTMLAttributes, ReactNode } from "react";

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  suffix?: ReactNode;
}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, suffix, ...props }, ref) => {
    return (
      <div className={`relative flex items-center ${className}`}>
        <input
          className={`w-full h-full bg-transparent outline-none px-4 py-2 ${suffix ? "pr-10" : ""}`}
          ref={ref}
          {...props}
        />
        {suffix && (
          <div className="absolute right-3 flex items-center pointer-events-none">
            {suffix}
          </div>
        )}
      </div>
    );
  },
);

Input.displayName = "Input";

export default Input;
