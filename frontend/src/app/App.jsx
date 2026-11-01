import AppRouter from "./router.jsx";
import ErrorBoundary from "../components/ErrorBoundary/ErrorBoundary.jsx";

export default function App() {
  return (
    <ErrorBoundary>
      <AppRouter />
    </ErrorBoundary>
  );
}
