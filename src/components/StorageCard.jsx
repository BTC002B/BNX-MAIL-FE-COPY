import { useTranslation } from "../context/LanguageContext";
import React from 'react';
import { useTheme } from '../context/ThemeContext';

const StorageCard = ({
  name,
  icon: Icon,
  logo,
  usedStorage,
  totalStorage = 1073741824, // 1 GB in bytes
  usagePercentage,
  remainingStorage,
  onManage
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  // Determine displayed values dynamically if not explicitly provided
  const displayUsed = usedStorage !== undefined ? usedStorage : 0;
  const pct = usagePercentage !== undefined
    ? usagePercentage
    : (usedStorage !== undefined ? Math.round((displayUsed / totalStorage) * 100) : 0);
  const displayRemaining = remainingStorage !== undefined
    ? remainingStorage
    : (usedStorage !== undefined ? Math.max(0, totalStorage - displayUsed) : totalStorage);

  // Determine status color and text dynamically
  let statusColor = theme.accent || '#2563eb';
  let statusText = 'Normal';

  if (pct >= 95) {
    statusColor = '#ef4444'; // Red (Storage full)
    statusText = 'Storage Full';
  } else if (pct >= 80) {
    statusColor = '#f59e0b'; // Amber (Storage almost full)
    statusText = 'Storage Almost Full';
  } else {
    statusText = 'Normal';
  }

  return (
    <div
      className="p-6 rounded-2xl border flex flex-col gap-4 shadow-sm bg-white/40 dark:bg-gray-900/40 backdrop-blur-md"
      style={{ borderColor: theme.border, color: theme.text }}
    >
      {/* Icon + Application Name + Status Badge */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          {logo ? (
            <div
              className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0 overflow-hidden"
              style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
            >
              <img src={logo} alt={name} className="w-full h-full object-contain p-1" />
            </div>
          ) : Icon ? (
            <div
              className="p-2.5 rounded-xl flex items-center justify-center shrink-0"
              style={{ backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.05)' : 'rgba(0, 0, 0, 0.03)' }}
            >
              <Icon size={20} style={{ color: theme.accent }} />
            </div>
          ) : null}
          <span className="font-bold text-sm sm:text-base">{name}</span>
        </div>

        {/* Dynamic Status Badge */}
        {(usagePercentage !== undefined || usedStorage !== undefined) && (
          <span
            className="px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider rounded-md"
            style={{ backgroundColor: `${statusColor}15`, color: statusColor }}
          >
            {statusText}
          </span>
        )}
      </div>

      {/* Storage Information */}
      <div className="mt-2 space-y-2">
        <div className="flex items-baseline justify-between text-xs font-semibold">
          <span style={{ color: theme.subText }}>
            {usedStorage !== undefined ? formatSize(displayUsed) : '[Used Storage]'} / {formatSize(totalStorage)}
          </span>
          <span style={{ color: theme.subText }}>
            {usedStorage !== undefined || usagePercentage !== undefined ? `${Math.round(pct)}%` : '[Usage Percentage]'}
          </span>
        </div>

        {/* Horizontal Progress Bar */}
        <div
          className="w-full h-1.5 rounded-full overflow-hidden"
          style={{ backgroundColor: theme.mode === 'dark' ? '#374151' : '#e5e7eb' }}
        >
          <div
            className="h-full rounded-full transition-all duration-500"
            style={{
              width: `${(usedStorage !== undefined || usagePercentage !== undefined) ? Math.min(pct, 100) : 0}%`,
              backgroundColor: statusColor
            }}
          />
        </div>

        {/* Remaining Storage Description */}
        <div className="text-xs font-medium" style={{ color: theme.subText }}>
          {usedStorage !== undefined || remainingStorage !== undefined ? `${formatSize(displayRemaining)} remaining` : '[Available Storage]'}
        </div>
      </div>

      {/* Manage Button (UI Element only) */}
      <button
        type="button"
        onClick={onManage}
        className="w-full mt-3 py-2.5 rounded-xl font-bold text-xs border text-center transition-all hover:scale-[1.01] active:scale-[0.99] cursor-pointer"
        style={{
          borderColor: theme.border,
          color: theme.text,
          backgroundColor: theme.mode === 'dark' ? 'rgba(255, 255, 255, 0.02)' : 'rgba(0, 0, 0, 0.01)'
        }}
      >
        Manage
      </button>
    </div>
  );
};

export default StorageCard;
