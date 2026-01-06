import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import {BrowserRouter, HashRouter} from "react-router-dom";
import {disableReactDevTools} from "@fvilers/disable-react-devtools";

if(import.meta.env.MODE === "production") disableReactDevTools()

const isElectron = window.navigator.userAgent.toLowerCase().includes('electron');
const Router = isElectron ? HashRouter : BrowserRouter;

createRoot(document.getElementById('root')).render(
  // <StrictMode>
      <Router>
          <App />
      </Router>
  // </StrictMode>,
)
