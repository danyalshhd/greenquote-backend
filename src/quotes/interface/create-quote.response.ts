export interface CreateQuoteResponse {
  status: number;
  success: boolean;
  data: {
    id: string;
    inputs: {
      fullName: string;
      email: string;
      address: string;
      monthlyConsumptionKwh: number;
      systemSizeKw: number;
      downPayment: number | null;
    };
    derived: {
      systemPrice: number;
      principalAmount: number;
      riskBand: string;
    };
    offers: {
      termYears: number;
      apr: number;
      principalUsed: number;
      monthlyPayment: number;
    }[];
  };
}
