import { lazy, Suspense } from "react";
import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { Route, Switch, Redirect } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import LgpdConsentBanner from "./components/LgpdConsentBanner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { useAuth } from "./_core/hooks/useAuth";
import { Loader2 } from "lucide-react";

// Lazy-loaded pages — split por rota para reduzir bundle inicial
const Home = lazy(() => import("./pages/Home"));
const Login = lazy(() => import("./pages/Login"));
const Register = lazy(() => import("./pages/Register"));
const ForgotPassword = lazy(() => import("./pages/ForgotPassword"));
const ResetPassword = lazy(() => import("./pages/ResetPassword"));
const ReportOccurrence = lazy(() => import("./pages/ReportOccurrence"));
const MapView = lazy(() => import("./pages/MapView"));
const Simulators = lazy(() => import("./pages/Simulators"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const Feed = lazy(() => import("./pages/Feed"));
const AdminPanel = lazy(() => import("./pages/AdminPanel"));
const Alerts = lazy(() => import("./pages/Alerts"));
const ActivityHistory = lazy(() => import("./pages/ActivityHistory"));
const ReportContent = lazy(() => import("./pages/ReportContent"));
const DataExport = lazy(() => import("./pages/DataExport"));
const UserSettings = lazy(() => import("./pages/Settings"));
const About = lazy(() => import("./pages/About"));
const PredictiveDashboard = lazy(() => import("./pages/PredictiveDashboard"));
const ChatbotPage = lazy(() => import("./pages/Chatbot"));
const PrivacyPolicy = lazy(() => import("./pages/PrivacyPolicy"));
const EmergencyMode = lazy(() => import("./pages/EmergencyMode"));
const IEMPage = lazy(() => import("./pages/IEMPage"));
const FormalComplaint = lazy(() => import("./pages/FormalComplaint"));
const HealthPanel = lazy(() => import("./pages/HealthPanel"));
const LossCalculator = lazy(() => import("./pages/LossCalculator"));
const ReportGenerator = lazy(() => import("./pages/ReportGenerator"));
const GreenSeal = lazy(() => import("./pages/GreenSeal"));
const CropForecast = lazy(() => import("./pages/CropForecast"));
const CarbonDashboard = lazy(() => import("./pages/CarbonDashboard"));
const Bioacoustics = lazy(() => import("./pages/Bioacoustics"));
const NatureDAO = lazy(() => import("./pages/NatureDAO"));
const ClimateJustice = lazy(() => import("./pages/ClimateJustice"));
const InternetOfSeeds = lazy(() => import("./pages/InternetOfSeeds"));
const EcoProtocol = lazy(() => import("./pages/EcoProtocol"));
const BiodiversityIndex = lazy(() => import("./pages/BiodiversityIndex"));
const ClimateDecisionEngine = lazy(() => import("./pages/ClimateDecisionEngine"));
const MunicipalResilience = lazy(() => import("./pages/MunicipalResilience"));
const TerritorialSimulator = lazy(() => import("./pages/TerritorialSimulator"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Spinner global de carregamento para Suspense
function PageLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <Loader2 className="w-8 h-8 animate-spin text-green-600" />
    </div>
  );
}

// Componente para proteger rotas
function ProtectedRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Redirect to="/login" />;
  }

  return <Component {...rest} />;
}

// Componente para redirecionar usuÃ¡rios autenticados
function PublicRoute({ component: Component, ...rest }: any) {
  const { isAuthenticated, loading, user } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-green-600" />
      </div>
    );
  }

  if (isAuthenticated) {
    if (user?.role === 'admin') {
      return <Redirect to="/admin" />;
    }
    return <Redirect to="/dashboard" />;
  }

  return <Component {...rest} />;
}

function Router() {
  return (
    <Switch>
      {/* Rotas pÃºblicas - redirecionam para dashboard se autenticado */}
      <Route path="/login">
        {() => <PublicRoute component={Login} />}
      </Route>
      <Route path="/register">
        {() => <PublicRoute component={Register} />}
      </Route>
      <Route path="/forgot-password">
        {() => <PublicRoute component={ForgotPassword} />}
      </Route>
      <Route path="/reset-password">
        {() => <PublicRoute component={ResetPassword} />}
      </Route>
      <Route path="/" component={Home} />
      <Route path="/about" component={About} />
      <Route path="/privacy" component={PrivacyPolicy} />

      {/* Rotas protegidas - requerem autenticaÃ§Ã£o */}
      <Route path="/dashboard">
        {() => <ProtectedRoute component={Dashboard} />}
      </Route>
      <Route path="/report">
        {() => <ProtectedRoute component={ReportOccurrence} />}
      </Route>
      <Route path="/map">
        {() => <ProtectedRoute component={MapView} />}
      </Route>
      <Route path="/simulators">
        {() => <ProtectedRoute component={Simulators} />}
      </Route>
      <Route path="/feed">
        {() => <ProtectedRoute component={Feed} />}
      </Route>
      <Route path="/admin">
        {() => <ProtectedRoute component={AdminPanel} />}
      </Route>
      <Route path="/alerts">
        {() => <ProtectedRoute component={Alerts} />}
      </Route>
      <Route path="/activity">
        {() => <ProtectedRoute component={ActivityHistory} />}
      </Route>
      <Route path="/report-content">
        {() => <ProtectedRoute component={ReportContent} />}
      </Route>
      <Route path="/export">
        {() => <ProtectedRoute component={DataExport} />}
      </Route>
      <Route path="/settings">
        {() => <ProtectedRoute component={UserSettings} />}
      </Route>
      <Route path="/chatbot">
        {() => <ProtectedRoute component={ChatbotPage} />}
      </Route>
      <Route path="/predictive">
        {() => <ProtectedRoute component={PredictiveDashboard} />}
      </Route>
      <Route path="/emergency">
        {() => <ProtectedRoute component={EmergencyMode} />}
      </Route>
      <Route path="/iem">
        {() => <ProtectedRoute component={IEMPage} />}
      </Route>
      <Route path="/complaint">
        {() => <ProtectedRoute component={FormalComplaint} />}
      </Route>
      <Route path="/health">
        {() => <ProtectedRoute component={HealthPanel} />}
      </Route>
      <Route path="/losses">
        {() => <ProtectedRoute component={LossCalculator} />}
      </Route>
      <Route path="/report-pdf">
        {() => <ProtectedRoute component={ReportGenerator} />}
      </Route>
      <Route path="/green-seal">
        {() => <ProtectedRoute component={GreenSeal} />}
      </Route>
      <Route path="/crop-forecast">
        {() => <ProtectedRoute component={CropForecast} />}
      </Route>
      <Route path="/carbon">
        {() => <ProtectedRoute component={CarbonDashboard} />}
      </Route>
      <Route path="/bioacoustics">
        {() => <ProtectedRoute component={Bioacoustics} />}
      </Route>
      <Route path="/nature-dao">
        {() => <ProtectedRoute component={NatureDAO} />}
      </Route>
      <Route path="/climate-justice">
        {() => <ProtectedRoute component={ClimateJustice} />}
      </Route>
      <Route path="/internet-of-seeds">
        {() => <ProtectedRoute component={InternetOfSeeds} />}
      </Route>
      <Route path="/eco-protocol">
        {() => <ProtectedRoute component={EcoProtocol} />}
      </Route>
      <Route path="/biodiversity-index">
        {() => <ProtectedRoute component={BiodiversityIndex} />}
      </Route>
      <Route path="/climate-decision">
        {() => <ProtectedRoute component={ClimateDecisionEngine} />}
      </Route>
      <Route path="/municipal-resilience">
        {() => <ProtectedRoute component={MunicipalResilience} />}
      </Route>
      <Route path="/territorial-simulator">
        {() => <ProtectedRoute component={TerritorialSimulator} />}
      </Route>

      {/* 404 */}
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="light" switchable>
        <TooltipProvider>
          <Toaster />
          <Suspense fallback={<PageLoader />}>
            <Router />
          </Suspense>
          <LgpdConsentBanner />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;


