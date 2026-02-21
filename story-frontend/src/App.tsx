import { Routes, Route } from "react-router-dom";
import { AppShell } from "@/components/layout/app-shell";
import Library from "@/pages/library";
import BookReader from "@/pages/book-reader";
import VoiceManager from "@/pages/voice-manager";

export default function App() {
  return (
    <Routes>
      <Route element={<AppShell />}>
        <Route path="/" element={<Library />} />
        <Route path="/books/:bookId" element={<BookReader />} />
        <Route path="/voices" element={<VoiceManager />} />
      </Route>
    </Routes>
  );
}
