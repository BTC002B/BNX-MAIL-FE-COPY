import React, { useState } from "react";
import {
  MdCalendarToday, MdCalculate, MdPeople, MdKeyboard,
  MdTranslate, MdFilterCenterFocus, MdCloudQueue, MdNewspaper,
  MdAdd, MdCheck, MdClose, MdOutlineEdit, MdTune, MdApps, MdOutlineNoteAlt
} from "react-icons/md";
import { useTheme } from "../context/ThemeContext";
import AppLauncher from "./AppLauncher";
import { NotesManager } from "./StickyNotes";
import CalendarPanel from "./CalendarPanel";
import ContactPanel from "./ContactPanel";
import NotesPanel from "./NotesPanel";
import CalcPopover from "./CalcPopover";
import WeatherPanel from "./WeatherPanel";
import VirtualKeyboard from "./VirtualKeyboard";
import betalogo from '../assets/beta2.png';

// Tools Definition
const ALL_TOOLS = [
  { id: "calendar", name: "Calendar", icon: MdCalendarToday, color: "#f59e0b", ringClass: "border-[#f59e0b]", textClass: "text-[#f59e0b]", bgClass: "bg-amber-50 dark:bg-amber-950/20" },
  { id: "calculator", name: "Calculator", icon: MdCalculate, color: "#10b981", ringClass: "border-[#10b981]", textClass: "text-[#10b981]", bgClass: "bg-emerald-50 dark:bg-emerald-950/20" },
  { id: "contacts", name: "Contacts", icon: MdPeople, color: "#3b82f6", ringClass: "border-[#3b82f6]", textClass: "text-[#3b82f6]", bgClass: "bg-blue-50 dark:bg-blue-950/20" },
  { id: "notes", name: "Sticky Notes", icon: MdOutlineNoteAlt, color: "#eab308", ringClass: "border-[#eab308]", textClass: "text-[#eab308]", bgClass: "bg-yellow-50 dark:bg-yellow-950/20" },
  { id: "keyboard", name: "Keyboard", icon: MdKeyboard, color: "#6366f1", ringClass: "border-[#6366f1]", textClass: "text-[#6366f1]", bgClass: "bg-indigo-50 dark:bg-indigo-950/20" },
  { id: "weather", name: "Weather", icon: MdCloudQueue, color: "#06b6d4", ringClass: "border-[#06b6d4]", textClass: "text-[#06b6d4]", bgClass: "bg-cyan-50 dark:bg-cyan-950/20" }
];

const BitToolSidebar = ({
  isOpen,
  onClose,
  notes,
  openNoteIds,
  onOpenNote,
  onCreateNote,
  onDeleteNote
}) => {
  const { theme, backgroundImage } = useTheme();
  const [pinnedTools, setPinnedTools] = useState(["calendar", "calculator", "contacts", "notes", "keyboard", "weather"]);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedTool, setSelectedTool] = useState(null);
  const [showAppLauncher, setShowAppLauncher] = useState(false);

  // Tooltip helper state
  const [hoveredTool, setHoveredTool] = useState(null);

  // Calculator State
  const [calcInput, setCalcInput] = useState("");
  const [calcResult, setCalcResult] = useState("");

  // Contacts Search State
  const [contactsSearch, setContactsSearch] = useState("");

  // Weather State
  const [weatherCity, setWeatherCity] = useState("New York");

  // Width-based toggle handled dynamically via inline styles

  // Toggle Pinned status
  const handleTogglePin = (toolId) => {
    if (pinnedTools.includes(toolId)) {
      // Don't allow unpinning if it's the last one
      if (pinnedTools.length > 1) {
        setPinnedTools(pinnedTools.filter(id => id !== toolId));
      }
    } else {
      setPinnedTools([...pinnedTools, toolId]);
    }
  };

  // Calculator Buttons Click
  const handleCalcClick = (val) => {
    if (val === "C") {
      setCalcInput("");
      setCalcResult("");
    } else if (val === "=") {
      try {
        // Safe evaluation
        const cleanExpression = calcInput.replace(/[^0-9+\-*/.]/g, "");
        const res = Function(`"use strict"; return (${cleanExpression})`)();
        setCalcResult(String(res));
      } catch (err) {
        setCalcResult("Error");
      }
    } else if (val === "Del") {
      setCalcInput(prev => prev.slice(0, -1));
    } else {
      setCalcInput(prev => prev + val);
    }
  };

  const renderMiniApp = () => {
    switch (selectedTool) {
      case "calendar":
        return <CalendarPanel />;
      case "calculator":
        return <CalcPopover />;
      case "contacts":
        return <ContactPanel />;
      case "notes":
        return <NotesPanel />;
      case "weather":
        return <WeatherPanel />;
      default:
        return null;
    }
  };

  return (
    <div
      className={`h-full flex shrink-0 select-none transition-all duration-300 ease-in-out ${backgroundImage ? "bg-transparent" : "bg-white dark:bg-gray-900"} animate-fade-in rounded-tl-2xl`}
      style={{
        width: !isOpen ? "0px" : (selectedTool && selectedTool !== 'keyboard' ? "420px" : "60px"),
        borderLeftWidth: isOpen ? "1px" : "0px",
        borderLeftColor: backgroundImage ? "transparent" : theme.bg,
        overflow: "visible"
      }}
    >
      {/* Floating Virtual Keyboard */}
      {selectedTool === 'keyboard' && (
        <VirtualKeyboard onClose={() => setSelectedTool(null)} />
      )}

      {/* Mini-App Slide Panel (Shown to the left of the sidebar) */}
      <div
        className={`flex flex-col select-text transition-all duration-300 ease-in-out ${backgroundImage ? "bg-transparent" : "bg-white dark:bg-gray-900"} rounded-tl-2xl`}
        style={{
          width: selectedTool && selectedTool !== 'keyboard' ? "360px" : "0px",
          height: selectedTool && selectedTool !== 'keyboard' ? "100%" : "0px",
          maxHeight: selectedTool && selectedTool !== 'keyboard' ? "100%" : "0px",
          alignSelf: "flex-end",
          borderRightWidth: selectedTool && selectedTool !== 'keyboard' ? "1px" : "0px",
          borderRightColor: theme.border,
          overflow: "visible"
        }}
      >
        {selectedTool && selectedTool !== 'keyboard' && (
          selectedTool === 'apps' ? (
            <AppLauncher onClose={() => setSelectedTool(null)} onToggleBitToolSidebar={() => { }} onEdit={() => setIsEditing(true)} />
          ) : (
            <>
              <div className="px-4 h-14 border-b border-gray-200 dark:border-gray-800 flex justify-between items-center bg-black/[0.01] dark:bg-white/[0.01] shrink-0">
                <h4 className="font-bold text-sm" style={{ color: theme.text }}>
                  {ALL_TOOLS.find(t => t.id === selectedTool)?.name}
                </h4>
                <button
                  onClick={() => setSelectedTool(null)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 cursor-pointer flex items-center justify-center"
                >
                  <MdClose size={18} />
                </button>
              </div>
              <div className={`flex-1 overflow-y-auto custom-scrollbar flex flex-col ${selectedTool === 'calculator' ? 'p-0' : 'p-4'}`}>
                {renderMiniApp()}
              </div>
            </>
          )
        )}
      </div>

      {/* Right Sidebar Strip */}
      <div
        className="w-[60px] flex flex-col items-center pb-4 h-full justify-between select-none shrink-0"
      >
        <div className="flex flex-col items-center w-full">
          {/* HEADER / EDIT MODE LABEL */}
          <div
            className="flex items-center justify-center w-full h-14 shrink-0 transition-all"
          >
            {isEditing ? (
              <div className="text-[9px] font-bold text-gray-450 uppercase tracking-widest text-center leading-none">
                Edit<br />Pins
              </div>
            ) : (
              <div className="relative">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    setSelectedTool(selectedTool === 'apps' ? null : 'apps');
                  }}
                  className={`w-9 h-9 rounded-full flex items-center justify-center transition-all cursor-pointer border ${selectedTool === 'apps' ? 'bg-blue-50 text-blue-600 border-blue-200 dark:bg-blue-900/30 dark:text-blue-400 dark:border-blue-800' : 'border-transparent hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800 text-gray-500 dark:text-gray-400'}`}
                  title="Beta Ecosystem"
                >
                  {/* <MdApps size={22} /> */}
                  <img src={betalogo} alt="beta-apps" className="w-6 h-6 object-contain" />
                </button>
              </div>
            )}
          </div>

          {/* Divider Line under the B Logo */}
          <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800 -mt-[1px]" />

          {/* ACTIVE & INACTIVE TOOLS LIST */}
          <div className="flex flex-col items-center gap-4 w-full mt-2">
            {isEditing ? (
              // EDIT MODE LAYOUT: Shows all tools, currently pinned ones have color rings, unpinned have dashed
              ALL_TOOLS.map((tool) => {
                const isPinned = pinnedTools.includes(tool.id);
                const Icon = tool.icon;
                return (
                  <div key={tool.id} className="relative group">
                    <button
                      onClick={() => handleTogglePin(tool.id)}
                      onMouseEnter={() => setHoveredTool(tool.id)}
                      onMouseLeave={() => setHoveredTool(null)}
                      className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${isPinned
                          ? `${tool.ringClass} ${tool.bgClass} ${tool.textClass}`
                          : "border-dashed border-gray-300 dark:border-gray-700 bg-transparent text-gray-400 hover:border-gray-400"
                        }`}
                    >
                      <Icon size={18} />
                    </button>

                    {/* CUSTOM POPOVER TOOLTIP */}
                    {hoveredTool === tool.id && (
                      <div className="absolute right-[52px] top-1/2 -translate-y-1/2 bg-gray-800 text-white text-[11px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                        {isPinned ? `Unpin ${tool.name}` : `Pin ${tool.name}`}
                      </div>
                    )}
                  </div>
                );
              })
            ) : (
              // NORMAL MODE LAYOUT: Shows only pinned tools
              ALL_TOOLS
                .filter(t => pinnedTools.includes(t.id))
                .map((tool) => {
                  const Icon = tool.icon;
                  const isSelected = selectedTool === tool.id;
                  return (
                    <div key={tool.id} className="relative">
                      <button
                        onClick={() => setSelectedTool(isSelected ? null : tool.id)}
                        onMouseEnter={() => setHoveredTool(tool.id)}
                        onMouseLeave={() => setHoveredTool(null)}
                        className={`w-10 h-10 rounded-xl flex items-center justify-center transition-all cursor-pointer border-2 ${isSelected
                            ? `${tool.ringClass} ${tool.bgClass} ${tool.textClass} scale-95 shadow-inner`
                            : `border-transparent hover:scale-105 ${tool.bgClass} ${tool.textClass} shadow-sm`
                          }`}
                      >
                        <Icon size={18} />
                      </button>

                      {/* TOOLTIP */}
                      {hoveredTool === tool.id && (
                        <div className="absolute right-[52px] top-1/2 -translate-y-1/2 bg-gray-800 text-white text-[11px] font-medium px-2 py-1 rounded shadow-md whitespace-nowrap z-50">
                          {tool.name}
                        </div>
                      )}
                    </div>
                  );
                })
            )}

            {/* PLUS ICON / CHECKMARK ICON */}
            {isEditing ? (
              // Green Checkmark Button
              <button
                onClick={() => setIsEditing(false)}
                className="w-10 h-10 rounded-full bg-emerald-500 text-white flex items-center justify-center shadow-md hover:scale-105 active:scale-95 transition-all cursor-pointer mt-2"
                title="Save Pins"
              >
                <MdCheck size={18} />
              </button>
            ) : (
              // Plus Button (Dashed ring)
              <button
                onClick={() => setIsEditing(true)}
                className="w-10 h-10 rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-700 text-gray-400 hover:border-gray-500 hover:text-gray-600 flex items-center justify-center transition-all cursor-pointer"
                title="Edit Pins"
              >
                <MdAdd size={18} />
              </button>
            )}
          </div>
        </div>

        {/* BOTTOM UTILITY ICON BLOCK */}
        <div className="flex flex-col items-center gap-3.5 w-full mt-auto">
          <div className="w-8 h-[1px] bg-gray-200 dark:bg-gray-800" />

          <button
            className="w-10 h-10 rounded-xl border border-gray-200/60 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all cursor-pointer bg-white/50 dark:bg-gray-900/50 shadow-sm"
            title="Virtual Keyboard"
            onClick={() => setSelectedTool(selectedTool === 'keyboard' ? null : 'keyboard')}
          >
            <MdOutlineEdit size={18} />
          </button>

          <button
            className="w-10 h-10 rounded-xl border border-gray-200/60 dark:border-gray-850 hover:bg-gray-50 dark:hover:bg-gray-850 text-gray-500 dark:text-gray-400 flex items-center justify-center transition-all cursor-pointer bg-white/50 dark:bg-gray-900/50 shadow-sm"
            title="Customize Sidebar"
            onClick={() => setIsEditing(true)}
          >
            <MdTune size={18} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default BitToolSidebar;
