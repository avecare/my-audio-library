// 1) ضعي بيانات مشروع Supabase هنا بعد إنشاء المشروع.
const SUPABASE_URL = "https://YOUR-PROJECT.supabase.co";
const SUPABASE_ANON_KEY = "YOUR_SUPABASE_ANON_KEY";
const BUCKET = "audio-files";
const MAX_FILE_BYTES = 25 * 1024 * 1024;

const configured = !SUPABASE_URL.includes("YOUR-PROJECT") && !SUPABASE_ANON_KEY.includes("YOUR_");
const client = configured ? window.supabase.createClient(SUPABASE_URL, SUPABASE_ANON_KEY) : null;

const $ = (id) => document.getElementById(id);
const loginPanel = $("login-panel"), appPanel = $("app-panel");
let selectedFile = null;

function message(id, text, isError=false) {
  const el = $(id); el.textContent = text; el.style.color = isError ? "#fb7185" : "#fbbf24";
}
function humanSize(bytes) {
  return bytes < 1024*1024 ? `${(bytes/1024).toFixed(0)} كيلوبايت` : `${(bytes/1024/1024).toFixed(2)} ميغابايت`;
}
function safeName(name) {
  return name.normalize("NFKC").replace(/[^\p{L}\p{N}._-]+/gu, "_").slice(-120) || "audio.mp3";
}
function showSession(session) {
  loginPanel.classList.toggle("hidden", !!session);
  appPanel.classList.toggle("hidden", !session);
  if (session) loadFiles();
}
async function init() {
  if (!configured) {
    message("login-message", "أضيفي رابط Supabase ومفتاح anon في ملف app.js أولًا.", true);
    return;
  }
  const { data } = await client.auth.getSession();
  showSession(data.session);
  client.auth.onAuthStateChange((_event, session) => showSession(session));
}
$("login-form").addEventListener("submit", async (e) => {
  e.preventDefault();
  if (!client) return;
  message("login-message", "جارٍ تسجيل الدخول...");
  const { error } = await client.auth.signInWithPassword({email:$("email").value.trim(), password:$("password").value});
  message("login-message", error ? error.message : "تم تسجيل الدخول.");
  if (error) message("login-message", error.message, true);
});
$("logout").addEventListener("click", async () => { await client.auth.signOut(); });
$("audio-file").addEventListener("change", (e) => {
  selectedFile = e.target.files?.[0] || null;
  $("selected-name").textContent = selectedFile ? `${selectedFile.name} — ${humanSize(selectedFile.size)}` : "لم يتم اختيار ملف";
  $("upload").disabled = !selectedFile;
  message("upload-message", "");
});
$("upload").addEventListener("click", async () => {
  if (!selectedFile || !client) return;
  const ext = selectedFile.name.split(".").pop().toLowerCase();
  if (!["mp3","wav","m4a"].includes(ext)) return message("upload-message","نوع الملف غير مدعوم.",true);
  if (selectedFile.size > MAX_FILE_BYTES) return message("upload-message","حجم الملف أكبر من 25 ميغابايت.",true);
  $("upload").disabled = true;
  message("upload-message","جارٍ رفع الملف...");
  const { data:{user}, error:userError } = await client.auth.getUser();
  if (userError || !user) { $("upload").disabled=false; return message("upload-message","انتهت الجلسة. سجّلي الدخول مجددًا.",true); }
  const path = `${user.id}/${Date.now()}-${crypto.randomUUID()}-${safeName(selectedFile.name)}`;
  const { error } = await client.storage.from(BUCKET).upload(path, selectedFile, { upsert:false, contentType:selectedFile.type || "application/octet-stream" });
  $("upload").disabled = false;
  if (error) return message("upload-message",error.message,true);
  selectedFile = null; $("audio-file").value=""; $("selected-name").textContent="لم يتم اختيار ملف";
  message("upload-message","تم رفع الملف بنجاح.");
  loadFiles();
});
$("refresh").addEventListener("click", loadFiles);

async function loadFiles() {
  const { data:{user} } = await client.auth.getUser();
  if (!user) return;
  const { data, error } = await client.storage.from(BUCKET).list(user.id,{limit:100,sortBy:{column:"created_at",order:"desc"}});
  const list = $("files-list"); list.innerHTML="";
  if (error) { list.textContent=error.message; return; }
  const files = (data || []).filter(f => f.name && !f.name.endsWith("/"));
  if (!files.length) { list.innerHTML='<p class="muted">لا توجد ملفات بعد. ارفعي أول تسجيل صوتي.</p>'; return; }
  for (const file of files) {
    const path = `${user.id}/${file.name}`;
    const { data:{publicUrl} } = client.storage.from(BUCKET).getPublicUrl(path);
    const card=document.createElement("article"); card.className="file-card";
    const top=document.createElement("div"); top.className="file-top";
    const name=document.createElement("div"); name.className="file-name"; name.textContent=file.name.replace(/^\d+-[0-9a-f-]+-/i,"");
    const meta=document.createElement("div"); meta.className="file-meta"; meta.textContent=humanSize(file.metadata?.size || 0);
    top.append(name,meta);
    const audio=document.createElement("audio"); audio.controls=true; audio.preload="none"; audio.src=publicUrl;
    const url=document.createElement("div"); url.className="url"; url.textContent=publicUrl;
    const actions=document.createElement("div"); actions.className="file-actions";
    const copy=document.createElement("button"); copy.textContent="نسخ الرابط"; copy.onclick=async()=>{await navigator.clipboard.writeText(publicUrl);copy.textContent="تم النسخ ✓";setTimeout(()=>copy.textContent="نسخ الرابط",1600)};
    const open=document.createElement("button"); open.className="secondary"; open.textContent="فتح الرابط"; open.onclick=()=>window.open(publicUrl,"_blank","noopener");
    const del=document.createElement("button"); del.className="secondary"; del.textContent="حذف"; del.onclick=async()=>{if(!confirm("متأكدة من حذف هذا الملف؟"))return;const {error}=await client.storage.from(BUCKET).remove([path]);if(error)alert(error.message);else loadFiles()};
    actions.append(copy,open,del); card.append(top,audio,url,actions); list.append(card);
  }
}
init();
