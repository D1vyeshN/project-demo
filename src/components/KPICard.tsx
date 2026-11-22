interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  color?: 'blue' | 'green' | 'red' | 'amber';
}

export default function KPICard({ title, value, change, changeType = 'up', color = 'blue' }: KPICardProps) {
  const colorMap: Record<string, string> = {
    blue: 'border-blue-200 bg-blue-50 text-blue-700',
    green: 'border-green-200 bg-green-50 text-green-700',
    red: 'border-red-200 bg-red-50 text-red-700',
    amber: 'border-amber-200 bg-amber-50 text-amber-700',
  };

  const changeColor = changeType === 'up' ? 'text-green-600' : 'text-red-600';
  const changeArrow = changeType === 'up' ? '↑' : '↓';

  return (
    <div className={`rounded-xl border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-3">
        <p className="text-sm font-medium">{title}</p>
        {change && (
          <span className={`text-xs font-medium flex items-center gap-1 ${changeColor}`}>
            {changeArrow} {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}

