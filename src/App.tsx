import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from '@/auth/AuthProvider';
import { PatientLayout } from '@/layouts/PatientLayout';
import { DoctorLayout } from '@/layouts/DoctorLayout';
import { Auth } from '@/pages/Auth';
import { Home } from '@/pages/patient/Home';
import { Triage } from '@/pages/patient/Triage';
import { TriageResult } from '@/pages/patient/TriageResult';
import { AiChat } from '@/pages/patient/AiChat';
import { Documents } from '@/pages/patient/Documents';
import { DocumentDetail } from '@/pages/patient/DocumentDetail';
import { DocumentNew } from '@/pages/patient/DocumentNew';
import { Doctors } from '@/pages/patient/Doctors';
import { DoctorDetail } from '@/pages/patient/DoctorDetail';
import { DoctorChat } from '@/pages/patient/DoctorChat';
import { DoctorBook } from '@/pages/patient/DoctorBook';
import { HouseCall } from '@/pages/patient/HouseCall';
import { Treatment } from '@/pages/patient/Treatment';
import { Labs } from '@/pages/patient/Labs';
import { Notifications } from '@/pages/patient/Notifications';
import { Support } from '@/pages/patient/Support';
import { Profile } from '@/pages/patient/Profile';
import { ProfileEdit } from '@/pages/patient/ProfileEdit';
import { Desk } from '@/pages/doctor/Desk';
import { Calendar } from '@/pages/doctor/Calendar';
import { EventDetail } from '@/pages/doctor/EventDetail';
import { Patients } from '@/pages/doctor/Patients';
import { PatientDetail } from '@/pages/doctor/PatientDetail';
import { PatientChat } from '@/pages/doctor/PatientChat';
import { DoctorProfile } from '@/pages/doctor/DoctorProfile';
import { Notifications as DoctorNotifications } from '@/pages/doctor/Notifications';

export default function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/" element={<Navigate to="/auth" replace />} />
        <Route path="/auth" element={<Auth />} />

        <Route path="/patient" element={<PatientLayout />}>
          <Route index element={<Home />} />
          <Route path="triage" element={<Triage />} />
          <Route path="triage/result" element={<TriageResult />} />
          <Route path="ai-chat" element={<AiChat />} />

          <Route path="documents" element={<Documents />}>
            <Route path=":id" element={<DocumentDetail />} />
          </Route>
          <Route path="documents/new" element={<DocumentNew />} />

          <Route path="doctors" element={<Doctors />} />
          <Route path="doctors/:id" element={<DoctorDetail />} />
          <Route path="doctors/:id/chat" element={<DoctorChat />} />
          <Route path="doctors/:id/book" element={<DoctorBook />} />

          <Route path="house-call" element={<HouseCall />} />
          <Route path="treatment" element={<Treatment />} />
          <Route path="labs" element={<Labs />} />

          <Route path="notifications" element={<Notifications />} />
          <Route path="support" element={<Support />} />
          <Route path="profile" element={<Profile />} />
          <Route path="profile/edit" element={<ProfileEdit />} />
        </Route>

        <Route path="/doctor" element={<DoctorLayout />}>
          <Route index element={<Desk />} />

          <Route path="calendar" element={<Calendar />}>
            <Route path=":patientId" element={<EventDetail />} />
          </Route>

          <Route path="patients" element={<Patients />} />
          <Route path="patients/:patientId" element={<PatientDetail />} />
          <Route path="patients/:patientId/chat" element={<PatientChat />} />

          <Route path="notifications" element={<DoctorNotifications />} />
          <Route path="profile" element={<DoctorProfile />} />
        </Route>

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </AuthProvider>
  );
}
