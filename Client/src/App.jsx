import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";
import Connexion from "./pages/auth/Connexion";
import Accueil from "./pages/Accueil";
import ListePatients from "./pages/patients/ListePatients";
import FormulairePatient from "./pages/patients/FormulairePatient";

export default function App() {
  return (
    <Routes>
      <Route path="/connexion" element={<Connexion />} />

      <Route
        element={
          <ProtectedRoute>
            <DashboardLayout />
          </ProtectedRoute>
        }
      >
        <Route path="/" element={<Accueil />} />
        <Route path="/patients" element={<ListePatients />} />
        <Route path="/patients/nouveau" element={<FormulairePatient />} />
        <Route path="/patients/:id" element={<FormulairePatient />} />
      </Route>
    </Routes>
  );
}