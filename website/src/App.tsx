import { Routes, Route, BrowserRouter } from "react-router-dom";
import { Dashboard } from "./pages/dashboard";
import { CreateRoom } from "./pages/create-room";
import { Room } from "./pages/room";
import { NotePage } from "./pages/note";
import { CreateRoomFromAudio } from "./pages/create-room-from-audio";
import { ActivityPage } from "./pages/activity";
import { LandingPage } from "./pages/landing";
import { LoginPage } from "./pages/login";
import { RegisterPage } from "./pages/register";
import { ProtectedRoute } from "./components/protected-route";
import { QueryClientProvider, QueryClient } from "@tanstack/react-query";
import { Toaster } from "sonner";


const queryClient = new QueryClient()

export function App() {

  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route element={<LandingPage />} index />
          <Route path="/login" element={<LoginPage />} />
          <Route path="/register" element={<RegisterPage />} />
          
          {/* Protected app routes - AppLayout is already in ProtectedRoute! */}
          <Route path="/app" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
          <Route path="/lessons" element={<ProtectedRoute><CreateRoom /></ProtectedRoute>} />
          <Route path="/room/:id" element={<ProtectedRoute><NotePage /></ProtectedRoute>} />
          <Route path="/room-old/:id" element={<ProtectedRoute><Room /></ProtectedRoute>} />
          <Route path="/create-from-audio" element={<ProtectedRoute><CreateRoomFromAudio /></ProtectedRoute>} />
          <Route path="/activity/:activityId" element={<ProtectedRoute><ActivityPage /></ProtectedRoute>} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryClientProvider>
  )
}


