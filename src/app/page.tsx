import { Dashboard } from "@/src/components/Dashboard";

/**
 * 首頁：Server Component（靜態外框/標題）。
 *
 * 互動部分收斂在 <Dashboard />（client 島）。標題與版面外框留在 Server，
 * 不送多餘 JS 到瀏覽器。詳見 IMPLEMENTATION_PROGRESS_LOG.md 島嶼架構說明。
 */
export default function HomePage() {
  return (
    <main style={styles.main}>
      <header style={styles.header}>
        <h1 style={styles.title}>Iceland Insight</h1>
        <p style={styles.subtitle}>即時冰島天氣與路況（最小版）</p>
      </header>

      <Dashboard />
    </main>
  );
}

const styles: Record<string, React.CSSProperties> = {
  main: {
    maxWidth: 960,
    margin: "0 auto",
    padding: "32px 20px 64px",
  },
  header: { marginBottom: 24 },
  title: { fontSize: 28, margin: 0, color: "#fff" },
  subtitle: { margin: "4px 0 0", color: "#8a9bb3", fontSize: 14 },
};
