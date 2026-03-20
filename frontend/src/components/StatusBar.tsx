interface Props {
  counts: {
    PENDING: number;
    IN_PROGRESS: number;
    COMPLETED: number;
  };
  activeFilter: string;
  onFilter: (status: string) => void;
}

export default function StatusBar({ counts, activeFilter, onFilter }: Props) {
  const total = counts.PENDING + counts.IN_PROGRESS + counts.COMPLETED;

  const stats = [
    { key: '', label: 'All', count: total, emoji: '📋', color: 'bg-gray-100 text-gray-700 hover:bg-gray-200', active: 'bg-gray-800 text-white' },
    { key: 'PENDING', label: 'Pending', count: counts.PENDING, emoji: '🕐', color: 'bg-yellow-50 text-yellow-700 hover:bg-yellow-100', active: 'bg-yellow-500 text-white' },
    { key: 'IN_PROGRESS', label: 'In Progress', count: counts.IN_PROGRESS, emoji: '🔵', color: 'bg-blue-50 text-blue-700 hover:bg-blue-100', active: 'bg-blue-600 text-white' },
    { key: 'COMPLETED', label: 'Done', count: counts.COMPLETED, emoji: '✅', color: 'bg-green-50 text-green-700 hover:bg-green-100', active: 'bg-green-600 text-white' },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {stats.map((s) => (
        <button
          key={s.key}
          onClick={() => onFilter(s.key)}
          className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium transition-colors
            ${activeFilter === s.key ? s.active : s.color}`}
        >
          <span>{s.emoji}</span>
          <span>{s.label}</span>
          <span className={`ml-1 text-xs font-bold px-1.5 py-0.5 rounded-full
            ${activeFilter === s.key ? 'bg-white/25' : 'bg-black/10'}`}>
            {s.count}
          </span>
        </button>
      ))}
    </div>
  );
}
