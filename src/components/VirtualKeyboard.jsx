import React, { useState, useEffect, useRef } from "react";
import { MdKeyboard, MdClose, MdArrowUpward, MdPanTool } from "react-icons/md";
import { useTheme } from "../context/ThemeContext";

const VirtualKeyboard = ({ onClose }) => {
  const { theme } = useTheme();
  const [isShift, setIsShift] = useState(false);
  const [capsLock, setCapsLock] = useState(false);
  const [isCtrl, setIsCtrl] = useState(false);
  const [isAlt, setIsAlt] = useState(false);

  // Draggable position state & refs
  const [position, setPosition] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const keyboardRef = useRef(null);
  const dragStartRef = useRef(null);

  const lastTargetRef = useRef(null);

  // Keep keyboard inside viewport on window resize
  useEffect(() => {
    const handleResize = () => {
      if (!keyboardRef.current) return;
      setPosition((prev) => {
        if (!prev) return prev;
        const rect = keyboardRef.current.getBoundingClientRect();
        const minX = 8;
        const maxX = Math.max(8, window.innerWidth - rect.width - 8);
        const minY = 8;
        const maxY = Math.max(8, window.innerHeight - rect.height - 8);
        return {
          x: Math.max(minX, Math.min(prev.x, maxX)),
          y: Math.max(minY, Math.min(prev.y, maxY)),
        };
      });
    };

    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  // Handle dragging the keyboard via the header
  const handlePointerDown = (e) => {
    // Only drag with primary pointer (left click or touch)
    if (e.button !== 0 && e.pointerType === "mouse") return;
    // Don't drag if clicking buttons (like close button)
    if (e.target.closest("button")) return;

    e.preventDefault();

    if (!keyboardRef.current) return;
    const rect = keyboardRef.current.getBoundingClientRect();
    const initialLeft = rect.left;
    const initialTop = rect.top;

    dragStartRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      initialLeft,
      initialTop,
      keyboardWidth: rect.width,
      keyboardHeight: rect.height,
    };

    setPosition({ x: initialLeft, y: initialTop });
    setIsDragging(true);

    const handlePointerMove = (moveEvent) => {
      if (!dragStartRef.current) return;
      const {
        startX,
        startY,
        initialLeft,
        initialTop,
        keyboardWidth,
        keyboardHeight,
      } = dragStartRef.current;
      const deltaX = moveEvent.clientX - startX;
      const deltaY = moveEvent.clientY - startY;

      let newX = initialLeft + deltaX;
      let newY = initialTop + deltaY;

      // Clamping within visible viewport boundaries
      const minX = 8;
      const maxX = Math.max(8, window.innerWidth - keyboardWidth - 8);
      const minY = 8;
      const maxY = Math.max(8, window.innerHeight - keyboardHeight - 8);

      newX = Math.max(minX, Math.min(newX, maxX));
      newY = Math.max(minY, Math.min(newY, maxY));

      setPosition({ x: newX, y: newY });
    };

    const handlePointerUp = () => {
      setIsDragging(false);
      dragStartRef.current = null;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  };

  // Keep track of the active or last focused input/textarea/contentEditable element
  useEffect(() => {
    const handleFocusIn = (e) => {
      const target = e.target;
      if (
        target &&
        (target.tagName === "INPUT" ||
          target.tagName === "TEXTAREA" ||
          target.isContentEditable)
      ) {
        lastTargetRef.current = target;
      }
    };

    document.addEventListener("focusin", handleFocusIn);
    return () => {
      document.removeEventListener("focusin", handleFocusIn);
    };
  }, []);

  // Listen to physical keyboard to sync modifier states
  useEffect(() => {
    const handlePhysicalKeyDown = (e) => {
      if (e.getModifierState) {
        setCapsLock(e.getModifierState("CapsLock"));
      }
      if (e.key === "Shift") {
        setIsShift(true);
      }
      if (e.key === "Control") {
        setIsCtrl(true);
      }
      if (e.key === "Alt") {
        setIsAlt(true);
      }
    };

    const handlePhysicalKeyUp = (e) => {
      if (e.getModifierState) {
        setCapsLock(e.getModifierState("CapsLock"));
      }
      if (e.key === "Shift") {
        setIsShift(false);
      }
      if (e.key === "Control") {
        setIsCtrl(false);
      }
      if (e.key === "Alt") {
        setIsAlt(false);
      }
    };

    window.addEventListener("keydown", handlePhysicalKeyDown);
    window.addEventListener("keyup", handlePhysicalKeyUp);

    return () => {
      window.removeEventListener("keydown", handlePhysicalKeyDown);
      window.removeEventListener("keyup", handlePhysicalKeyUp);
    };
  }, []);

  // Helper to get currently active or last focused element
  const getTargetElement = () => {
    const active = document.activeElement;
    if (
      active &&
      (active.tagName === "INPUT" ||
        active.tagName === "TEXTAREA" ||
        active.isContentEditable)
    ) {
      return active;
    }
    if (
      lastTargetRef.current &&
      document.body.contains(lastTargetRef.current)
    ) {
      return lastTargetRef.current;
    }
    return null;
  };

  // Helper to trigger React-compatible input change
  const setNativeValue = (element, value) => {
    const isTextarea = element.tagName === "TEXTAREA";
    const prototype = isTextarea
      ? window.HTMLTextAreaElement.prototype
      : window.HTMLInputElement.prototype;
    const descriptor = Object.getOwnPropertyDescriptor(prototype, "value");

    if (descriptor && descriptor.set) {
      descriptor.set.call(element, value);
    } else {
      element.value = value;
    }

    element.dispatchEvent(new Event("input", { bubbles: true }));
    element.dispatchEvent(new Event("change", { bubbles: true }));
  };

  // Insert or perform action on the target input
  const handleKeyClick = (keyData) => {
    const target = getTargetElement();

    if (!target) {
      // If no input is focused, toggle modifiers if clicked
      if (keyData.action === "shift") setIsShift((prev) => !prev);
      if (keyData.action === "caps") setCapsLock((prev) => !prev);
      if (keyData.action === "ctrl") setIsCtrl((prev) => !prev);
      if (keyData.action === "alt") setIsAlt((prev) => !prev);
      return;
    }

    // Ensure target remains focused
    target.focus();

    // 1. ContentEditable element
    if (target.isContentEditable) {
      if (keyData.action === "backspace") {
        document.execCommand("delete", false, null);
      } else if (keyData.action === "enter") {
        document.execCommand("insertParagraph", false, null);
      } else if (keyData.action === "space") {
        document.execCommand("insertText", false, " ");
      } else if (keyData.action === "tab") {
        document.execCommand("insertText", false, "\t");
      } else if (keyData.action === "shift") {
        setIsShift((prev) => !prev);
      } else if (keyData.action === "caps") {
        setCapsLock((prev) => !prev);
      } else if (keyData.char) {
        let ch = keyData.char;
        const isUpper = isShift ? !capsLock : capsLock;
        if (typeof ch === "string" && ch.length === 1 && /[a-zA-Z]/.test(ch)) {
          ch = isUpper ? ch.toUpperCase() : ch.toLowerCase();
        } else if (keyData.shiftChar && isShift) {
          ch = keyData.shiftChar;
        }
        document.execCommand("insertText", false, ch);
        if (isShift) setIsShift(false);
      }
      return;
    }

    // 2. Standard Input / Textarea
    const start = target.selectionStart ?? target.value.length;
    const end = target.selectionEnd ?? target.value.length;
    const val = target.value || "";
    const before = val.substring(0, start);
    const after = val.substring(end);

    switch (keyData.action) {
      case "backspace": {
        if (start !== end) {
          const newVal = before + after;
          setNativeValue(target, newVal);
          target.setSelectionRange(start, start);
        } else if (start > 0) {
          const newVal = val.substring(0, start - 1) + after;
          setNativeValue(target, newVal);
          target.setSelectionRange(start - 1, start - 1);
        }
        break;
      }

      case "enter": {
        if (target.tagName === "TEXTAREA") {
          const newVal = before + "\n" + after;
          setNativeValue(target, newVal);
          target.setSelectionRange(start + 1, start + 1);
        } else {
          // Trigger Enter key events on input (for search/submit)
          target.dispatchEvent(
            new KeyboardEvent("keydown", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            })
          );
          target.dispatchEvent(
            new KeyboardEvent("keypress", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            })
          );
          target.dispatchEvent(
            new KeyboardEvent("keyup", {
              key: "Enter",
              code: "Enter",
              keyCode: 13,
              which: 13,
              bubbles: true,
            })
          );

          // If inside a form and not textarea, submit form
          if (target.form) {
            target.form.dispatchEvent(
              new Event("submit", { bubbles: true, cancelable: true })
            );
          }
        }
        break;
      }

      case "tab": {
        // Move focus to next focusable element
        const focusables = Array.from(
          document.querySelectorAll(
            'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
          )
        ).filter(
          (el) =>
            !el.closest("#virtual-keyboard-root") &&
            el.offsetWidth > 0 &&
            el.offsetHeight > 0
        );
        const index = focusables.indexOf(target);
        if (index > -1 && index + 1 < focusables.length) {
          focusables[index + 1].focus();
        } else if (focusables.length > 0) {
          focusables[0].focus();
        }
        break;
      }

      case "space": {
        const newVal = before + " " + after;
        setNativeValue(target, newVal);
        target.setSelectionRange(start + 1, start + 1);
        break;
      }

      case "caps": {
        setCapsLock((prev) => !prev);
        break;
      }

      case "shift": {
        setIsShift((prev) => !prev);
        break;
      }

      case "ctrl": {
        setIsCtrl((prev) => !prev);
        break;
      }

      case "alt": {
        setIsAlt((prev) => !prev);
        break;
      }

      case "esc": {
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "Escape",
            code: "Escape",
            keyCode: 27,
            which: 27,
            bubbles: true,
          })
        );
        target.blur();
        break;
      }

      case "left": {
        const newPos = Math.max(0, start - 1);
        target.setSelectionRange(newPos, newPos);
        break;
      }

      case "right": {
        const newPos = Math.min(val.length, end + 1);
        target.setSelectionRange(newPos, newPos);
        break;
      }

      case "up": {
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowUp",
            code: "ArrowUp",
            keyCode: 38,
            which: 38,
            bubbles: true,
          })
        );
        const newPos = Math.max(0, start - 20);
        target.setSelectionRange(newPos, newPos);
        break;
      }

      case "down": {
        target.dispatchEvent(
          new KeyboardEvent("keydown", {
            key: "ArrowDown",
            code: "ArrowDown",
            keyCode: 40,
            which: 40,
            bubbles: true,
          })
        );
        const newPos = Math.min(val.length, end + 20);
        target.setSelectionRange(newPos, newPos);
        break;
      }

      default: {
        if (keyData.char) {
          let charToInsert = keyData.char;
          const isUpper = isShift ? !capsLock : capsLock;

          if (
            typeof charToInsert === "string" &&
            charToInsert.length === 1 &&
            /[a-zA-Z]/.test(charToInsert)
          ) {
            charToInsert = isUpper
              ? charToInsert.toUpperCase()
              : charToInsert.toLowerCase();
          } else if (keyData.shiftChar && isShift) {
            charToInsert = keyData.shiftChar;
          }

          const newVal = before + charToInsert + after;
          setNativeValue(target, newVal);
          target.setSelectionRange(
            start + charToInsert.length,
            start + charToInsert.length
          );

          // Reset temporary shift on letter/symbol entry
          if (isShift) {
            setIsShift(false);
          }
        }
        break;
      }
    }
  };

  // Keyboard Rows definition exactly matching reference image
  const row1 = [
    { label: "Esc", action: "esc", flex: "flex-[1.2] min-w-[36px]" },
    { char: "1", shiftChar: "!", flex: "flex-1 min-w-[28px]" },
    { char: "2", shiftChar: "@", flex: "flex-1 min-w-[28px]" },
    { char: "3", shiftChar: "#", flex: "flex-1 min-w-[28px]" },
    { char: "4", shiftChar: "$", flex: "flex-1 min-w-[28px]" },
    { char: "5", shiftChar: "%", flex: "flex-1 min-w-[28px]" },
    { char: "6", shiftChar: "^", flex: "flex-1 min-w-[28px]" },
    { char: "7", shiftChar: "&", flex: "flex-1 min-w-[28px]" },
    { char: "8", shiftChar: "*", flex: "flex-1 min-w-[28px]" },
    { char: "9", shiftChar: "(", flex: "flex-1 min-w-[28px]" },
    { char: "0", shiftChar: ")", flex: "flex-1 min-w-[28px]" },
    { char: "-", shiftChar: "_", flex: "flex-1 min-w-[28px]" },
    { char: "=", shiftChar: "+", flex: "flex-1 min-w-[28px]" },
    {
      label: "Backspace",
      action: "backspace",
      flex: "flex-[1.8] min-w-[62px]",
    },
  ];

  const row2 = [
    { label: "Tab", action: "tab", flex: "flex-[1.4] min-w-[44px]" },
    { char: "q", shiftChar: "Q", flex: "flex-1 min-w-[28px]" },
    { char: "w", shiftChar: "W", flex: "flex-1 min-w-[28px]" },
    { char: "e", shiftChar: "E", flex: "flex-1 min-w-[28px]" },
    { char: "r", shiftChar: "R", flex: "flex-1 min-w-[28px]" },
    { char: "t", shiftChar: "T", flex: "flex-1 min-w-[28px]" },
    { char: "y", shiftChar: "Y", flex: "flex-1 min-w-[28px]" },
    { char: "u", shiftChar: "U", flex: "flex-1 min-w-[28px]" },
    { char: "i", shiftChar: "I", flex: "flex-1 min-w-[28px]" },
    { char: "o", shiftChar: "O", flex: "flex-1 min-w-[28px]" },
    { char: "p", shiftChar: "P", flex: "flex-1 min-w-[28px]" },
    { char: "[", shiftChar: "{", flex: "flex-1 min-w-[28px]" },
    { char: "]", shiftChar: "}", flex: "flex-1 min-w-[28px]" },
  ];

  const row3 = [
    {
      label: "Caps Lock",
      action: "caps",
      isCaps: true,
      flex: "flex-[1.7] min-w-[58px]",
    },
    { char: "a", shiftChar: "A", flex: "flex-1 min-w-[28px]" },
    { char: "s", shiftChar: "S", flex: "flex-1 min-w-[28px]" },
    { char: "d", shiftChar: "D", flex: "flex-1 min-w-[28px]" },
    { char: "f", shiftChar: "F", flex: "flex-1 min-w-[28px]" },
    { char: "g", shiftChar: "G", flex: "flex-1 min-w-[28px]" },
    { char: "h", shiftChar: "H", flex: "flex-1 min-w-[28px]" },
    { char: "j", shiftChar: "J", flex: "flex-1 min-w-[28px]" },
    { char: "k", shiftChar: "K", flex: "flex-1 min-w-[28px]" },
    { char: "l", shiftChar: "L", flex: "flex-1 min-w-[28px]" },
    { char: ";", shiftChar: ":", flex: "flex-1 min-w-[28px]" },
    { char: "'", shiftChar: '"', flex: "flex-1 min-w-[28px]" },
    {
      label: "Enter",
      action: "enter",
      isEnter: true,
      flex: "flex-[1.7] min-w-[58px]",
    },
  ];

  const row4 = [
    {
      label: "Shift",
      action: "shift",
      isShiftKey: true,
      flex: "flex-[1.8] min-w-[62px]",
    },
    { char: "z", shiftChar: "Z", flex: "flex-1 min-w-[28px]" },
    { char: "x", shiftChar: "X", flex: "flex-1 min-w-[28px]" },
    { char: "c", shiftChar: "C", flex: "flex-1 min-w-[28px]" },
    { char: "v", shiftChar: "V", flex: "flex-1 min-w-[28px]" },
    { char: "b", shiftChar: "B", flex: "flex-1 min-w-[28px]" },
    { char: "n", shiftChar: "N", flex: "flex-1 min-w-[28px]" },
    { char: "m", shiftChar: "M", flex: "flex-1 min-w-[28px]" },
    { char: ",", shiftChar: "<", flex: "flex-1 min-w-[28px]" },
    { char: ".", shiftChar: ">", flex: "flex-1 min-w-[28px]" },
    { char: "/", shiftChar: "?", flex: "flex-1 min-w-[28px]" },
    {
      label: "Shift",
      action: "shift",
      isShiftKey: true,
      flex: "flex-[1.8] min-w-[62px]",
    },
  ];

  const row5 = [
    {
      label: "Ctrl",
      action: "ctrl",
      isCtrlKey: true,
      flex: "flex-1 min-w-[34px]",
    },
    {
      label: "Alt",
      action: "alt",
      isAltKey: true,
      flex: "flex-1 min-w-[34px]",
    },
    {
      label: "Space",
      action: "space",
      isSpace: true,
      flex: "flex-[5.5] min-w-[130px]",
    },
    {
      label: "Alt",
      action: "alt",
      isAltKey: true,
      flex: "flex-1 min-w-[34px]",
    },
    {
      label: "Ctrl",
      action: "ctrl",
      isCtrlKey: true,
      flex: "flex-1 min-w-[34px]",
    },
    {
      label: "◀",
      action: "left",
      isArrow: true,
      flex: "flex-[0.9] min-w-[28px]",
    },
    {
      label: "▼",
      action: "down",
      isArrow: true,
      flex: "flex-[0.9] min-w-[28px]",
    },
    {
      label: "▲",
      action: "up",
      isArrow: true,
      flex: "flex-[0.9] min-w-[28px]",
    },
    {
      label: "▶",
      action: "right",
      isArrow: true,
      flex: "flex-[0.9] min-w-[28px]",
    },
  ];

  const renderKey = (keyItem, index) => {
    // 1. Enter Key (Blue filled)
    if (keyItem.isEnter) {
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg bg-blue-500 hover:bg-blue-600 active:bg-blue-700 text-white font-medium text-xs flex items-center justify-center shadow-xs cursor-pointer select-none transition-all active:scale-95`}
        >
          {keyItem.label}
        </button>
      );
    }

    // 2. Caps Lock Key
    if (keyItem.isCaps) {
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg font-medium text-xs flex items-center justify-center shadow-xs cursor-pointer select-none transition-all active:scale-95 border ${
            capsLock
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-400 font-semibold shadow-inner"
              : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 border-gray-200/90 dark:border-gray-700"
          }`}
        >
          {keyItem.label}
        </button>
      );
    }

    // 3. Shift Key
    if (keyItem.isShiftKey) {
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg font-medium text-xs flex items-center justify-center gap-1 shadow-xs cursor-pointer select-none transition-all active:scale-95 border ${
            isShift
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-400 font-semibold shadow-inner"
              : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-700 dark:text-gray-200 border-gray-200/90 dark:border-gray-700"
          }`}
        >
          <MdArrowUpward size={13} />
          <span>{keyItem.label}</span>
        </button>
      );
    }

    // 4. Ctrl & Alt Modifier Keys
    if (keyItem.isCtrlKey || keyItem.isAltKey) {
      const isActive =
        (keyItem.isCtrlKey && isCtrl) || (keyItem.isAltKey && isAlt);
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg font-medium text-[11px] flex items-center justify-center shadow-xs cursor-pointer select-none transition-all active:scale-95 border ${
            isActive
              ? "bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400 border-blue-400 font-semibold"
              : "bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-650 dark:text-gray-300 border-gray-200/90 dark:border-gray-700"
          }`}
        >
          {keyItem.label}
        </button>
      );
    }

    // 5. Special named keys (Esc, Tab, Backspace, Space, Arrows)
    if (keyItem.label) {
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg bg-gray-50 hover:bg-gray-100 dark:bg-gray-800 dark:hover:bg-gray-750 text-gray-750 dark:text-gray-200 border border-gray-200/90 dark:border-gray-700 font-medium text-xs flex items-center justify-center shadow-xs cursor-pointer select-none transition-all active:scale-95`}
        >
          {keyItem.label}
        </button>
      );
    }

    // 6. Character / Symbol keys
    const isLetter =
      typeof keyItem.char === "string" && /[a-zA-Z]/.test(keyItem.char);

    if (isLetter) {
      const isUpper = isShift ? !capsLock : capsLock;
      const displayChar = isUpper
        ? keyItem.char.toUpperCase()
        : keyItem.char.toUpperCase(); // Key caps typically show uppercase in UI
      return (
        <button
          key={index}
          onMouseDown={(e) => e.preventDefault()}
          onClick={() => handleKeyClick(keyItem)}
          className={`${keyItem.flex} h-9 rounded-lg bg-white hover:bg-gray-50 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-850 dark:text-gray-100 border border-gray-200/90 dark:border-gray-700 font-medium text-xs flex items-center justify-center shadow-xs cursor-pointer select-none transition-all active:scale-95`}
        >
          {displayChar}
        </button>
      );
    }

    // Number & Symbol Dual Keys (shows symbol on top, character on bottom)
    return (
      <button
        key={index}
        onMouseDown={(e) => e.preventDefault()}
        onClick={() => handleKeyClick(keyItem)}
        className={`${keyItem.flex} h-9 rounded-lg bg-white hover:bg-gray-50 dark:bg-gray-850 dark:hover:bg-gray-800 text-gray-850 dark:text-gray-100 border border-gray-200/90 dark:border-gray-700 flex flex-col items-center justify-center leading-none py-0.5 shadow-xs cursor-pointer select-none transition-all active:scale-95`}
      >
        <span
          className={`text-[9.5px] ${
            isShift
              ? "text-blue-600 dark:text-blue-400 font-bold"
              : "text-gray-400 dark:text-gray-500 font-normal"
          }`}
        >
          {keyItem.shiftChar}
        </span>
        <span
          className={`text-xs mt-0.5 ${
            !isShift
              ? "text-gray-800 dark:text-gray-100 font-semibold"
              : "text-gray-500 dark:text-gray-400 font-normal"
          }`}
        >
          {keyItem.char}
        </span>
      </button>
    );
  };

  return (
    <div
      ref={keyboardRef}
      id="virtual-keyboard-root"
      className={`fixed z-[999] w-[calc(100vw-80px)] max-w-[620px] bg-white dark:bg-gray-900 rounded-2xl shadow-2xl border border-gray-200/90 dark:border-gray-800 p-3.5 select-none ${
        position ? "" : "bottom-4 right-16 sm:right-20 animate-fade-in"
      }`}
      style={{
        boxShadow:
          "0 20px 45px -10px rgba(0, 0, 0, 0.22), 0 0 1px 1px rgba(0,0,0,0.05)",
        ...(position
          ? {
              left: `${position.x}px`,
              top: `${position.y}px`,
              bottom: "auto",
              right: "auto",
            }
          : {}),
      }}
    >
      {/* Draggable Header */}
      <div
        onPointerDown={handlePointerDown}
        className={`flex items-center justify-between pb-3 mb-2 border-b border-gray-100 dark:border-gray-800 touch-none select-none ${
          isDragging ? "cursor-grabbing" : "cursor-grab"
        }`}
      >
        <div className="flex items-center gap-2 pointer-events-none">
          <div className="w-6 h-6 rounded-md bg-blue-50 dark:bg-blue-950/40 text-blue-600 dark:text-blue-400 flex items-center justify-center">
            <MdKeyboard size={16} />
          </div>
          <span className="font-semibold text-gray-800 dark:text-gray-100 text-xs sm:text-sm">
            Virtual Keyboard
          </span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* White Hand Drag Button */}
          <div
            onPointerDown={handlePointerDown}
            className="w-7 h-7 rounded-lg bg-blue-600 hover:bg-blue-600 active:bg-blue-700 text-white flex items-center justify-center cursor-grab active:cursor-grabbing shadow-xs transition-all touch-none select-none"
            title="Drag to move keyboard"
          >
            <MdPanTool size={14} className="text-white fill-white" />
          </div>

          {/* Close Button */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              onClose();
            }}
            onMouseDown={(e) => e.stopPropagation()}
            onPointerDown={(e) => e.stopPropagation()}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors cursor-pointer"
            title="Close Virtual Keyboard"
          >
            <MdClose size={16} />
          </button>
        </div>
      </div>

      {/* Keyboard Grid */}
      <div className="flex flex-col gap-1.5 w-full">
        {/* Row 1 */}
        <div className="flex gap-1 w-full justify-between">{row1.map(renderKey)}</div>

        {/* Row 2 */}
        <div className="flex gap-1 w-full justify-between">{row2.map(renderKey)}</div>

        {/* Row 3 */}
        <div className="flex gap-1 w-full justify-between">{row3.map(renderKey)}</div>

        {/* Row 4 */}
        <div className="flex gap-1 w-full justify-between">{row4.map(renderKey)}</div>

        {/* Row 5 */}
        <div className="flex gap-1 w-full justify-between">{row5.map(renderKey)}</div>
      </div>
    </div>
  );
};

export default VirtualKeyboard;
