import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import RootLayout from "./components/layout/RootLayout";
import HomePage from "./pages/HomePage";
import SearchPage from "./pages/SearchPage";
import ProviderPage from "./pages/ProviderPage";
import FormalizationPage from "./pages/FormalizationPage";
import { NewRequestPage, RequestDetailPage, RequestsPage } from "./pages/RequestPages";
import { SecurityPage, TrustPage } from "./pages/AccountPages";
import EditPublicProfilePage from "./pages/EditPublicProfilePage";
import AdminReportsPage from "./pages/AdminReportsPage";
import UnavailablePage from "./pages/UnavailablePage";
import ChatPage from "./pages/ChatPage";
import MyProfileDashboardPage from "./pages/MyProfileDashboardPage";
import { ManageOffersPage, OfferDetailPage, OfferEditorPage } from "./pages/OfferPages";
export default function App(){return <BrowserRouter><Routes><Route element={<RootLayout/>}><Route path="/" element={<HomePage/>}/><Route path="/search" element={<SearchPage/>}/><Route path="/buscar" element={<Navigate to="/search" replace/>}/><Route path="/providers/:providerId" element={<ProviderPage/>}/><Route path="/providers/:providerId/products/:productId" element={<OfferDetailPage/>}/><Route path="/proveedor/:id" element={<ProviderPage/>}/><Route path="/requests" element={<RequestsPage/>}/><Route path="/requests/new" element={<NewRequestPage/>}/><Route path="/requests/:requestId" element={<RequestDetailPage/>}/><Route path="/requests/:requestId/chat" element={<ChatPage/>}/><Route path="/me" element={<MyProfileDashboardPage/>}/><Route path="/me/profile/edit" element={<EditPublicProfilePage/>}/><Route path="/me/products" element={<ManageOffersPage/>}/><Route path="/me/products/new" element={<OfferEditorPage/>}/><Route path="/me/products/:productId/edit" element={<OfferEditorPage/>}/><Route path="/formalization" element={<FormalizationPage/>}/><Route path="/trust" element={<TrustPage/>}/><Route path="/settings/security" element={<SecurityPage/>}/><Route path="/admin/reports" element={<AdminReportsPage/>}/><Route path="/serialization" element={<UnavailablePage/>}/><Route path="/dashboard/perfil" element={<Navigate to="/me" replace/>}/><Route path="/dashboard/cotizaciones" element={<Navigate to="/requests" replace/>}/><Route path="/dashboard/formalizacion" element={<Navigate to="/formalization" replace/>}/><Route path="*" element={<Navigate to="/" replace/>}/></Route></Routes></BrowserRouter>}
