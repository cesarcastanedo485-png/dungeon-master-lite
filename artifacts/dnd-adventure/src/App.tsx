import { Switch, Route, Router as WouterRouter } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";

// Contexts
import { UserProvider } from "@/hooks/use-user";

// Components
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { Layout } from "@/components/layout";

// Pages
import Dashboard from "@/pages/dashboard";
import Characters from "@/pages/characters";
import Races from "@/pages/races";
import Classes from "@/pages/classes";
import Compendium from "@/pages/compendium";
import Testing from "@/pages/testing";
import NotFound from "@/pages/not-found";
import GodotEmbedPage from "@/pages/godot-embed";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

function MainShell() {
  return (
    <Layout>
      <Switch>
        <Route path="/" component={Dashboard} />
        <Route path="/characters" component={Characters} />
        <Route path="/races" component={Races} />
        <Route path="/classes" component={Classes} />
        <Route path="/compendium" component={Compendium} />
        <Route path="/testing" component={Testing} />
        <Route component={NotFound} />
      </Switch>
    </Layout>
  );
}

function Router() {
  return (
    <Switch>
      <Route path="/embed" component={GodotEmbedPage} />
      <Route component={MainShell} />
    </Switch>
  );
}

function App() {
  return (
    <ErrorBoundary>
      <QueryClientProvider client={queryClient}>
        <TooltipProvider>
          <UserProvider>
            <WouterRouter
              base={String(import.meta.env.BASE_URL ?? "/").replace(/\/$/, "")}
            >
              <Router />
            </WouterRouter>
          </UserProvider>
          <Toaster />
        </TooltipProvider>
      </QueryClientProvider>
    </ErrorBoundary>
  );
}

export default App;
