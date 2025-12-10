import React from "react";
import Spinner from "./Spinner";

const Loader: React.FC<{
  size?: "small" | "default" | "large";
  text?: string;
  className?: string;
}> = ({
  size = "default",
  text,
}: {
  size?: "small" | "default" | "large";
  text?: string;
  className?: string;
}) => {
  return (
    <div className="flex flex-col h-full items-center justify-center gap-y-2">
      <Spinner size={size} />
      {text && <p className="text-white text-sm">{text}</p>}
    </div>
  );
};

export default Loader;
