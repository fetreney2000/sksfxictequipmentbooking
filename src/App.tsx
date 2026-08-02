import { Route, Routes } from 'react-router-dom'
import { PublicLayout } from '@/layouts/PublicLayout'
import { AdminLayout } from '@/layouts/AdminLayout'
import { RequireAuth, RequireRole } from '@/components/RequireAuth'
import { PublicWizardPage } from '@/features/public-pinjaman/PublicWizardPage'
import { BerjayaPage } from '@/features/public-pinjaman/BerjayaPage'
import { LoginPage } from '@/features/auth/LoginPage'
import { DashboardPage } from '@/features/admin-dashboard/DashboardPage'
import { PermohonanPage } from '@/features/admin-permohonan/PermohonanPage'
import { PermohonanDetailPage } from '@/features/admin-permohonan/PermohonanDetailPage'
import { LaporanPage } from '@/features/admin-laporan/LaporanPage'
import { GuruPage } from '@/features/admin-guru/GuruPage'
import { PenggunaPage } from '@/features/admin-pengguna/PenggunaPage'
import { ProfilPage } from '@/features/admin-profil/ProfilPage'

function App() {
  return (
    <Routes>
      <Route element={<PublicLayout />}>
        <Route path="/" element={<PublicWizardPage />} />
        <Route path="/pinjam" element={<PublicWizardPage />} />
        <Route path="/pinjam/berjaya" element={<BerjayaPage />} />
      </Route>

      <Route path="/admin/login" element={<LoginPage />} />

      <Route
        path="/admin"
        element={
          <RequireAuth>
            <AdminLayout />
          </RequireAuth>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="permohonan" element={<PermohonanPage />} />
        <Route path="permohonan/:id" element={<PermohonanDetailPage />} />
        <Route path="laporan" element={<LaporanPage />} />
        <Route
          path="guru"
          element={
            <RequireRole role="admin">
              <GuruPage />
            </RequireRole>
          }
        />
        <Route
          path="pengguna"
          element={
            <RequireRole role="admin">
              <PenggunaPage />
            </RequireRole>
          }
        />
        <Route path="profil" element={<ProfilPage />} />
      </Route>

      <Route path="*" element={<PublicWizardPage />} />
    </Routes>
  )
}

export default App
