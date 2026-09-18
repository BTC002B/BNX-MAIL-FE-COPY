import React, { useState, useEffect } from 'react';
import { useTranslation } from "../context/LanguageContext";
import { mailAPI } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { MdCloudQueue } from 'react-icons/md';

const StorageWidget = ({ isDesktopOpen }) => {
  const { t } = useTranslation();
  const { theme } = useTheme();
  const [storageData, setStorageData] = useState({
    used: 0,
    limit: 1073741824, // default 1 GB
    percentage: 0
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchStorage = async () => {
      try {
        const res = await mailAPI.getStorageQuota();
        if (res.data?.success && res.data?.data) {
          const used = res.data.data.storageUsed;
          const limit = 1073741824; // strictly 1 GB in frontend
          const percentage = limit > 0 ? (used / limit) * 100 : 0;
          setStorageData({
            used,
            limit,
            percentage
          });
        }
      } catch (err) {
        console.error("Failed to fetch storage quota", err);
      } finally {
        setLoading(false);
      }
    };
    fetchStorage();
  }, []);

  const formatSize = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  if (loading) return null;

  const usedText = t('storage.of_used', '{limit} of {used} used')
    .replace('{limit}', '1 GB')
    .replace('{used}', formatSize(storageData.used))
    .replace('of {limit} used', `of 1 GB ${t('storage.used_of', 'used')}`);

  return (
    <a 
      href="/storage-management"
      target="_blank"
      rel="noopener noreferrer"
      className={`mx-3 mb-2 p-4 flex items-center justify-between hover:bg-black/5 rounded-2xl transition-all cursor-pointer block ${!isDesktopOpen ? 'items-center justify-center p-2' : ''}`}
      style={{ 
        textDecoration: 'none', 
        color: '#1f2937',
        backgroundColor: '#ffffff',
        border: '1px solid #e5e7eb'
      }}
    >
      {/* Left side: Icon, Storage title, and usage description */}
      <div className="flex flex-col gap-1">
        <div className="flex items-center gap-2">
          <MdCloudQueue size={20} className="text-blue-600 shrink-0" />
          <span className="text-[14px] font-bold text-gray-800 font-sans hide-on-collapse">
            {t('storage.storage_widget_title', 'Storage')}
          </span>
        </div>
        <div className="text-[12px] text-gray-600 font-medium pl-0.5 hide-on-collapse">
          {t('storage.of_used', '{used} of {limit} used')
            .replace('{limit}', '1 GB')
            .replace('{used}', formatSize(storageData.used))}
        </div>
      </div>

      {/* Right side: Circular progress indicator with percentage inside */}
      <div className="relative w-11 h-11 flex items-center justify-center shrink-0 hide-on-collapse">
        <svg className="w-11 h-11 transform -rotate-90">
          {/* Background circle */}
          <circle
            cx="22"
            cy="22"
            r="17"
            className="stroke-blue-100"
            strokeWidth="3.5"
            fill="transparent"
          />
          {/* Foreground circle */}
          <circle
            cx="22"
            cy="22"
            r="17"
            className="stroke-blue-600"
            strokeWidth="3.5"
            fill="transparent"
            strokeDasharray={2 * Math.PI * 17}
            strokeDashoffset={2 * Math.PI * 17 * (1 - Math.min(storageData.percentage, 100) / 100)}
            strokeLinecap="round"
          />
        </svg>
        {/* Percentage inside */}
        <span className="absolute text-[11px] font-bold text-blue-600 font-sans">
          {storageData.percentage.toFixed(0)}%
        </span>
      </div>
    </a>
  );
};

export default StorageWidget;
