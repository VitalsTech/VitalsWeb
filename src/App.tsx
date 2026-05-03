import { Navigate, Route, Routes } from 'react-router-dom';
import { DoctorLayout } from './layouts/DoctorLayout';
import { OrgLayout } from './layouts/OrgLayout';
import { PatientLayout } from './layouts/PatientLayout';
import { Landing } from './pages/Landing';
import { PatientAuth } from './pages/patient/PatientAuth';
import { PatientDoctorDetail } from './pages/patient/PatientDoctorDetail';
import { PatientDocuments } from './pages/patient/PatientDocuments';
import { PatientDoctors } from './pages/patient/PatientDoctors';
import { PatientHome } from './pages/patient/PatientHome';
import { PatientNotifications } from './pages/patient/PatientNotifications';
import { PatientProfile } from './pages/patient/PatientProfile';
import { PatientSupport } from './pages/patient/PatientSupport';
import { PatientTriage } from './pages/patient/PatientTriage';
import { DoctorDesk } from './pages/doctor/DoctorDesk';
import { DoctorPatients } from './pages/doctor/DoctorPatients';
import { DoctorProfile } from './pages/doctor/DoctorProfile';
import {
  ClinicBilling,
  ClinicDashboard,
  ClinicDepartments,
  ClinicDoctorsHr,
  ClinicIntegrations,
  ClinicPartners,
  ClinicPatientsRegistry,
  ClinicQuality,
  ClinicSchedule,
  ClinicSettings,
} from './pages/org/clinicPages';
import {
  LabBilling,
  LabCatalog,
  LabDashboard,
  LabFieldServices,
  LabIntegrations,
  LabLocations,
  LabOrders,
  LabQuality,
  LabReferrals,
  LabSettings,
  LabStaff,
} from './pages/org/labPages';
import {
  PharmacyAudit,
  PharmacyBilling,
  PharmacyDashboard,
  PharmacyDelivery,
  PharmacyIntegrations,
  PharmacyInventory,
  PharmacyLocations,
  PharmacyOrders,
  PharmacyPrescriptions,
  PharmacySettings,
  PharmacyStaff,
} from './pages/org/pharmacyPages';

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<Landing />} />

      <Route path="/patient/auth" element={<PatientAuth />} />

      <Route path="/patient" element={<PatientLayout />}>
        <Route index element={<PatientHome />} />
        <Route path="triage" element={<PatientTriage />} />
        <Route path="documents" element={<PatientDocuments />} />
        <Route path="doctors" element={<PatientDoctors />} />
        <Route path="doctors/:id" element={<PatientDoctorDetail />} />
        <Route path="notifications" element={<PatientNotifications />} />
        <Route path="support" element={<PatientSupport />} />
        <Route path="profile" element={<PatientProfile />} />
      </Route>

      <Route path="/doctor" element={<DoctorLayout />}>
        <Route index element={<DoctorDesk />} />
        <Route path="profile" element={<DoctorProfile />} />
        <Route path="patients" element={<DoctorPatients />} />
      </Route>

      <Route path="/org/clinic" element={<OrgLayout kind="clinic" />}>
        <Route index element={<ClinicDashboard />} />
        <Route path="departments" element={<ClinicDepartments />} />
        <Route path="doctors" element={<ClinicDoctorsHr />} />
        <Route path="schedule" element={<ClinicSchedule />} />
        <Route path="patients" element={<ClinicPatientsRegistry />} />
        <Route path="integrations" element={<ClinicIntegrations />} />
        <Route path="billing" element={<ClinicBilling />} />
        <Route path="quality" element={<ClinicQuality />} />
        <Route path="settings" element={<ClinicSettings />} />
        <Route path="partners" element={<ClinicPartners />} />
      </Route>

      <Route path="/org/pharmacy" element={<OrgLayout kind="pharmacy" />}>
        <Route index element={<PharmacyDashboard />} />
        <Route path="orders" element={<PharmacyOrders />} />
        <Route path="inventory" element={<PharmacyInventory />} />
        <Route path="prescriptions" element={<PharmacyPrescriptions />} />
        <Route path="locations" element={<PharmacyLocations />} />
        <Route path="staff" element={<PharmacyStaff />} />
        <Route path="integrations" element={<PharmacyIntegrations />} />
        <Route path="billing" element={<PharmacyBilling />} />
        <Route path="quality" element={<PharmacyAudit />} />
        <Route path="settings" element={<PharmacySettings />} />
        <Route path="delivery" element={<PharmacyDelivery />} />
      </Route>

      <Route path="/org/lab" element={<OrgLayout kind="lab" />}>
        <Route index element={<LabDashboard />} />
        <Route path="orders" element={<LabOrders />} />
        <Route path="catalog" element={<LabCatalog />} />
        <Route path="referrals" element={<LabReferrals />} />
        <Route path="locations" element={<LabLocations />} />
        <Route path="staff" element={<LabStaff />} />
        <Route path="integrations" element={<LabIntegrations />} />
        <Route path="billing" element={<LabBilling />} />
        <Route path="quality" element={<LabQuality />} />
        <Route path="settings" element={<LabSettings />} />
        <Route path="field" element={<LabFieldServices />} />
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}
