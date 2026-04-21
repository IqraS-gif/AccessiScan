import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import { AuthProvider } from 'react-oidc-context';
import App from './App.jsx';
import './index.css';

const cognitoAuthConfig = {
  authority: "https://cognito-idp.us-east-1.amazonaws.com/us-east-1_qPTDgvkKe",
  client_id: "2merv8shtv2gaj65bvui5msdjl",
  redirect_uri: window.location.origin,
  response_type: "code",
  scope: "phone openid email",
  onSigninCallback: () => {
    // Remove the authorization code from the URL after successful login
    window.history.replaceState({}, document.title, window.location.pathname);
  },
};

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <AuthProvider {...cognitoAuthConfig}>
      <App />
    </AuthProvider>
  </StrictMode>,
);
