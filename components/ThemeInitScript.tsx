const THEME_CACHE_KEY = "webedit-css-theme-v1";
const CUSTOM_THEMES_KEY = "webedit-css-custom-themes-v1";

const THEMES: Record<
  string,
  {
    pageTop: string;
    pageBottom: string;
    surface: string;
    surfaceMuted: string;
    heading: string;
    text: string;
    muted: string;
    accent: string;
    border: string;
    radius: number;
    textAlign: "left" | "center" | "right";
    sectionGap: number;
    sectionOffset: number;
    fontScale: number;
    fontSize: number;
    lineHeight: number;
    contentWidth: number;
  }
> = {
  midnight: {
    pageTop: "#000000",
    pageBottom: "#000000",
    surface: "#000000",
    surfaceMuted: "#000000",
    heading: "#ffffff",
    text: "#ffffff",
    muted: "#ffffff",
    accent: "#ffffff",
    border: "#d4d4d8",
    radius: 18,
    textAlign: "center",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    fontSize: 16,
    lineHeight: 1.6,
    contentWidth: 48,
  },
  paper: {
    pageTop: "#f8fafc",
    pageBottom: "#e2e8f0",
    surface: "#ffffff",
    surfaceMuted: "#f1f5f9",
    heading: "#000000",
    text: "#000000",
    muted: "#000000",
    accent: "#0ea5e9",
    border: "#cbd5e1",
    radius: 14,
    textAlign: "center",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    fontSize: 16,
    lineHeight: 1.6,
    contentWidth: 48,
  },
  sunset: {
    pageTop: "#2d132c",
    pageBottom: "#120f2b",
    surface: "#3d1a34",
    surfaceMuted: "#4a1f3e",
    heading: "#fff7ed",
    text: "#ffe7d4",
    muted: "#f9b997",
    accent: "#fb7185",
    border: "#69395f",
    radius: 20,
    textAlign: "center",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    fontSize: 16,
    lineHeight: 1.6,
    contentWidth: 48,
  },
  neon: {
    pageTop: "#000000",
    pageBottom: "#000000",
    surface: "#000000",
    surfaceMuted: "#050a05",
    heading: "#b7ffbf",
    text: "#39ff14",
    muted: "#00c853",
    accent: "#39ff14",
    border: "#1b5e20",
    radius: 16,
    textAlign: "center",
    sectionGap: 24,
    sectionOffset: 16,
    fontScale: 1,
    fontSize: 16,
    lineHeight: 1.6,
    contentWidth: 48,
  },
};

function getInitScript() {
  return `(function(){try{
    var root=document.documentElement;
    var themeId=localStorage.getItem(${JSON.stringify(THEME_CACHE_KEY)})||"";
    if(!themeId) return;
    var theme=null;
    if(themeId.indexOf("custom:")===0){
      var id=themeId.slice(7);
      var raw=localStorage.getItem(${JSON.stringify(CUSTOM_THEMES_KEY)})||"";
      if(raw){
        var parsed=JSON.parse(raw);
        if(parsed && typeof parsed==="object" && parsed[id] && typeof parsed[id]==="object"){
          theme=parsed[id];
        }
      }
    } else {
      theme=${JSON.stringify(THEMES)}[themeId]||null;
    }
    if(!theme) return;
    root.setAttribute("data-text-align", theme.textAlign||"center");
    root.style.setProperty("--page-top", theme.pageTop||"");
    root.style.setProperty("--page-bottom", theme.pageBottom||"");
    root.style.setProperty("--surface", theme.surface||"");
    root.style.setProperty("--surface-muted", theme.surfaceMuted||"");
    root.style.setProperty("--foreground", theme.text||"");
    root.style.setProperty("--foreground-soft", theme.muted||"");
    root.style.setProperty("--accent", theme.accent||"");
    root.style.setProperty("--accent-strong", theme.heading||"");
    root.style.setProperty("--border", theme.border||"");
    if(typeof theme.radius==="number") root.style.setProperty("--radius", theme.radius+"px");
    root.style.setProperty("--text-align", theme.textAlign||"center");
    if(typeof theme.sectionGap==="number") root.style.setProperty("--section-gap", theme.sectionGap+"px");
    if(typeof theme.sectionOffset==="number") root.style.setProperty("--section-offset", theme.sectionOffset+"px");
    if(typeof theme.fontScale==="number") root.style.setProperty("--font-scale", String(theme.fontScale));
    if(typeof theme.fontSize==="number") root.style.setProperty("--font-size", theme.fontSize+"px");
    if(typeof theme.lineHeight==="number") root.style.setProperty("--line-height", String(theme.lineHeight));
    if(typeof theme.contentWidth==="number") root.style.setProperty("--content-width", theme.contentWidth+"rem");
  }catch(e){}})();`;
}

export default function ThemeInitScript() {
  return (
    <script id="theme-init" dangerouslySetInnerHTML={{ __html: getInitScript() }} />
  );
}
