/**
 * The token-based reset-password flow has been replaced with a direct
 * email-based flow on the ForgotPassword page.
 * Any old /reset-password?token=... links redirect to /forgot-password.
 */
import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

export default function ResetPassword() {
  const navigate = useNavigate();
  useEffect(() => {
    navigate('/forgot-password', { replace: true });
  }, [navigate]);
  return null;
}
