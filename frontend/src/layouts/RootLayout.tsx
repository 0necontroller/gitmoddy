import { Outlet } from "react-router";
import TopBar from "../components/TopBar";

export default function RootLayout() {
  return (
    <div className="flex flex-col h-screen bg-[#1e1f22] text-[#e8e8ea] overflow-hidden">
      {/* ── Top Bar ── */}
      <TopBar />

      {/* ── Body ── */}
      <div className="flex flex-1 min-h-0 overflow-hidden">
        <Outlet />
      </div>
    </div>
  );
}
