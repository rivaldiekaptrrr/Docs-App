import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Projects from './pages/Projects';
import ProjectDetail from './pages/ProjectDetail';
import Logbook from './pages/Logbook';
import Errors from './pages/Errors';
import DocumentationDetail from './pages/DocumentationDetail';
import UserManagement from './pages/UserManagement';
import ProjectAccess from './pages/ProjectAccess';
import ActivityLogs from './pages/ActivityLogs';
import SystemSettings from './pages/SystemSettings';
import './index.css';

function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/" element={
            <PrivateRoute>
              <Layout>
                <Dashboard />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/projects" element={
            <PrivateRoute>
              <Layout>
                <Projects />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/projects/:id" element={
            <PrivateRoute>
              <Layout>
                <ProjectDetail />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/projects/:projectId/documentation/new" element={
            <PrivateRoute>
              <Layout>
                <DocumentationDetail isNew={true} />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/projects/:projectId/documentation/:docId" element={
            <PrivateRoute>
              <Layout>
                <DocumentationDetail />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/logbook" element={
            <PrivateRoute>
              <Layout>
                <Logbook />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/errors" element={
            <PrivateRoute>
              <Layout>
                <Errors />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings/users" element={
            <PrivateRoute>
              <Layout>
                <UserManagement />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings/project-access" element={
            <PrivateRoute>
              <Layout>
                <ProjectAccess />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings/activity" element={
            <PrivateRoute>
              <Layout>
                <ActivityLogs />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="/settings/system" element={
            <PrivateRoute>
              <Layout>
                <SystemSettings />
              </Layout>
            </PrivateRoute>
          } />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
