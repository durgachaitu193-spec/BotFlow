import React, { ReactNode } from "react";
import "./style.css";
import { Loader2 } from "lucide-react";

const PrimaryButton = ({
  className,
  children,
  onClick,
  bgColor,
  shadowColor,
  loading,
  htmlType,
  disabled,
}: {
  className?: string;
  children: ReactNode;
  onClick?: () => void;
  bgColor?: string;
  shadowColor?: string;
  loading?: boolean;
  htmlType?: "button" | "submit" | "reset" | undefined;
  disabled?: boolean;
}) => {
  return (
    <button
      type={htmlType}
      onClick={onClick}
      disabled={disabled || loading}
      className={`primary-btn relative overflow-hidden rounded-2xl border-none outline-none font-poppins text-white flex items-center justify-center ${className} ${disabled || loading ? "opacity-70 cursor-not-allowed" : ""}`}
      style={{
        backgroundColor: bgColor,
        boxShadow: shadowColor ? `0 1px 0 2px ${shadowColor}` : undefined,
      }}
    >
      {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      <span className="font-extrabold">{children}</span>
    </button>
  );
};

export default PrimaryButton;
