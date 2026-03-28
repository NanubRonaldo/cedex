import Navbar from "../components/common/Navbar";
import Sidebar from "../components/common/Sidebar";

export default function MainLayout({ children }) {
  return (
    <div className="app-shell">
      <aside className="app-shell__sidebar">
        <Sidebar />
      </aside>

      <main className="app-shell__main">
        <Navbar />
        <div className="app-shell__content">
          {children}
        </div>
      </main>
    </div>
  );
}
