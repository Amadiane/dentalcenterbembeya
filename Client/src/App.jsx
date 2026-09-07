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
import AgendaRendezVous from "./pages/rendezvous/AgendaRendezVous";
import FormulaireRendezVous from "./pages/rendezvous/FormulaireRendezVous";
import VoirRendezVous from "./pages/rendezvous/VoirRendezVous";
import HistoriqueRendezVous from "./pages/rendezvous/HistoriqueRendezVous";
import CatalogueActes from "./pages/actes/CatalogueActes";
import FormulaireActe from "./pages/actes/FormulaireActe";
import ListeFactures from "./pages/facturation/ListeFactures";
import FormulaireFacture from "./pages/facturation/FormulaireFacture";
import DetailFacture from "./pages/facturation/DetailFacture";
import HistoriqueFacture from "./pages/facturation/HistoriqueFacture";
import ListePersonnel from "./pages/personnel/ListePersonnel";
import FormulairePersonnel from "./pages/personnel/FormulairePersonnel";


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
        <Route path="/rendez-vous" element={<AgendaRendezVous />} />        
        <Route path="/rendez-vous/nouveau" element={<FormulaireRendezVous />} />
        <Route path="/rendez-vous/:id/modifier" element={<FormulaireRendezVous />} />
        <Route path="/rendez-vous/:id" element={<VoirRendezVous />} />
        <Route path="/rendez-vous/:id/modifier" element={<FormulaireRendezVous />} />
        <Route path="/rendez-vous/:id/historique" element={<HistoriqueRendezVous />} />
        <Route path="/actes" element={<CatalogueActes />} />
        <Route path="/actes/nouveau" element={<FormulaireActe />} />
        <Route path="/actes/:id/modifier" element={<FormulaireActe />} />
        <Route path="/facturation" element={<ListeFactures />} />
        <Route path="/facturation/nouvelle" element={<FormulaireFacture />} />
        <Route path="/facturation/:id/modifier" element={<FormulaireFacture />} />
        <Route path="/facturation/:id" element={<DetailFacture />} />
        <Route path="/facturation/:id/historique" element={<HistoriqueFacture />} />

        <Route path="/personnel" element={<ListePersonnel />} />
        <Route path="/personnel/nouveau" element={<FormulairePersonnel />} />
        <Route path="/personnel/:id/modifier" element={<FormulairePersonnel />} />


      </Route>
    </Routes>
  );
}