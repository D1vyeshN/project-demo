interface KPICardProps {
  title: string;
  value: string | number;
  change?: string;
  changeType?: 'up' | 'down';
  color?: 'blue' | 'indigo' | 'green' | 'red' | 'amber';
}

export default function KPICard({ title, value, change, changeType = 'up', color = 'blue' }: KPICardProps) {
  const colorMap: Record<string, string> = {
    blue: 'bg-blue-50 border-blue-200 text-blue-700',
    indigo: 'bg-indigo-50 border-indigo-200 text-indigo-700',
    green: 'bg-green-50 border-green-200 text-green-700',
    red: 'bg-red-50 border-red-200 text-red-700',
    amber: 'bg-amber-50 border-amber-200 text-amber-700',
  };

  const changeColor = changeType === 'up' ? 'text-green-600' : 'text-red-600';
  const changeArrow = changeType === 'up' ? '↑' : '↓';

  return (
    <div className={`rounded-lg border p-4 ${colorMap[color]}`}>
      <div className="flex items-center justify-between mb-2">
        <p className="text-sm font-medium text-gray-600">{title}</p>
        {change && (
          <span className={`text-xs font-medium ${changeColor}`}>
            {changeArrow} {change}
          </span>
        )}
      </div>
      <p className="text-2xl font-bold">{value}</p>
    </div>
  );
}
