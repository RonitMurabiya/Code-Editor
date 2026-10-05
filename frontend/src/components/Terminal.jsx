import React, { useRef, useEffect } from "react";
import { Terminal as Xterminal } from "@xterm/xterm";
import socket from "../socket";
import "@xterm/xterm/css/xterm.css";

function Terminal() {
  const terminalRef = useRef(null);
  const termInstanceRef = useRef(null);

  useEffect(() => {
    if (!terminalRef.current) return;

    terminalRef.current.innerHTML = "";

    const term = new Xterminal({
      rows: 14,
      cursorBlink: true,
      fontFamily:
        '"Fira Code", "JetBrains Mono", Consolas, "Courier New", monospace',
      fontSize: 13,
      lineHeight: 1.25,
      theme: {
        background: "#0d1117",
        foreground: "#c9d1d9",
        cursor: "#58a6ff",
        selectionBackground: "rgba(56, 139, 253, 0.35)",
        black: "#0d1117",
        red: "#ff7b72",
        green: "#3fb950",
        yellow: "#d29922",
        blue: "#58a6ff",
        magenta: "#bc8cff",
        cyan: "#39c5cf",
        white: "#b1bac4",
        brightBlack: "#6e7681",
        brightRed: "#ffa198",
        brightGreen: "#56d364",
        brightYellow: "#e3b341",
        brightBlue: "#79c0ff",
        brightMagenta: "#d2a8ff",
        brightCyan: "#56d4dd",
        brightWhite: "#f0f6fc",
      },
    });

    termInstanceRef.current = term;
    term.open(terminalRef.current);

    const onDataDisposable = term.onData((data) => {
      socket.emit("terminal:write", data);
    });

    const onTerminalData = (data) => {
      term.write(data);
    };

    socket.on("terminal:data", onTerminalData);

    const handleResize = () => {
      if (!terminalRef.current || !term) return;
      const cols = Math.max(
        40,
        Math.floor(terminalRef.current.clientWidth / 9),
      );
      term.resize(cols, 14);
      socket.emit("terminal:resize", { cols, rows: 14 });
    };

    window.addEventListener("resize", handleResize);
    handleResize();

    return () => {
      window.removeEventListener("resize", handleResize);
      socket.off("terminal:data", onTerminalData);
      onDataDisposable.dispose();
      term.dispose();
      termInstanceRef.current = null;
    };
  }, []);

  const handleClear = () => {
    if (termInstanceRef.current) {
      termInstanceRef.current.clear();
    }
  };

  return (
    <div className="terminal-wrapper">
      <div className="terminal-header">
        <div className="terminal-title">
          <span className="terminal-icon">⚡</span>
          <span>Terminal</span>
          <span className="terminal-badge">WSL Bash</span>
        </div>
        <div className="terminal-actions">
          <span className="terminal-status">
            <span className="status-dot"></span>
            Connected
          </span>
          <button
            className="terminal-btn"
            onClick={handleClear}
            title="Clear terminal"
          >
            Clear
          </button>
        </div>
      </div>
      <div ref={terminalRef} id="terminal" className="terminal-body" />
    </div>
  );
}

export default Terminal;
