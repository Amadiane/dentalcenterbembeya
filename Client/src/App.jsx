import { Routes, Route } from "react-router-dom";
import ProtectedRoute from "./routes/ProtectedRoute";
import DashboardLayout from "./layouts/DashboardLayout";

import Connexion from "./pages/auth/Connexion";
import TableauDeBord from "./pages/dashboard/TableauDeBord";
import ListePatients from "./pages/patients/ListePatients";
import FormulairePatient from "./pages/patients/FormulairePatient";
import FichePatient from "./pages/patients/FichePatient";
import HistoriquePatient from "./pages/patients/HistoriquePatient";
import PatientsArchives from "./pages/patients/PatientsArchives";
// import AgendaRendezVous from "./pages/rendezvous/AgendaRendezVous";
// import FormulaireRendezVous from "./pages/rendezvous/FormulaireRendezVous";

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
        <Route path="/" element={<TableauDeBord />} />

        <Route path="/patients" element={<ListePatients />} />
        <Route path="/patients/nouveau" element={<FormulairePatient />} />
        <Route path="/patients/archives" element={<PatientsArchives />} />
        <Route path="/patients/:id" element={<FichePatient />} />
        <Route path="/patients/:id/modifier" element={<FormulairePatient />} />
        <Route path="/patients/:id/historique" element={<HistoriquePatient />} />

        {/* <Route path="/rendez-vous" element={<AgendaRendezVous />} />
        <Route path="/rendez-vous/nouveau" element={<FormulaireRendezVous />} />
        <Route path="/rendez-vous/:id/modifier" element={<FormulaireRendezVous />} /> */}
      </Route>
    </Routes>
  );
}