import type {
  TransactionSignals,
  RiskEngineResult,
  TransactionResponse,
  TransactionListItem,
  AnalyticsSummary,
  RiskDistributionData,
} from '../types';

const rawApiUrl = import.meta.env.VITE_API_URL;
export const API_BASE = rawApiUrl ? rawApiUrl.replace(/\/+$/, '') : '/api';

export const api = {
  /**
   * Preview score for sandbox sliders without persisting
   */
  async previewScore(signals: TransactionSignals, amount: number = 2499, currency: string = 'INR'): Promise<RiskEngineResult> {
    const res = await fetch(`${API_BASE}/transactions/score`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ amount, currency, signals }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to score transaction');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Execute & persist full simulated transaction
   */
  async createTransaction(payload: {
    amount: number;
    currency: string;
    customerName: string;
    customerEmail: string;
    merchantName?: string;
    signals: TransactionSignals;
  }): Promise<TransactionResponse> {
    const res = await fetch(`${API_BASE}/transactions`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to execute transaction');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Verify challenge OTP
   */
  async verifyOtp(transactionId: string, otp: string): Promise<{
    success: boolean;
    message: string;
    status: string;
    attemptsRemaining?: number;
  }> {
    const res = await fetch(`${API_BASE}/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId, otp }),
    });
    const json = await res.json();
    if (!res.ok) {
      throw new Error(json.message || 'OTP verification failed');
    }
    return json;
  },

  /**
   * Resend OTP challenge code
   */
  async resendOtp(transactionId: string): Promise<{
    success: boolean;
    data: { challengeId: string; expiresAt: string; demoTestOtp?: string };
  }> {
    const res = await fetch(`${API_BASE}/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ transactionId }),
    });
    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err.error || 'Failed to resend OTP');
    }
    return res.json();
  },

  /**
   * Fetch transaction list with filters
   */
  async getTransactions(params?: {
    page?: number;
    limit?: number;
    search?: string;
    decision?: string;
    status?: string;
    startDate?: string;
    endDate?: string;
  }): Promise<{
    transactions: TransactionListItem[];
    pagination: { page: number; limit: number; total: number; totalPages: number };
  }> {
    const searchParams = new URLSearchParams();
    if (params?.page) searchParams.set('page', params.page.toString());
    if (params?.limit) searchParams.set('limit', params.limit.toString());
    if (params?.search) searchParams.set('search', params.search);
    if (params?.decision) searchParams.set('decision', params.decision);
    if (params?.status) searchParams.set('status', params.status);
    if (params?.startDate) searchParams.set('startDate', params.startDate);
    if (params?.endDate) searchParams.set('endDate', params.endDate);

    const res = await fetch(`${API_BASE}/transactions?${searchParams.toString()}`);
    if (!res.ok) {
      throw new Error('Failed to fetch transactions');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch complete single transaction record
   */
  async getTransactionDetails(id: string): Promise<any> {
    const res = await fetch(`${API_BASE}/transactions/${id}`);
    if (!res.ok) {
      throw new Error('Failed to fetch transaction details');
    }
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch analytics summary
   */
  async getAnalyticsSummary(): Promise<AnalyticsSummary> {
    const res = await fetch(`${API_BASE}/analytics/summary`);
    if (!res.ok) throw new Error('Failed to load analytics summary');
    const json = await res.json();
    return json.data;
  },

  /**
   * Fetch risk distribution & charts data
   */
  async getRiskDistribution(): Promise<RiskDistributionData> {
    const res = await fetch(`${API_BASE}/analytics/risk-distribution`);
    if (!res.ok) throw new Error('Failed to load risk distribution');
    const json = await res.json();
    return json.data;
  },
};
