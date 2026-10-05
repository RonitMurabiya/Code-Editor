import React, { useState } from "react";

const getFileIcon = (fileName) => {
  const ext = fileName.split(".").pop().toLowerCase();
  switch (ext) {
    case "js":
      return { icon: "JS", color: "#f7df1e", bg: "#2d2a13" };
    case "jsx":
      return { icon: "⚛", color: "#61dafb", bg: "#132b35" };
    case "ts":
      return { icon: "TS", color: "#3178c6", bg: "#132435" };
    case "tsx":
      return { icon: "⚛", color: "#3178c6", bg: "#132435" };
    case "css":
    case "scss":
    case "sass":
      return { icon: "#", color: "#42a5f5", bg: "#14253a" };
    case "html":
    case "htm":
      return { icon: "<>", color: "#e44d26", bg: "#361c16" };
    case "json":
      return { icon: "{}", color: "#ffd54f", bg: "#2f2b16" };
    case "md":
      return { icon: "M↓", color: "#ab47bc", bg: "#28172c" };
    case "py":
      return { icon: "PY", color: "#3776ab", bg: "#152538" };
    case "sql":
      return { icon: "🗄", color: "#29b6f6", bg: "#122a3a" };
    case "txt":
      return { icon: "TXT", color: "#9e9e9e", bg: "#262626" };
    default:
      return { icon: "📄", color: "#b0bec5", bg: "#1e242c" };
  }
};

const FileTreeNode = ({
  fileName,
  nodes,
  onSelect,
  path,
  selectedFile,
  onDelete,
}) => {
  const isDir = Boolean(nodes && typeof nodes === "object");
  const [isOpen, setIsOpen] = useState(true);

  const handleClick = (e) => {
    e.stopPropagation();
    if (isDir) {
      setIsOpen((prev) => !prev);
    } else {
      onSelect(path);
    }
  };

  const isSelected = !isDir && selectedFile === path;
  const fileMeta = !isDir ? getFileIcon(fileName) : null;

  const childrenKeys =
    isDir && nodes
      ? Object.keys(nodes).sort((a, b) => {
          const aIsDir = nodes[a] !== null;
          const bIsDir = nodes[b] !== null;
          if (aIsDir && !bIsDir) return -1;
          if (!aIsDir && bIsDir) return 1;
          return a.localeCompare(b);
        })
      : [];

  return (
    <div className="tree-node-wrapper">
      <div
        onClick={handleClick}
        className={`tree-row ${isDir ? "directory-row" : "file-row"} ${
          isSelected ? "active-file" : ""
        }`}
        title={path || fileName}
      >
        <span className="node-indicator">
          {isDir ? (
            <span className={`folder-arrow ${isOpen ? "open" : ""}`}>▶</span>
          ) : (
            <span
              className="file-badge"
              style={{ color: fileMeta.color, backgroundColor: fileMeta.bg }}
            >
              {fileMeta.icon}
            </span>
          )}
        </span>

        {isDir && <span className="folder-icon">{isOpen ? "📂" : "📁"}</span>}

        <span className="node-name">{fileName}</span>

        {onDelete && path && (
          <button
            className="delete-node-btn"
            title="Delete"
            onClick={(e) => {
              e.stopPropagation();
              onDelete(path, isDir);
            }}
          >
            ×
          </button>
        )}
      </div>

      {isDir && isOpen && childrenKeys.length > 0 && (
        <ul className="tree-children">
          {childrenKeys.map((child) => (
            <li key={child}>
              <FileTreeNode
                fileName={child}
                nodes={nodes[child]}
                path={path ? `${path}/${child}` : `/${child}`}
                onSelect={onSelect}
                selectedFile={selectedFile}
                onDelete={onDelete}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

const FileTree = ({ tree, onSelect, selectedFile, onDelete }) => {
  if (!tree || Object.keys(tree).length === 0) {
    return (
      <div className="empty-tree-placeholder">
        <p>No files found in workspace.</p>
      </div>
    );
  }

  const rootKeys = Object.keys(tree).sort((a, b) => {
    const aIsDir = tree[a] !== null;
    const bIsDir = tree[b] !== null;
    if (aIsDir && !bIsDir) return -1;
    if (!aIsDir && bIsDir) return 1;
    return a.localeCompare(b);
  });

  return (
    <div className="file-tree-container">
      <ul className="tree-root-list">
        {rootKeys.map((key) => (
          <li key={key}>
            <FileTreeNode
              fileName={key}
              nodes={tree[key]}
              path={`/${key}`}
              onSelect={onSelect}
              selectedFile={selectedFile}
              onDelete={onDelete}
            />
          </li>
        ))}
      </ul>
    </div>
  );
};

export default FileTree;
