import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import ErrorBoundary from './components/ErrorBoundary'
import './index.css'

console.log('Iniciando aplicação...');

try {
  const rootElement = document.getElementById('root');
  if (!rootElement) {
    console.error('Elemento root não encontrado!');
  } else {
    console.log('Elemento root encontrado, montando React...');
    createRoot(rootElement).render(
      <StrictMode>
        <ErrorBoundary>
          <App />
        </ErrorBoundary>
      </StrictMode>,
    )
    console.log('React montado (ou processo iniciado).');
  }
} catch (error) {
  console.error('Erro fatal na inicialização:', error);
}
