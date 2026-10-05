const chokidar = require("chokidar");
const http = require("http");
const express = require("express");
const fs = require("fs/promises");
const { Server: SocketServer } = require("socket.io");
const path = require("path");
const cors = require("cors");
const pty = require("node-pty");

const app = express();
app.use(cors());
app.use(express.json());

const userDir = path.resolve(process.cwd(), "user");

function getSafeUserPath(requestedPath) {
  if (!requestedPath) return null;
  const normalized = requestedPath.startsWith("/")
    ? requestedPath
    : "/" + requestedPath;
  const safePath = path.resolve(userDir, "." + normalized);
  if (!safePath.startsWith(userDir)) {
    return null;
  }
  return safePath;
}

let ptyProcess;
try {
  ptyProcess = pty.spawn("wsl.exe", [], {
    name: "xterm-color",
    cols: 80,
    rows: 24,
    cwd: userDir,
    env: process.env,
  });
} catch (e) {
  console.warn("WSL spawn failed, falling back to powershell.exe:", e.message);
  ptyProcess = pty.spawn(
    process.platform === "win32" ? "powershell.exe" : "bash",
    [],
    {
      name: "xterm-color",
      cols: 80,
      rows: 24,
      cwd: userDir,
      env: process.env,
    },
  );
}

const server = http.createServer(app);
const io = new SocketServer({
  cors: "*",
});

io.attach(server);

let refreshDebounce;
chokidar
  .watch(userDir, { ignoreInitial: true })
  .on("all", (event, filePath) => {
    clearTimeout(refreshDebounce);
    refreshDebounce = setTimeout(() => {
      io.emit("file:refresh", filePath);
    }, 100);
  });

ptyProcess.onData((data) => {
  io.emit("terminal:data", data);
});

io.on("connection", (socket) => {
  console.log(`Socket connected:`, socket.id);

  socket.emit("file:refresh");

  socket.on("file:change", async ({ path: filePath, content }) => {
    const safePath = getSafeUserPath(filePath);
    if (!safePath) return;
    try {
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, content ?? "", "utf-8");
      socket.emit("file:saved", { path: filePath });
    } catch (err) {
      console.error("Error writing file:", err);
    }
  });

  socket.on("terminal:write", (data) => {
    if (ptyProcess) {
      ptyProcess.write(data);
    }
  });

  socket.on("terminal:resize", ({ cols, rows }) => {
    try {
      if (ptyProcess && cols && rows) {
        ptyProcess.resize(cols, rows);
      }
    } catch (e) {
      console.error("PTY resize error:", e.message);
    }
  });
});

app.get("/files", async (req, res) => {
  try {
    const fileTree = await generateFileTree(userDir);
    return res.json({ tree: fileTree });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get("/files/content", async (req, res) => {
  const filePath = req.query.path;
  if (!filePath) {
    return res.status(400).json({ error: "Path query parameter is required" });
  }

  const safePath = getSafeUserPath(filePath);
  if (!safePath) {
    return res.status(403).json({ error: "Invalid path access" });
  }

  try {
    const content = await fs.readFile(safePath, "utf-8");
    return res.json({ content });
  } catch (err) {
    return res.status(404).json({ error: "File not found or unreadable" });
  }
});

app.post("/files/create", async (req, res) => {
  const { path: filePath, isDir } = req.body;
  const safePath = getSafeUserPath(filePath);
  if (!safePath) return res.status(400).json({ error: "Invalid path" });

  try {
    if (isDir) {
      await fs.mkdir(safePath, { recursive: true });
    } else {
      await fs.mkdir(path.dirname(safePath), { recursive: true });
      await fs.writeFile(safePath, "", "utf-8");
    }
    io.emit("file:refresh", filePath);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.delete("/files", async (req, res) => {
  const filePath = req.query.path;
  const safePath = getSafeUserPath(filePath);
  if (!safePath) return res.status(400).json({ error: "Invalid path" });

  try {
    const stat = await fs.stat(safePath);
    if (stat.isDirectory()) {
      await fs.rm(safePath, { recursive: true, force: true });
    } else {
      await fs.unlink(safePath);
    }
    io.emit("file:refresh", filePath);
    return res.json({ success: true });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

server.listen(9000, "0.0.0.0", () =>
  console.log(`Docker server running on port 9000`),
);

async function generateFileTree(directory) {
  const tree = {};
  try {
    await fs.mkdir(directory, { recursive: true });
  } catch (e) {}

  async function buildTree(currentDir, currentTree) {
    try {
      const files = await fs.readdir(currentDir);
      for (const file of files) {
        if (file.startsWith(".")) continue;
        const filePath = path.join(currentDir, file);
        try {
          const stat = await fs.stat(filePath);
          if (stat.isDirectory()) {
            currentTree[file] = {};
            await buildTree(filePath, currentTree[file]);
          } else {
            currentTree[file] = null;
          }
        } catch (e) {}
      }
    } catch (e) {
      console.error("Error reading dir in buildTree:", e);
    }
  }

  await buildTree(directory, tree);
  return tree;
}
