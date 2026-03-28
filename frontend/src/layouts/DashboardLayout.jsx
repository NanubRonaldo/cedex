import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

export default function DashboardLayout({ title, children }) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar />
      </aside>

      <main className="app-shell__main">
        <Navbar />

        <div className="app-shell__header">
          <h2 className="app-shell__title">{title}</h2>
        </div>

        <div className="app-shell__grid">
          {children}
        </div>
      </main>
    </div>
  );
}
