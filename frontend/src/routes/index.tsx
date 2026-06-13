import { useEffect } from "react";
import { Routes, Route, useNavigate, useLocation } from "react-router";
import { useAppContext } from "../context/AppContext";
import RootLayout from "../layouts/RootLayout";
import RepoSelectPage from "../pages/RepoSelect";
import RepoPage from "../pages/Repo";
import DryRunPage from "../pages/DryRun";
import ApplyPage from "../pages/Apply";
import AboutPage from "../pages/About";

export default function AppRoutes() {
  const { repoPath } = useAppContext();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      !repoPath &&
      location.pathname !== "/" &&
      location.pathname !== "/about"
    ) {
      navigate("/");
    }
  }, [repoPath, location.pathname, navigate]);

  return (
    <Routes>
      <Route element={<RootLayout />}>
        <Route path="/" element={<RepoSelectPage />} />
        <Route path="/repo" element={<RepoPage />} />
        <Route path="/dry-run" element={<DryRunPage />} />
        <Route path="/apply" element={<ApplyPage />} />
        <Route path="/about" element={<AboutPage />} />
      </Route>
    </Routes>
  );
}
