import { jsPDF } from 'jspdf';
import 'jspdf-autotable';
import { formatDate, formatNumber } from './utils';

// Add the autotable plugin to the jsPDF type
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    previousAutoTable?: {
      finalY: number;
    };
  }
}

export interface ReportData {
  title: string;
  subtitle?: string;
  date: string;
  type: string;
  vehicleType: string;
  period: {
    type: string;
    year: string;
    month?: string;
    quarter?: string;
  };
  data: any[];
  charts?: any[];
  summary?: string;
}

export interface ReportOptions {
  format: string;
  includeCharts: boolean;
  includeSummary: boolean;
  includeFooter: boolean;
  logoPath: string;
}

export class PdfGenerator {
  private doc: jsPDF;
  private pageWidth: number;
  private pageHeight: number;
  private margin = 15;
  private logoPath: string = '';
  private logoWidth = 50;
  private logoHeight = 20;
  private primaryColor = '#4CAF50';
  private textColor = '#333333';
  private lightGray = '#F5F5F5';
  private darkGray = '#757575';

  constructor(options: { format?: 'a4' | 'letter' | 'legal'; orientation?: 'portrait' | 'landscape' }) {
    const { format = 'a4', orientation = 'portrait' } = options;
    this.doc = new jsPDF({
      orientation,
      unit: 'mm',
      format,
    });

    this.pageWidth = this.doc.internal.pageSize.getWidth();
    this.pageHeight = this.doc.internal.pageSize.getHeight();
  }

  /**
   * Generate a PDF report
   */
  public generateReport(data: ReportData, options: ReportOptions): Blob {
    this.logoPath = options.logoPath;
    
    // Add header with logo and title
    this.addHeader(data.title, data.subtitle);
    
    // Add report metadata
    this.addMetadata(data);
    
    // Add report content based on report type
    switch (data.type) {
      case 'fuel-consumption':
        this.addFuelConsumptionReport(data);
        break;
      case 'vehicle-efficiency':
        this.addVehicleEfficiencyReport(data);
        break;
      case 'co2-emissions':
        this.addCO2EmissionsReport(data);
        break;
      case 'performance-comparison':
        this.addPerformanceComparisonReport(data);
        break;
      default:
        this.addGenericReport(data);
    }
    
    // Add summary if enabled
    if (options.includeSummary && data.summary) {
      this.addSummary(data.summary);
    }
    
    // Add footer if enabled
    if (options.includeFooter) {
      this.addFooter();
    }
    
    // Return the PDF as a blob
    return this.doc.output('blob');
  }

  /**
   * Add header with logo and title
   */
  private addHeader(title: string, subtitle?: string): void {
    // Add logo
    try {
      this.doc.addImage(
        this.logoPath,
        'JPEG',
        this.margin,
        this.margin,
        this.logoWidth,
        this.logoHeight
      );
    } catch (error) {
      console.error('Error adding logo to PDF:', error);
      // Continue without the logo
    }
    
    // Add title
    this.doc.setFontSize(20);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text(
      title,
      this.pageWidth / 2,
      this.margin + 10,
      { align: 'center' }
    );
    
    // Add subtitle if provided
    if (subtitle) {
      this.doc.setFontSize(12);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        subtitle,
        this.pageWidth / 2,
        this.margin + 20,
        { align: 'center' }
      );
    }
    
    // Add horizontal line
    this.doc.setDrawColor(this.primaryColor);
    this.doc.setLineWidth(0.5);
    this.doc.line(
      this.margin,
      this.margin + (subtitle ? 25 : 15),
      this.pageWidth - this.margin,
      this.margin + (subtitle ? 25 : 15)
    );
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
  }

  /**
   * Add report metadata
   */
  private addMetadata(data: ReportData): void {
    const startY = this.margin + (data.subtitle ? 30 : 20);
    
    this.doc.setFontSize(10);
    this.doc.setTextColor(this.darkGray);
    
    // Format period text based on period type
    let periodText = `Année: ${data.period.year}`;
    if (data.period.type === 'month' && data.period.month) {
      periodText += `, Mois: ${data.period.month}`;
    } else if (data.period.type === 'quarter' && data.period.quarter) {
      periodText += `, Trimestre: ${data.period.quarter}`;
    }
    
    const metadataItems = [
      `Date du rapport: ${formatDate(data.date)}`,
      `Type de véhicule: ${data.vehicleType}`,
      `Période: ${periodText}`,
    ];
    
    metadataItems.forEach((item, index) => {
      this.doc.text(item, this.margin, startY + (index * 5));
    });
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add some space after metadata
    this.doc.setFontSize(12);
  }

  /**
   * Add fuel consumption report content
   */
  private addFuelConsumptionReport(data: ReportData): void {
    const startY = this.margin + 50;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Analyse de la consommation de carburant', this.margin, startY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add table with fuel consumption data
    this.doc.autoTable({
      startY: startY + 10,
      head: [['Période', 'Consommation (L)', 'Distance (km)', 'Consommation moyenne (L/100km)']],
      body: data.data.map((item: any) => [
        item.period,
        formatNumber(item.consumption),
        formatNumber(item.distance),
        formatNumber(item.averageConsumption, 2),
      ]),
      headStyles: {
        fillColor: this.primaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: this.lightGray,
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    // Add chart placeholder if charts are included
    if (data.charts && data.charts.length > 0) {
      const tableHeight = data.data.length * 10 + 20; // Approximate table height
      
      this.doc.setFontSize(12);
      this.doc.text('Évolution de la consommation', this.margin, startY + tableHeight + 20);
      
      // In a real implementation, you would add the chart image here
      this.doc.setDrawColor(this.darkGray);
      this.doc.setFillColor(this.lightGray);
      this.doc.roundedRect(
        this.margin,
        startY + tableHeight + 25,
        this.pageWidth - (this.margin * 2),
        80,
        2,
        2,
        'FD'
      );
      
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        'Graphique de consommation',
        this.pageWidth / 2,
        startY + tableHeight + 65,
        { align: 'center' }
      );
    }
  }

  /**
   * Add vehicle efficiency report content
   */
  private addVehicleEfficiencyReport(data: ReportData): void {
    const startY = this.margin + 50;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Analyse de l\'efficacité des véhicules', this.margin, startY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add table with efficiency data
    this.doc.autoTable({
      startY: startY + 10,
      head: [['Véhicule', 'Efficacité (km/L)', 'Consommation (L/100km)', 'Score d\'efficacité']],
      body: data.data.map((item: any) => [
        item.vehicle,
        formatNumber(item.efficiency, 2),
        formatNumber(item.consumption, 2),
        formatNumber(item.score, 1),
      ]),
      headStyles: {
        fillColor: this.primaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: this.lightGray,
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    // Add chart placeholder if charts are included
    if (data.charts && data.charts.length > 0) {
      const tableHeight = data.data.length * 10 + 20; // Approximate table height
      
      this.doc.setFontSize(12);
      this.doc.text('Comparaison d\'efficacité entre véhicules', this.margin, startY + tableHeight + 20);
      
      // In a real implementation, you would add the chart image here
      this.doc.setDrawColor(this.darkGray);
      this.doc.setFillColor(this.lightGray);
      this.doc.roundedRect(
        this.margin,
        startY + tableHeight + 25,
        this.pageWidth - (this.margin * 2),
        80,
        2,
        2,
        'FD'
      );
      
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        'Graphique d\'efficacité',
        this.pageWidth / 2,
        startY + tableHeight + 65,
        { align: 'center' }
      );
    }
  }

  /**
   * Add CO2 emissions report content
   */
  private addCO2EmissionsReport(data: ReportData): void {
    const startY = this.margin + 50;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Analyse des émissions de CO2', this.margin, startY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add table with emissions data
    this.doc.autoTable({
      startY: startY + 10,
      head: [['Véhicule/Type', 'Émissions totales (kg)', 'Distance (km)', 'Émissions moyennes (g/km)']],
      body: data.data.map((item: any) => [
        item.vehicle,
        formatNumber(item.totalEmissions),
        formatNumber(item.distance),
        formatNumber(item.averageEmissions, 1),
      ]),
      headStyles: {
        fillColor: this.primaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: this.lightGray,
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    // Add chart placeholder if charts are included
    if (data.charts && data.charts.length > 0) {
      const tableHeight = data.data.length * 10 + 20; // Approximate table height
      
      this.doc.setFontSize(12);
      this.doc.text('Répartition des émissions par type de véhicule', this.margin, startY + tableHeight + 20);
      
      // In a real implementation, you would add the chart image here
      this.doc.setDrawColor(this.darkGray);
      this.doc.setFillColor(this.lightGray);
      this.doc.roundedRect(
        this.margin,
        startY + tableHeight + 25,
        this.pageWidth - (this.margin * 2),
        80,
        2,
        2,
        'FD'
      );
      
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        'Graphique des émissions',
        this.pageWidth / 2,
        startY + tableHeight + 65,
        { align: 'center' }
      );
    }
  }

  /**
   * Add performance comparison report content
   */
  private addPerformanceComparisonReport(data: ReportData): void {
    const startY = this.margin + 50;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Comparaison de performance', this.margin, startY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add table with performance data
    this.doc.autoTable({
      startY: startY + 10,
      head: [['Véhicule/Type', 'Consommation (L/100km)', 'Émissions (g/km)', 'Coût (€/km)', 'Score global']],
      body: data.data.map((item: any) => [
        item.vehicle,
        formatNumber(item.consumption, 2),
        formatNumber(item.emissions, 1),
        formatNumber(item.cost, 3),
        formatNumber(item.score, 1),
      ]),
      headStyles: {
        fillColor: this.primaryColor,
        textColor: '#FFFFFF',
        fontStyle: 'bold',
      },
      alternateRowStyles: {
        fillColor: this.lightGray,
      },
      margin: { left: this.margin, right: this.margin },
    });
    
    // Add chart placeholder if charts are included
    if (data.charts && data.charts.length > 0) {
      const tableHeight = data.data.length * 10 + 20; // Approximate table height
      
      this.doc.setFontSize(12);
      this.doc.text('Comparaison des performances', this.margin, startY + tableHeight + 20);
      
      // In a real implementation, you would add the chart image here
      this.doc.setDrawColor(this.darkGray);
      this.doc.setFillColor(this.lightGray);
      this.doc.roundedRect(
        this.margin,
        startY + tableHeight + 25,
        this.pageWidth - (this.margin * 2),
        80,
        2,
        2,
        'FD'
      );
      
      this.doc.setFontSize(10);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        'Graphique de performance',
        this.pageWidth / 2,
        startY + tableHeight + 65,
        { align: 'center' }
      );
    }
  }

  /**
   * Add generic report content
   */
  private addGenericReport(data: ReportData): void {
    const startY = this.margin + 50;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Rapport d\'analyse', this.margin, startY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add generic table with data
    if (data.data.length > 0) {
      const headers = Object.keys(data.data[0]);
      
      this.doc.autoTable({
        startY: startY + 10,
        head: [headers],
        body: data.data.map((item: any) => headers.map(header => item[header])),
        headStyles: {
          fillColor: this.primaryColor,
          textColor: '#FFFFFF',
          fontStyle: 'bold',
        },
        alternateRowStyles: {
          fillColor: this.lightGray,
        },
        margin: { left: this.margin, right: this.margin },
      });
    } else {
      this.doc.setFontSize(12);
      this.doc.text('Aucune donnée disponible pour ce rapport.', this.margin, startY + 20);
    }
  }

  /**
   * Add summary section
   */
  private addSummary(summary: string): void {
    // Add a new page if needed
    const currentY = this.doc.previousAutoTable ? this.doc.previousAutoTable.finalY + 20 : 150;
    
    // Add section title
    this.doc.setFontSize(14);
    this.doc.setTextColor(this.primaryColor);
    this.doc.text('Résumé et recommandations', this.margin, currentY);
    
    // Reset text color
    this.doc.setTextColor(this.textColor);
    
    // Add summary text
    this.doc.setFontSize(10);
    
    // Split summary into lines to fit the page width
    const textLines = this.doc.splitTextToSize(
      summary,
      this.pageWidth - (this.margin * 2)
    );
    
    this.doc.text(textLines, this.margin, currentY + 10);
  }

  /**
   * Add footer with page numbers
   */
  private addFooter(): void {
    const pageCount = this.doc.getNumberOfPages();
    
    for (let i = 1; i <= pageCount; i++) {
      this.doc.setPage(i);
      
      // Add page number
      this.doc.setFontSize(8);
      this.doc.setTextColor(this.darkGray);
      this.doc.text(
        `Page ${i} sur ${pageCount}`,
        this.pageWidth / 2,
        this.pageHeight - 10,
        { align: 'center' }
      );
      
      // Add company name and date
      this.doc.text(
        `COFICAB - ${new Date().toLocaleDateString()}`,
        this.margin,
        this.pageHeight - 10
      );
      
      // Add copyright
      this.doc.text(
        'Confidentiel - Usage interne uniquement',
        this.pageWidth - this.margin,
        this.pageHeight - 10,
        { align: 'right' }
      );
    }
  }
}
