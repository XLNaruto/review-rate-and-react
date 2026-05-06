// App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";

const { BASE_URL } = import.meta.env;

// Lazy-loaded page components
const Reaction = lazy(() => import("./pages/reaction/Reaction"));

// Fallback shown while lazy chunks are loading
function PageLoader() {
  return (
    <div style={{ display: "grid", placeItems: "center", height: "100vh" }}>
      <p>Loading…</p>
    </div>
  );
}

const App = () => {
  return (
    <BrowserRouter basename={BASE_URL}>
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<Reaction />} />
          {/* <Route path="*" element={<NotFound />} /> */}
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;