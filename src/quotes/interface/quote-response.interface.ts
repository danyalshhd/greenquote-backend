export interface QuoteResponse {
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
  offers: any;
}
