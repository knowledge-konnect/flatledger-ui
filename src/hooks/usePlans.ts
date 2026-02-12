import { useEffect, useState } from 'react';
import apiClient from '../api/client';

export interface Plan {
  id: string;
  name: string;
  monthlyAmount: number;
  currency: string;
  isActive?: boolean;
  description?: string;
}

export function usePlans() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [plansLoading, setPlansLoading] = useState(true);
  const [plansError, setPlansError] = useState<string | null>(null);

  useEffect(() => {
    const fetchPlans = async () => {
      try {
        setPlansLoading(true);
        setPlansError(null);
        const response = await apiClient.get('/plans');
        const result = response.data;
        if (result.succeeded && result.data) {
          // Handle nested structure: result.data.plans
          const plansArray = result.data.plans || result.data;
          if (Array.isArray(plansArray)) {
            setPlans(plansArray);
          } else {
            setPlansError('Invalid plans data format');
            setPlans([]);
          }
        } else {
          setPlansError('Failed to load plans');
          setPlans([]);
        }
      } catch (error) {
        setPlansError('Failed to load plans');
        setPlans([]);
      } finally {
        setPlansLoading(false);
      }
    };
    fetchPlans();
  }, []);

  return { plans, plansLoading, plansError };
}
