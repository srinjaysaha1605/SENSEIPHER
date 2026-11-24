import {useState} from 'react';
import {AnalysisWorkspace} from './components/AnalysisWorkspace';
import {LandingGate} from './components/LandingGate';

function shouldAutostartWorkspace(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }
  const params = new URLSearchParams(window.location.search);
  return params.get('autostart') === '1';
}

export default function App() {
  const [entered, setEntered] = useState<boolean>(shouldAutostartWorkspace);

  if (!entered) {
    return <LandingGate onEnter={() => setEntered(true)} />;
  }

  return <AnalysisWorkspace onReturnToGate={() => setEntered(false)} />;
}
