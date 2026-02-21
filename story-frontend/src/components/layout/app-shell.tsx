import { Outlet } from "react-router-dom";
import { Header } from "./header";
import { AudioPlayerBar } from "./audio-player-bar";

export function AppShell() {
  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-6 pb-24">
        <Outlet />
      </main>
      <AudioPlayerBar />
    </div>
  );
}
