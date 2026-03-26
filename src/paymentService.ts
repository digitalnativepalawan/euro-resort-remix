export interface GenerateQRRequest {
  amount: number;
  reference: string;
  currency?: string;
}

export interface GenerateQRResponse {
  success: boolean;
  qrPayload: string;
  amount: number;
  reference: string;
  currency: string;
}

export const paymentService = {
  generateQR: async (data: GenerateQRRequest): Promise<GenerateQRResponse> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    const currency = data.currency || 'PHP';
    
    // Mock QR payload format
    const qrPayload = `QR|${currency}|${data.amount}|${data.reference}`;
    
    return {
      success: true,
      qrPayload,
      amount: data.amount,
      reference: data.reference,
      currency,
    };
  }
};
