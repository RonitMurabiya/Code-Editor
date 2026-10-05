export const getFileMode = (fileOrObj) => {
  const selectedFile =
    typeof fileOrObj === "string" ? fileOrObj : fileOrObj?.selectedFile;

  if (!selectedFile) return "javascript";

  const splitedArray = selectedFile.split(".");
  if (splitedArray.length <= 1) return "text";

  const extension = splitedArray[splitedArray.length - 1].toLowerCase();

  switch (extension) {
    case "js":
    case "jsx":
    case "mjs":
    case "cjs":
      return "javascript";
    case "ts":
    case "tsx":
      return "typescript";
    case "py":
      return "python";
    case "java":
      return "java";
    case "xml":
    case "svg":
      return "xml";
    case "rb":
      return "ruby";
    case "sass":
    case "scss":
    case "less":
    case "css":
      return "css";
    case "md":
    case "markdown":
      return "markdown";
    case "sql":
      return "mysql";
    case "json":
      return "json";
    case "html":
    case "htm":
      return "html";
    case "go":
      return "golang";
    case "cs":
      return "csharp";
    case "sh":
    case "bash":
      return "sh";
    case "c":
    case "cpp":
    case "h":
    case "hpp":
      return "c_cpp";
    case "rust":
    case "rs":
      return "rust";
    case "txt":
      return "text";
    default:
      return "javascript";
  }
};

export const getFileExtension = (filename) => {
  if (!filename) return "";
  const parts = filename.split(".");
  return parts.length > 1 ? parts[parts.length - 1].toLowerCase() : "";
};
