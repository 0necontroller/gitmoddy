import { Identity } from '../types';

interface AuthorSelectProps {
  mailmap: Record<number, Identity>;
  value: number;
  onChange: (slot: number) => void;
  className?: string;
}

export default function AuthorSelect({ mailmap, value, onChange, className = '' }: AuthorSelectProps) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(Number(e.target.value))}
      className={[
        'bg-[#1c1d20] border border-white/[0.12] rounded-lg px-2.5 py-1.5',
        'text-[12px] text-[#e8e8ea] cursor-pointer appearance-none',
        'focus:outline-none focus:border-[#4b8ef0] hover:border-white/[0.22]',
        'transition-colors duration-150 max-w-[200px]',
        className,
      ].join(' ')}
    >
      {Object.entries(mailmap).map(([slot, id]) => (
        <option key={slot} value={slot} className="bg-[#1c1d20]">
          {id.name} &lt;{id.email}&gt;
        </option>
      ))}
    </select>
  );
}
