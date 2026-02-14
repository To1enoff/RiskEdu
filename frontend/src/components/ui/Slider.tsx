interface SliderProps {
  min: number;
  max: number;
  step?: number;
  value: number;
  onChange: (value: number) => void;
}

export const Slider = ({ min, max, step = 1, value, onChange }: SliderProps) => (
  <input
    type="range"
    min={min}
    max={max}
    step={step}
    value={value}
    onChange={(event) => onChange(Number(event.target.value))}
    className="h-2 w-full cursor-pointer appearance-none rounded-full bg-slate-200 accent-indigo-500"
  />
);
