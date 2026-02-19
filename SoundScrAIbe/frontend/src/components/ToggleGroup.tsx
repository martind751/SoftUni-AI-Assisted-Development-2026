interface ToggleOption<T extends string> {
  value: T
  label: string
}

interface ToggleGroupProps<T extends string> {
  options: ToggleOption<T>[]
  value: T
  onChange: (value: T) => void
}

export default function ToggleGroup<T extends string>({
  options,
  value,
  onChange,
}: ToggleGroupProps<T>) {
  return (
    <div className="flex items-center gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`min-w-[3.5rem] px-3 py-1 rounded text-xs font-medium transition-colors text-center ${
            value === option.value
              ? 'text-white border border-indigo-500'
              : 'text-slate-400 border border-slate-700 hover:border-slate-500'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
