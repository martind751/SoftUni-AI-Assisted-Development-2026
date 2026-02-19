interface PillOption<T extends string> {
  value: T
  label: string
}

interface PillGroupProps<T extends string> {
  options: PillOption<T>[]
  value: T
  onChange: (value: T) => void
  size?: 'lg' | 'md' | 'sm'
}

const SIZE_CLASSES = {
  lg: 'min-w-[5.5rem] px-5 py-2 text-sm',
  md: 'min-w-[5rem] px-4 py-1.5 text-sm',
  sm: 'min-w-[4.5rem] px-3 py-1.5 text-xs',
} as const

export default function PillGroup<T extends string>({
  options,
  value,
  onChange,
  size = 'md',
}: PillGroupProps<T>) {
  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={`rounded-full font-medium transition-colors text-center ${SIZE_CLASSES[size]} ${
            value === option.value
              ? 'bg-indigo-500 text-white font-semibold'
              : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
