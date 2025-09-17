import * as FileSystem from 'expo-file-system';
import * as Print from 'expo-print';
import * as Sharing from 'expo-sharing';
import { Alert } from 'react-native';

export interface ReceiptData {
  transferCode: string;
  reference: string;
  amount: string;
  fee?: string;
  total?: string;
  recipientName: string;
  recipientAccount: string;
  recipientBank: string;
  senderName: string;
  senderAccount: string;
  senderBank: string;
  date: string;
  status: 'successful' | 'failed' | 'pending';
  narration?: string;
}

export class ReceiptService {
  /**
   * Generate HTML content for the receipt
   */
  static generateReceiptHTML(data: ReceiptData): string {
    const statusColor = data.status === 'successful' ? '#10b981' : 
                       data.status === 'failed' ? '#ef4444' : '#f59e0b';
    
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Transfer Receipt</title>
          <style>
            * {
              margin: 0;
              padding: 0;
              box-sizing: border-box;
            }
            
            body {
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              background: #f8f9fa;
              padding: 20px;
              line-height: 1.6;
            }
            
            .receipt {
              max-width: 400px;
              margin: 0 auto;
              background: white;
              border-radius: 12px;
              box-shadow: 0 4px 6px rgba(0, 0, 0, 0.1);
              overflow: hidden;
            }
            
            .header {
              background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
              color: white;
              padding: 24px;
              text-align: center;
            }
            
            .app-name {
              font-size: 24px;
              font-weight: bold;
              margin-bottom: 8px;
            }
            
            .receipt-title {
              font-size: 16px;
              opacity: 0.9;
            }
            
            .status {
              background: ${statusColor};
              color: white;
              padding: 12px 24px;
              text-align: center;
              font-weight: 600;
              text-transform: uppercase;
              letter-spacing: 1px;
            }
            
            .content {
              padding: 24px;
            }
            
            .section {
              margin-bottom: 24px;
            }
            
            .section-title {
              font-size: 14px;
              font-weight: 600;
              color: #6b7280;
              text-transform: uppercase;
              letter-spacing: 0.5px;
              margin-bottom: 12px;
            }
            
            .detail-row {
              display: flex;
              justify-content: space-between;
              align-items: center;
              padding: 8px 0;
              border-bottom: 1px solid #f3f4f6;
            }
            
            .detail-row:last-child {
              border-bottom: none;
            }
            
            .detail-label {
              color: #6b7280;
              font-size: 14px;
            }
            
            .detail-value {
              color: #111827;
              font-weight: 500;
              font-size: 14px;
              text-align: right;
              max-width: 60%;
            }
            
            .amount-section {
              background: #f9fafb;
              border-radius: 8px;
              padding: 16px;
              margin: 16px 0;
            }
            
            .amount-row {
              display: flex;
              justify-content: space-between;
              margin-bottom: 8px;
            }
            
            .amount-row:last-child {
              margin-bottom: 0;
              padding-top: 8px;
              border-top: 1px solid #e5e7eb;
              font-weight: 600;
              font-size: 16px;
            }
            
            .footer {
              background: #f9fafb;
              padding: 20px 24px;
              text-align: center;
              border-top: 1px solid #e5e7eb;
            }
            
            .footer-text {
              color: #6b7280;
              font-size: 12px;
              line-height: 1.5;
            }
            
            .reference {
              font-family: 'Courier New', monospace;
              background: #f3f4f6;
              padding: 4px 8px;
              border-radius: 4px;
              font-size: 12px;
            }
            
            @media print {
              body {
                background: white;
                padding: 0;
              }
              
              .receipt {
                box-shadow: none;
                max-width: 100%;
              }
            }
          </style>
        </head>
        <body>
          <div class="receipt">
            <div class="header">
              <div class="app-name">FinSync</div>
              <div class="receipt-title">Transfer Receipt</div>
            </div>
            
            <div class="status">
              Transfer ${data.status}
            </div>
            
            <div class="content">
              <div class="section">
                <div class="section-title">Transaction Details</div>
                <div class="detail-row">
                  <span class="detail-label">Reference</span>
                  <span class="detail-value reference">${data.reference}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Transfer Code</span>
                  <span class="detail-value reference">${data.transferCode}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Date & Time</span>
                  <span class="detail-value">${data.date}</span>
                </div>
                ${data.narration ? `
                <div class="detail-row">
                  <span class="detail-label">Narration</span>
                  <span class="detail-value">${data.narration}</span>
                </div>
                ` : ''}
              </div>
              
              <div class="section">
                <div class="section-title">Amount Details</div>
                <div class="amount-section">
                  <div class="amount-row">
                    <span>Transfer Amount</span>
                    <span>₦${parseFloat(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ${data.fee ? `
                  <div class="amount-row">
                    <span>Transfer Fee</span>
                    <span>₦${parseFloat(data.fee).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                  ` : ''}
                  <div class="amount-row">
                    <span>Total Amount</span>
                    <span>₦${data.total ? parseFloat(data.total).toLocaleString('en-US', { minimumFractionDigits: 2 }) : parseFloat(data.amount).toLocaleString('en-US', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Recipient Details</div>
                <div class="detail-row">
                  <span class="detail-label">Name</span>
                  <span class="detail-value">${data.recipientName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Account Number</span>
                  <span class="detail-value">${data.recipientAccount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Bank</span>
                  <span class="detail-value">${data.recipientBank}</span>
                </div>
              </div>
              
              <div class="section">
                <div class="section-title">Sender Details</div>
                <div class="detail-row">
                  <span class="detail-label">Name</span>
                  <span class="detail-value">${data.senderName}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Account Number</span>
                  <span class="detail-value">${data.senderAccount}</span>
                </div>
                <div class="detail-row">
                  <span class="detail-label">Bank</span>
                  <span class="detail-value">${data.senderBank}</span>
                </div>
              </div>
            </div>
            
            <div class="footer">
              <div class="footer-text">
                This is a computer-generated receipt.<br>
                Generated on ${new Date().toLocaleString()}<br>
                Keep this receipt for your records.
              </div>
            </div>
          </div>
        </body>
      </html>
    `;
  }

  /**
   * Generate PDF receipt
   */
  static async generatePDFReceipt(data: ReceiptData): Promise<string> {
    try {
      const htmlContent = this.generateReceiptHTML(data);
      
      const { uri } = await Print.printToFileAsync({
        html: htmlContent,
        base64: false,
        width: 612,
        height: 792,
      });

      // Move to a permanent location with proper name
      const fileName = `receipt_${data.reference}_${Date.now()}.pdf`;
      const newUri = `${FileSystem.documentDirectory}${fileName}`;
      
      await FileSystem.moveAsync({
        from: uri,
        to: newUri,
      });

      return newUri;
    } catch (error) {
      console.error('Error generating PDF receipt:', error);
      throw new Error('Failed to generate PDF receipt');
    }
  }

  /**
   * Share receipt as PDF
   */
  static async shareReceipt(data: ReceiptData): Promise<void> {
    try {
      const pdfUri = await this.generatePDFReceipt(data);
      
      if (await Sharing.isAvailableAsync()) {
        await Sharing.shareAsync(pdfUri, {
          mimeType: 'application/pdf',
          dialogTitle: 'Share Transfer Receipt',
          UTI: 'com.adobe.pdf',
        });
      } else {
        Alert.alert('Sharing not available', 'Sharing is not available on this device');
      }
    } catch (error) {
      console.error('Error sharing receipt:', error);
      Alert.alert('Error', 'Failed to share receipt. Please try again.');
    }
  }

  /**
   * Print receipt
   */
  static async printReceipt(data: ReceiptData): Promise<void> {
    try {
      const htmlContent = this.generateReceiptHTML(data);
      
      if (await Print.isAvailableAsync()) {
        await Print.printAsync({
          html: htmlContent,
          printerUrl: undefined, // Let user select printer
        });
      } else {
        Alert.alert('Printing not available', 'Printing is not available on this device');
      }
    } catch (error) {
      console.error('Error printing receipt:', error);
      Alert.alert('Error', 'Failed to print receipt. Please try again.');
    }
  }

  /**
   * Save receipt to device
   */
  static async saveReceipt(data: ReceiptData): Promise<string> {
    try {
      const pdfUri = await this.generatePDFReceipt(data);
      
      Alert.alert(
        'Receipt Saved',
        `Receipt has been saved to your device.`,
        [{ text: 'OK' }]
      );
      
      return pdfUri;
    } catch (error) {
      console.error('Error saving receipt:', error);
      Alert.alert('Error', 'Failed to save receipt. Please try again.');
      throw error;
    }
  }

  /**
   * Show receipt options modal
   */
  static showReceiptOptions(data: ReceiptData): void {
    Alert.alert(
      'Receipt Options',
      'What would you like to do with the receipt?',
      [
        {
          text: 'Share',
          onPress: () => this.shareReceipt(data),
        },
        {
          text: 'Print',
          onPress: () => this.printReceipt(data),
        },
        {
          text: 'Save',
          onPress: () => this.saveReceipt(data),
        },
        {
          text: 'Cancel',
          style: 'cancel',
        },
      ],
      { cancelable: true }
    );
  }
}
