import { useTranslation } from "../context/LanguageContext";
import React, { useState } from "react";
import { MdClose, MdEdit, MdAutoAwesome, MdRocketLaunch } from "react-icons/md";
import bnxLogo from "../assets/bnx-remove.png";
import b2authLogo from "../assets/auth2.png";
import bitToolLogo from "../assets/BIT-TOOL-2.png";
import cliksLogo from "../assets/cliks.png";
import cliksBusinessLogo from "../assets/cliks-business.png";

const AppLauncher = ({ onClose, onToggleBitToolSidebar, onEdit }) => {
  const { t } = useTranslation();
  const [activeTab, setActiveTab] = useState('BASE');
  const [activeTopTab, setActiveTopTab] = useState('FAVORITES');

  const [recentNames, setRecentNames] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('beta_launcher_recent_apps') || '[]');
    } catch (e) {
      return [];
    }
  });

  const [favoriteNames, setFavoriteNames] = useState(() => {
    try {
      const saved = localStorage.getItem('beta_launcher_favorite_apps');
      return saved ? JSON.parse(saved) : ['Cliks', 'BNXmail', 'Bit-Tool', 'B2Auth'];
    } catch (e) {
      return ['Cliks', 'BNXmail', 'Bit-Tool', 'B2Auth'];
    }
  });

  const [isEditing, setIsEditing] = useState(false);
  const [tempFavorites, setTempFavorites] = useState([]);

  const publicApps = [
    { name: 'Cliks', icon: cliksLogo, href: 'https://cliks.beta-softnet.com' },
    { name: 'BNXmail', icon: bnxLogo, href: 'https://www.bnxmail.com' },
    { name: 'Bit-Tool', icon: bitToolLogo, href: 'https://bit-tool.com/' },
    { name: 'B2Auth', icon: b2authLogo, href: 'https://www.b2auth.com' }
  ];

  const businessApps = [
    { name: 'CliksBusiness', icon: cliksBusinessLogo, href: 'https://www.cliksbusiness.com' }
  ];

  const displayApps = activeTab === 'BASE'
    ? [...publicApps, ...businessApps]
    : activeTab === 'PUBLIC'
      ? publicApps
      : businessApps;

  const allApps = [...publicApps, ...businessApps];

  const resolvedRecentApps = recentNames
    .map(name => allApps.find(app => app.name === name))
    .filter(Boolean);

  const handleAppClick = (app) => {
    const appName = app.name;
    const updatedNames = [appName, ...recentNames.filter(name => name !== appName)].slice(0, 3);
    setRecentNames(updatedNames);
    localStorage.setItem('beta_launcher_recent_apps', JSON.stringify(updatedNames));

    if (app.isButton) {
      onToggleBitToolSidebar?.();
      onClose();
    } else {
      window.open(app.href, '_blank');
    }
  };

  return (
    <div className="flex flex-col h-full bg-white w-full select-none">
      {/* Header */}
      <div className="flex items-center justify-between h-14 px-6 border-b border-gray-200 dark:border-gray-800 shrink-0">
        <div
          className="text-[30px] text-[#0f53c9] font-black"
          style={{
            fontFamily: "'Saira Stencil One', 'Anton', sans-serif",
            lineHeight: '1',
            marginLeft: '-10px',
            letterSpacing: '1px'
          }}
        >
          BETA
        </div>

        {/* Right buttons */}
        <div className="flex items-center gap-2">
          {/* Edit / Done button */}
          <button
            onClick={() => {
              if (isEditing) {
                // Done clicked — Save
                setFavoriteNames(tempFavorites);
                localStorage.setItem('beta_launcher_favorite_apps', JSON.stringify(tempFavorites));
                setIsEditing(false);
              } else {
                // Edit clicked — Start temporary session
                setTempFavorites([...favoriteNames]);
                setIsEditing(true);
              }
            }}
            className="h-7 px-3.5 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-slate-700 text-[10px] font-extrabold tracking-wider transition-colors border border-gray-150 cursor-pointer uppercase select-none"
          >
            {isEditing ? "Done" : "Edit"}
          </button>

          {/* Close button */}
          <button
            onClick={onClose}
            className="w-7 h-7 flex items-center justify-center rounded-full bg-gray-50 hover:bg-gray-100 text-gray-400 transition-colors border border-gray-150 cursor-pointer"
          >
            <MdClose size={18} />
          </button>
        </div>
      </div>

      {/* Main Content Area — height: auto, max-height: calc(100vh - 100px) */}
      <div className="flex-1 overflow-y-auto hidden-scrollbar px-3 py-2 flex flex-col justify-between" style={{ maxHeight: 'calc(100vh - 100px)' }}>
        {/* Favorites & Recent Tabs Inside Card Container */}
        <div className="border border-gray-200/90 rounded-[20px] px-6 py-4 mt-2 mb-0.5 bg-white shadow-[0_2px_10px_rgba(0,0,0,0.01)]">
          <div className="flex items-center justify-center gap-16 mb-2 text-[11.5px] font-[900] tracking-widest text-center">
            <button
              onClick={() => setActiveTopTab('FAVORITES')}
              className={`pb-1 transition-all border-b-2 ${activeTopTab === 'FAVORITES'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              FAVORITES
            </button>
            <span className="text-gray-300 font-normal pb-1">|</span>
            <button
              onClick={() => setActiveTopTab('RECENT')}
              className={`pb-1 transition-all border-b-2 ${activeTopTab === 'RECENT'
                ? 'border-emerald-700 text-emerald-700'
                : 'border-transparent text-slate-400 hover:text-slate-650'
                }`}
            >
              RECENT
            </button>
          </div>

          <div className="border-b border-gray-100 mb-3 -mx-6" />

          {/* Fixed Height Wrapper to prevent layout shift between FAVORITES & RECENT */}
          <div className="w-full h-[116px] flex items-center justify-center">
            {activeTopTab === 'FAVORITES' ? (
              (isEditing ? tempFavorites : favoriteNames).length > 0 ? (
                <div className="grid grid-cols-3 gap-x-5 gap-y-3 w-full py-0.5 justify-items-center">
                  {(isEditing ? tempFavorites : favoriteNames).map((name, idx) => {
                    const app = allApps.find(a => a.name === name);
                    if (!app) return null;
                    return (
                      <div
                        key={idx}
                        className="w-[84px] h-[54px] flex flex-col items-center justify-center border border-transparent rounded-[12px] p-0.5 outline-none relative group"
                        style={{ cursor: isEditing ? 'default' : 'pointer' }}
                        onClick={() => !isEditing && handleAppClick(app)}
                      >
                        <img src={app.icon} alt={app.name} className="w-[50px] h-[50px] object-contain" />
                        <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 tracking-wide">{app.name}</span>

                        {/* Red Remove X Badge in Edit Mode */}
                        {isEditing && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setTempFavorites(prev => prev.filter(n => n !== app.name));
                            }}
                            className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-500 hover:bg-red-650 text-white flex items-center justify-center shadow-sm cursor-pointer z-10 border border-white"
                            title="Remove from Favorites"
                          >
                            <span className="text-[9px] font-black leading-none">×</span>
                          </button>
                        )}
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="w-full h-full border border-dashed border-gray-200 rounded-[12px] flex items-center justify-center bg-transparent">
                  <span className="text-[10px] font-bold text-gray-400">No favorites saved</span>
                </div>
              )
            ) : resolvedRecentApps.length > 0 ? (
              <div className="grid grid-cols-3 gap-x-5 gap-y-3 w-full py-0.5 justify-items-center">
                {resolvedRecentApps.map((app, idx) => (
                  <div
                    key={idx}
                    className="w-[84px] h-[54px] flex flex-col items-center justify-center cursor-pointer transition-all hover:scale-105 hover:bg-slate-50/60 hover:border-gray-100/60 border border-transparent rounded-[12px] p-0.5 outline-none"
                    onClick={() => handleAppClick(app)}
                  >
                    <img src={app.icon} alt={app.name} className="w-[50px] h-[50px] object-contain" />
                    <span className="text-[10px] font-extrabold text-slate-800 mt-0.5 tracking-wide">{app.name}</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="w-full h-full border border-dashed border-gray-200 rounded-[12px] flex items-center justify-center bg-transparent">
                <span className="text-[10px] font-bold text-gray-400">No recent apps</span>
              </div>
            )}
          </div>
        </div>

        {/* Separator / Gap */}
        <div className="h-2 shrink-0" />

        {/* Base Tab Row */}
        <div className="px-3">
          <div className="flex items-center justify-between mb-2.5 px-0.5">
            <button
              onClick={() => setActiveTab('BASE')}
              className={`text-[14px] font-[900] tracking-widest pb-0.5 border-b-[3px] transition-colors ${activeTab === 'BASE' ? 'text-slate-800 border-[#0f53c9]' : 'text-slate-400 border-transparent hover:text-slate-650'}`}
            >
              BASE
            </button>

            <div className="flex items-center gap-3 text-[10.5px] font-extrabold tracking-widest">
              <button
                onClick={() => setActiveTab('PUBLIC')}
                className={`transition-colors ${activeTab === 'PUBLIC' ? 'text-[#0f53c9]' : 'text-slate-400 hover:text-slate-650'}`}
              >
                PUBLIC
              </button>
              <span className="text-gray-300 font-normal">|</span>
              <button
                onClick={() => setActiveTab('BUSINESS')}
                className={`transition-colors ${activeTab === 'BUSINESS' ? 'text-[#0f53c9]' : 'text-slate-400 hover:text-slate-650'}`}
              >
                BUSINESS
              </button>
            </div>
          </div>

          {/* Fixed Height Wrapper to prevent layout shift for different grid row counts */}
          <div className="h-[144px]">
            <div className="grid grid-cols-4 gap-3.5">
              {displayApps.map((app, idx) => {
                const isSelected = isEditing
                  ? tempFavorites.includes(app.name)
                  : favoriteNames.includes(app.name);

                return (
                  <div
                    key={idx}
                    onClick={() => {
                      if (isEditing) {
                        if (tempFavorites.includes(app.name)) {
                          setTempFavorites(prev => prev.filter(n => n !== app.name));
                        } else {
                          setTempFavorites(prev => [...new Set([...prev, app.name])]);
                        }
                      } else {
                        handleAppClick(app);
                      }
                    }}
                    className={`w-[74px] h-[68px] border rounded-[14px] flex flex-col items-center justify-center bg-white cursor-pointer group transition-all p-1 shadow-[0_1px_2px_rgba(0,0,0,0.015)] relative ${isEditing
                      ? isSelected
                        ? "border-emerald-500 bg-emerald-50/20 ring-2 ring-emerald-500/20 scale-102"
                        : "border-gray-150 opacity-60 hover:opacity-100 hover:border-gray-200"
                      : "border-gray-100/90 hover:border-gray-200 hover:shadow-sm hover:bg-white"
                      }`}
                  >
                    <img src={app.icon} alt={app.name} className="w-[38px] h-[38px] object-contain mb-0.5" />
                    <span className="text-[10px] font-extrabold text-slate-800 text-center leading-tight truncate w-full px-0.5">
                      {app.name}
                    </span>

                    {/* Selection Checkmark Indicator in Edit Mode */}
                    {isEditing && isSelected && (
                      <div className="absolute top-1 right-1 w-3.5 h-3.5 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-xs">
                        <span className="text-[8px] font-bold">✓</span>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Coming Soon Section */}
        <div className="mt-3 relative px-3">
          <style>{`
            @keyframes floatCard {
              0% { transform: scale(1); }
              50% { transform: scale(1.008); }
              100% { transform: scale(1); }
            }
            @keyframes floatLogo {
              0% { transform: translateY(0px) scale(1); }
              50% { transform: translateY(-2px) scale(1.06); }
              100% { transform: translateY(0px) scale(1); }
            }
            @keyframes pulseGlow {
              0% { box-shadow: 0 0 4px rgba(59, 130, 246, 0.12); }
              50% { box-shadow: 0 0 10px rgba(59, 130, 246, 0.35); }
              100% { box-shadow: 0 0 4px rgba(59, 130, 246, 0.12); }
            }
            .coming-soon-card {
              animation: floatCard 4s ease-in-out infinite;
            }
            .bnx-logo-anim {
              animation: floatLogo 3s ease-in-out infinite;
            }
            .glow-circle {
              animation: pulseGlow 3s ease-in-out infinite;
            }
          `}</style>

          {/* Animated Coming Soon Card */}
          <div className="coming-soon-card flex flex-col items-center text-center pt-6 pb-4 px-4 rounded-[20px] border border-gray-150 bg-slate-50/25 select-none relative shadow-[0_1px_6px_rgba(0,0,0,0.01)]">

            {/* Overlapping BNX Logo Animation Circle (Placed inside the card for proper relative stacking) */}
            <div className="absolute -top-5 left-1/2 -translate-x-1/2 w-9 h-9 rounded-full bg-white border border-gray-200/90 flex items-center justify-center shadow-sm z-10 glow-circle">
              <div className="w-7.5 h-7.5 rounded-full bg-blue-50 flex items-center justify-center overflow-hidden">
                <img
                  src={bnxLogo}
                  alt="BNX Logo Animation"
                  className="w-5 h-5 object-contain bnx-logo-anim"
                />
              </div>
            </div>

            {/* Badge */}
            <div className="px-2 py-0.5 rounded-full text-[7.5px] font-[900] tracking-widest bg-indigo-50 text-indigo-600 uppercase border border-indigo-100/50 mb-0.5 mt-0.5">
              BETA LABS RELEASE
            </div>

            {/* COMING SOON Text */}
            <h4 className="text-[11px] font-[950] tracking-widest text-[#9333ea] mb-0.5 uppercase">
              COMING SOON
            </h4>

            {/* Subtitle */}
            <p className="text-[9px] text-slate-500 font-extrabold px-4 leading-normal">
              Building the next generation of Beta applications.
            </p>
          </div>
        </div>
      </div>

      {/* Footer */}
      <div className="bg-white py-3 text-center border-t border-gray-100 shrink-0 rounded-b-[24px]">
        <span className="text-[8.5px] font-[900] text-slate-400 tracking-[0.18em]">BETA ECOSYSTEM · FUTURE READY</span>
      </div>
    </div>
  );
};

export default AppLauncher;
