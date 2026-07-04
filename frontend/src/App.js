import "@/App.css";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import Landing from "./pages/Landing";
import Builder from "./pages/Builder";
import InvitationPage from "./pages/InvitationPage";

function App() {
  return (
    <BrowserRouter>
      <Toaster position="top-center" richColors />
      <Routes>
        <Route path="/" element={<Landing />} />
        <Route path="/crear" element={<Builder />} />
        <Route path="/editar/:id/:token" element={<Builder editMode />} />
        <Route path="/i/:id" element={<InvitationPage />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
