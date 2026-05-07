// App.tsx
import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import SkeletonReaction from "./components/SkeletonReaction";
import ConnectionBanner from "./components/ConnectionBanner";

const { BASE_URL } = import.meta.env;

const Reaction = lazy(() => import("./pages/reaction/Reaction"));
const Product = lazy(() => import("./pages/product/Product"));
const Survey = lazy(() => import("./pages/survey/Survey"));
const NotFound = lazy(() => import("./pages/notfound/NotFound"));

const App = () => {
  return (
    <BrowserRouter basename={BASE_URL}>
      <ConnectionBanner />
      <Suspense fallback={<SkeletonReaction />}>
        <Routes>
          <Route path="/" element={<Reaction />} />
          <Route path="/product" element={<Product />} />
          <Route path="/survey" element={<Survey />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </Suspense>
    </BrowserRouter>
  );
};

export default App;