// App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { Toaster } from "sonner";
import SkeletonReaction from "./components/SkeletonReaction";
import ConnectionBanner from "./components/ConnectionBanner";
import Footer from "./components/Footer";

const { BASE_URL } = import.meta.env;

const ScanQr = lazy(() => import("./pages/scanqr/ScanQr"));
const NotFound = lazy(() => import("./pages/notfound/NotFound"));

const App = () => {
  return (
    <BrowserRouter basename={BASE_URL}>
      <Toaster position="top-center" richColors />
      <ConnectionBanner />
      <div className="min-h-dvh flex flex-col">
        <Suspense fallback={<SkeletonReaction />}>
          <main className="flex-1">
            <Routes>
              <Route path="/:slug" element={<ScanQr />} />
              <Route path="*" element={<NotFound />} />
            </Routes>
          </main>
          <Footer />
        </Suspense>
      </div>
    </BrowserRouter>
  );
};

export default App;
