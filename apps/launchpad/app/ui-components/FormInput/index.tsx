import React from "react";

const FormInput = ({
  className,
  textArea = false,
}: {
  className?: string;
  textArea?: boolean;
}) => {
  return textArea ? (
    <textarea
      rows={4}
      placeholder="Type here"
      className={`border border-white rounded-[30px] text-white placeholder:text-placeholder bg-transparent px-4 py-2 ${className}`}
    />
  ) : (
    <input
      placeholder="Type here"
      className={`border border-white rounded-[30px] text-white placeholder:text-placeholder bg-transparent px-4 py-2 ${className}`}
    />
  );
};

export default FormInput;
