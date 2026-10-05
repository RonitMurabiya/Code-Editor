import { useCallback, useEffect, useState } from "react";
import Terminal from "./components/Terminal";
import "./App.css";
import FileTree from "./components/Tree";
import socket from "./socket";
import AceEditor from "react-ace";

import "ace-builds/esm-resolver";

import "ace-builds/src-noconflict/theme-tomorrow_night";
import "ace-builds/src-noconflict/mode-javascript";
import "ace-builds/src-noconflict/theme-github";
import "ace-builds/src-noconflict/ext-language_tools";

function App() {
  const [fileTree, setFileTree] = useState({});
  const [selectedFile, setSelectedFile] = useState("");
  const [selectedFileContent, setSelectedFileContent] = useState("");
  const [code, setCode] = useState("");

  const isSaved = selectedFileContent === code;

  // Get file tree
  const getFileTree = useCallback(async () => {
    try {
      const response = await fetch("http://localhost:9000/files");

      if (!response.ok) {
        throw new Error("Failed to fetch file tree");
      }

      const result = await response.json();

      setFileTree(result.tree);
    } catch (error) {
      console.error("Error fetching file tree:", error);
    }
  }, []);

  useEffect(() => {
    getFileTree();

    socket.on("file:refresh", getFileTree);

    return () => {
      socket.off("file:refresh", getFileTree);
    };
  }, [getFileTree]);

  const getFileContents = useCallback(async () => {
    if (!selectedFile) return;

    try {
      const response = await fetch(
        `http://localhost:9000/files/content?path=${encodeURIComponent(
          selectedFile,
        )}`,
      );

      if (!response.ok) {
        throw new Error("Failed to fetch file content");
      }

      const result = await response.json();

      setSelectedFileContent(result.content);
      setCode(result.content);
    } catch (error) {
      console.error("Error fetching file content:", error);
    }
  }, [selectedFile]);

  useEffect(() => {
    getFileContents();
  }, [getFileContents]);

  useEffect(() => {
    if (!selectedFile || isSaved) return;

    const timer = setTimeout(() => {
      socket.emit("file:change", {
        path: selectedFile,
        content: code,
      });
    }, 2000);

    return () => {
      clearTimeout(timer);
    };
  }, [code, selectedFile, isSaved]);

  return (
    <div className="playground-container">
      <div className="code-editor-container">
        <div className="files">
          <FileTree
            onSelect={(path) => {
              setSelectedFile(path);
            }}
            tree={fileTree}
          />
        </div>

        <div className="editor">
          {selectedFile && (
            <p>
              {selectedFile.replaceAll("/", " > ")}{" "}
              {isSaved ? "Saved" : "Unsaved"}
            </p>
          )}

          <AceEditor
            mode="javascript"
            theme="tomorrow_night"
            value={code}
            onChange={(value) => setCode(value)}
            width="100%"
            height="100%"
            name="code-editor"
            setOptions={{
              enableBasicAutocompletion: true,
              enableLiveAutocompletion: true,
              enableSnippets: true,
              fontSize: "14px",
              showPrintMargin: false,
              highlightActiveLine: true,
              highlightGutterLine: true,
              displayIndentGuides: true,
              tabSize: 2,
              useSoftTabs: true,
            }}
          />
        </div>
      </div>

      <div className="terminal-container">
        <Terminal />
      </div>
    </div>
  );
}

export default App;
