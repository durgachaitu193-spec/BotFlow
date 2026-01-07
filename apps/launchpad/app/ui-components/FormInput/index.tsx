const FormInput = ({ className, textArea = false }: { className?: string; textArea?: boolean }) => {
  return textArea ? (
    <textarea
      rows={4}
      placeholder='Type here'
      className={`rounded-[30px] border border-white bg-transparent px-4 py-2 text-white placeholder:text-placeholder ${className}`}
    />
  ) : (
    <input
      placeholder='Type here'
      className={`rounded-[30px] border border-white bg-transparent px-4 py-2 text-white placeholder:text-placeholder ${className}`}
    />
  )
}

export default FormInput
