
const SUPABASE_URL = "https://fjtxomdiktaerrbjrlhu.supabase.co";
const SUPABASE_ANON_KEY = "sb_publishable_Onk9FWmD8HCdud-B8et8dQ_IpBBvrpu";
const BUCKET = "audio-files";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const configured = !SUPABASE_URL.includes("YOUR-PROJECT") &&
  !SUPABASE_ANON_KEY.includes("YOUR_");

const client = configured
  ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
  : null;

const $ = id => document.getElementById(id);
const loginPanel = $("login-panel");
const appPanel = $("app-panel");

let selectedFile = null;
let currentFolder = "";
let searchQuery = "";

function message(id, text, isError = false) {
  const el = $(id);
  if (!el) return;
  el.textContent = text;
  el.style.color = isError ? "#fb7185" : "#fbbf24";
}

function humanSize(bytes = 0) {
  return bytes < 1024 * 1024
    ? `${(bytes / 1024).toFixed(0)} كيلوبايت`
    : `${(bytes / 1024 / 1024).toFixed(2)} ميغابايت`;
}

function safeName(name) {
  return name.normalize("NFKC")
    .replace(/[^\p{L}\p{N}._-]+/gu, "_")
    .slice(-120) || "file";
}

function element(tag, className, text) {
  const el = document.createElement(tag);
  if (className) el.className = className;
  if (text !== undefined) el.textContent = text;
  return el;
}

// واجهة الإدارة الجديدة
function buildInterface() {
  if ($("manager-toolbar")) return;

  const style = element("style");
  style.textContent = `
    #manager-toolbar {
      display:grid; gap:12px; margin:20px 0;
    }
    .manager-actions {
      display:flex; flex-wrap:wrap; gap:9px;
    }
    .manager-actions button {
      padding:11px 15px; border:0; border-radius:12px;
      background:#2563eb; color:white; cursor:pointer;
      font-size:14px;
    }
    .manager-actions .secondary {
      background:#334155;
    }
    #manager-search {
      width:100%; box-sizing:border-box; padding:14px;
      border-radius:12px; border:1px solid #475569;
      background:#172033; color:white; font-size:15px;
    }
    .folder-card,.file-card {
      padding:15px; margin:10px 0; border-radius:14px;
      background:rgba(100,116,139,.12);
      border:1px solid rgba(148,163,184,.2);
      overflow-wrap:anywhere;
    }
    .folder-card {
      display:flex; justify-content:space-between;
      align-items:center; gap:10px; cursor:pointer;
    }
    .folder-title { font-weight:bold; color:#fbbf24; }
    .file-preview {
      width:100%; max-height:300px; object-fit:contain;
      border-radius:12px; margin:12px 0;
    }
    .file-actions {
      display:flex; flex-wrap:wrap; gap:8px; margin-top:12px;
    }
    .file-actions button {
      padding:9px 13px; border:0; border-radius:9px;
      cursor:pointer; background:#2563eb; color:white;
    }
    .file-actions .secondary { background:#475569; }
    .url { font-size:11px; opacity:.7; overflow-wrap:anywhere; margin-top:8px; }
    .manager-path { color:#94a3b8; margin:8px 0; }
  `;
  document.head.appendChild(style);

  const toolbar = element("section");
  toolbar.id = "manager-toolbar";

  const actions = element("div", "manager-actions");

  const imageInput = element("input");
  imageInput.type = "file";
  imageInput.accept = "image/*";
  imageInput.multiple = true;
  imageInput.hidden = true;

  const imageButton = element("button", "", "📷 رفع الصور");
  imageButton.onclick = () => imageInput.click();

  imageInput.onchange = async () => {
    const files = Array.from(imageInput.files || []);
    for (const file of files) {
      if (!file.type.startsWith("image/")) continue;
      if (file.size > MAX_FILE_BYTES) {
        alert(`الصورة ${file.name} أكبر من 25 ميغابايت`);
        continue;
      }
      await uploadFile(file);
    }
    imageInput.value = "";
  };

  const folderButton = element("button", "secondary", "📁 إنشاء مجلد");
  folderButton.onclick = createFolder;

  const backButton = element("button", "secondary", "⬅ رجوع");
  backButton.onclick = () => {
    currentFolder = currentFolder.split("/").slice(0, -1).join("/");
    loadFiles();
  };
  backButton.id = "folder-back";

  const refreshButton = element("button", "secondary", "🔄 تحديث");
  refreshButton.onclick = loadFiles;

  actions.append(imageButton, folderButton, backButton, refreshButton);

  const search = element("input");
  search.id = "manager-search";
  search.placeholder = "🔍 ابحث عن صورة أو ملف صوتي...";
  search.oninput = () => {
    searchQuery = search.value.trim().toLowerCase();
    loadFiles();
  };

  const path = element("div", "manager-path");
  path.id = "manager-path";

  toolbar.append(imageInput, actions, search, path);

  const list = $("files-list");
  if (list) appPanel.insertBefore(toolbar, list);
}

async function showSession(session) {
  loginPanel.classList.toggle("hidden", !!session);
  appPanel.classList.toggle("hidden", !session);
  if (session) {
    buildInterface();
    loadFiles();
  }
}

async function init() {
  if (!configured) {
    message("login-message", "تحقق من إعدادات Supabase.", true);
    return;
  }

  const { data } = await client.auth.getSession();
  showSession(data.session);

  client.auth.onAuthStateChange((_event, session) => {
    showSession(session);
  });
}

$("login-form").addEventListener("submit", async e => {
  e.preventDefault();
  if (!client) return;

  message("login-message", "جارٍ تسجيل الدخول...");

  const { error } = await client.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  
  const { data, error } = await client.auth.signInWithPassword({
    email: $("email").value.trim(),
    password: $("password").value
  });

  if (error) {
    message("login-message", error.message, true);
    return;
  }

  message("login-message", "تم تسجيل الدخول بنجاح.");
  await showSession(data.session);
 

$("logout").addEventListener("click", async () => {
  await client.auth.signOut();
});

$("audio-file").addEventListener("change", e => {
  selectedFile = e.target.files?.[0] || null;
  $("selected-name").textContent = selectedFile
    ? `${selectedFile.name} — ${humanSize(selectedFile.size)}`
    : "لم يتم اختيار ملف";

  $("upload").disabled = !selectedFile;
  message("upload-message", "");
});

$("upload").addEventListener("click", async () => {
  if (!selectedFile) return;

  const ext = selectedFile.name.split(".").pop().toLowerCase();
  if (!["mp3", "wav", "m4a"].includes(ext)) {
    return message("upload-message", "نوع الملف غير مدعوم.", true);
  }

  if (selectedFile.size > MAX_FILE_BYTES) {
    return message("upload-message", "حجم الملف أكبر من 25 ميغابايت.", true);
  }

  $("upload").disabled = true;
  message("upload-message", "جارٍ رفع الملف...");

  const success = await uploadFile(selectedFile);

  $("upload").disabled = false;

  if (success) {
    selectedFile = null;
    $("audio-file").value = "";
    $("selected-name").textContent = "لم يتم اختيار ملف";
    message("upload-message", "تم رفع الملف بنجاح.");
  }
});

async function uploadFile(file) {
  const { data: { user }, error: userError } = await client.auth.getUser();

  if (userError || !user) {
    alert("انتهت الجلسة. سجّل الدخول مجددًا.");
    return false;
  }

  const prefix = currentFolder ? currentFolder + "/" : "";
  const path = `${user.id}/${prefix}${Date.now()}-${crypto.randomUUID()}-${safeName(file.name)}`;

  const { error } = await client.storage.from(BUCKET).upload(
    path,
    file,
    {
      upsert: false,
      contentType: file.type || "application/octet-stream"
    }
  );

  if (error) {
    alert(error.message);
    return false;
  }

  await loadFiles();
  return true;
}

// إنشاء مجلد فعلي داخل التخزين
async function createFolder() {
  const name = prompt("اكتب اسم المجلد الجديد:");
  if (!name || !name.trim()) return;

  const clean = safeName(name.trim());
  const { data: { user } } = await client.auth.getUser();
  if (!user) return;

  const prefix = currentFolder ? currentFolder + "/" : "";
  const folderPath = `${user.id}/${prefix}${clean}/.keep`;

  const { error } = await client.storage.from(BUCKET).upload(
    folderPath,
    new Blob([""], { type: "text/plain" }),
    { upsert: false, contentType: "text/plain" }
  );

  if (error) {
    alert(error.message);
    return;
  }

  await loadFiles();
}

// عرض الملفات والمجلدات
async function loadFiles() {
  if (!client || !appPanel || appPanel.classList.contains("hidden")) return;

  const { data: { user }, error: authError } = await client.auth.getUser();
  if (authError || !user) return;

  const prefix = currentFolder
    ? `${user.id}/${currentFolder}`
    : user.id;

  $("manager-path").textContent = "📁 المجلد الحالي: " + (currentFolder || "الرئيسي");
  $("folder-back").style.display = currentFolder ? "inline-block" : "none";

  const { data, error } = await client.storage.from(BUCKET).list(prefix, {
    limit: 100,
    sortBy: { column: "created_at", order: "desc" }
  });

  const list = $("files-list");
  list.replaceChildren();

  if (error) {
    list.textContent = error.message;
    return;
  }

  const entries = data || [];

  const folders = entries.filter(f => f.id === null && f.name !== ".keep");
  const files = entries.filter(f => f.id !== null && f.name !== ".keep");

  let visibleCount = 0;

  for (const folder of folders) {
    if (searchQuery && !folder.name.toLowerCase().includes(searchQuery)) continue;

    const card = element("div", "folder-card");
    const title = element("span", "folder-title", "📁 " + folder.name);
    const open = element("button", "secondary", "فتح");
    open.onclick = () => {
      currentFolder = currentFolder
        ? currentFolder + "/" + folder.name
        : folder.name;
      loadFiles();
    };

    card.onclick = () => open.click();
    card.append(title, open);
    list.append(card);
    visibleCount++;
  }

  for (const file of files) {
    const displayName = file.name.replace(/^\d+-[0-9a-f-]+-/i, "");

    if (searchQuery && !displayName.toLowerCase().includes(searchQuery)) continue;

    const path = `${prefix}/${file.name}`;
    const { data: { publicUrl } } = client.storage.from(BUCKET).getPublicUrl(path);

    const card = element("article", "file-card");
    const top = element("div", "file-top");
    const name = element("div", "file-name", displayName);
    const meta = element("div", "file-meta", humanSize(file.metadata?.size || 0));

    top.append(name, meta);
    card.append(top);

    const ext = displayName.split(".").pop().toLowerCase();
    const isImage = file.metadata?.mimetype?.startsWith("image/") ||
      ["jpg", "jpeg", "png", "gif", "webp", "svg", "avif"].includes(ext);

    if (isImage) {
      const preview = element("img", "file-preview");
      preview.src = publicUrl;
      preview.alt = displayName;
      preview.loading = "lazy";
      card.append(preview);
    } else if (["mp3", "wav", "m4a", "ogg"].includes(ext)) {
      const audio = element("audio");
      audio.controls = true;
      audio.preload = "none";
      audio.src = publicUrl;
      audio.style.width = "100%";
      audio.style.marginTop = "12px";
      card.append(audio);
    }

    const url = element("div", "url", publicUrl);
    const actions = element("div", "file-actions");

    const copy = element("button", "", "نسخ الرابط");
    copy.onclick = async () => {
      try {
        await navigator.clipboard.writeText(publicUrl);
        copy.textContent = "تم النسخ ✓";
        setTimeout(() => copy.textContent = "نسخ الرابط", 1600);
      } catch {
        alert("تعذر النسخ. افتح الرابط وانسخه يدويًا.");
      }
    };

    const open = element("button", "secondary", "فتح الرابط");
    open.onclick = () => window.open(publicUrl, "_blank", "noopener");

    const del = element("button", "secondary", "حذف");
    del.onclick = async () => {
      if (!confirm("هل أنت متأكد من حذف هذا الملف؟")) return;

      const { error } = await client.storage.from(BUCKET).remove([path]);
      if (error) alert(error.message);
      else loadFiles();
    };

    actions.append(copy, open, del);
    card.append(url, actions);
    list.append(card);
    visibleCount++;
  }

  if (!visibleCount) {
    list.append(element("p", "muted",
      searchQuery ? "لا توجد نتائج للبحث." : "هذا المجلد فارغ. ارفع ملفًا أو أنشئ مجلدًا جديدًا."
    ));
  }
}

$("refresh").addEventListener("click", loadFiles);

init();
