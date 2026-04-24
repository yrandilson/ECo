import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import { toast } from 'sonner';

interface SimulationData {
  type: 'fire' | 'water' | 'pollution';
  params: Record<string, number>;
  result: number;
  timestamp?: string;
}

export function usePdfExport() {
  const exportSimulationPDF = async (
    simulationData: SimulationData,
    elementRef?: HTMLElement
  ) => {
    try {
      const doc = new jsPDF({
        orientation: 'portrait',
        unit: 'mm',
        format: 'a4',
      });

      const pageWidth = doc.internal.pageSize.getWidth();
      const pageHeight = doc.internal.pageSize.getHeight();
      let yPosition = 20;

      // Header
      doc.setFontSize(20);
      doc.setTextColor(34, 197, 94); // Green color
      doc.text('EcoMonitor', 20, yPosition);
      
      yPosition += 15;

      // Title
      doc.setFontSize(16);
      doc.setTextColor(0, 0, 0);
      const typeLabel = {
        fire: '🔥 Simulação de Incêndio',
        water: '💧 Simulação Hidrológica',
        pollution: '💨 Simulação de Poluição',
      }[simulationData.type];
      
      doc.text(typeLabel, 20, yPosition);
      yPosition += 12;

      // Date
      doc.setFontSize(10);
      doc.setTextColor(100, 100, 100);
      const date = simulationData.timestamp || new Date().toLocaleDateString('pt-BR');
      doc.text(`Data: ${date}`, 20, yPosition);
      yPosition += 10;

      // Results section
      doc.setFontSize(14);
      doc.setTextColor(0, 0, 0);
      doc.text('Resultados', 20, yPosition);
      yPosition += 8;

      // Risk/Result value
      doc.setFontSize(12);
      doc.setTextColor(220, 38, 38); // Red for risk
      const resultLabel = {
        fire: 'Risco de Propagação:',
        water: 'Disponibilidade Hídrica:',
        pollution: 'Concentração de Poluentes:',
      }[simulationData.type];
      
      doc.text(resultLabel, 20, yPosition);
      doc.setFontSize(28);
      doc.text(`${simulationData.result.toFixed(1)}%`, pageWidth - 40, yPosition);
      yPosition += 18;

      // Parameters
      doc.setFontSize(11);
      doc.setTextColor(0, 0, 0);
      doc.text('Parâmetros Utilizados:', 20, yPosition);
      yPosition += 7;

      doc.setFontSize(9);
      doc.setTextColor(60, 60, 60);
      
      Object.entries(simulationData.params).forEach(([key, value]) => {
        const label = key
          .replace(/([A-Z])/g, ' $1')
          .replace(/^./, str => str.toUpperCase());
        doc.text(`• ${label}: ${value}`, 25, yPosition);
        yPosition += 6;
      });

      yPosition += 5;

      // Chart image if provided
      if (elementRef) {
        try {
          const canvas = await html2canvas(elementRef, {
            backgroundColor: '#ffffff',
            scale: 2,
          });
          
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 40;
          const imgHeight = (canvas.height * imgWidth) / canvas.width;

          if (yPosition + imgHeight > pageHeight - 20) {
            doc.addPage();
            yPosition = 20;
          }

          doc.addImage(imgData, 'PNG', 20, yPosition, imgWidth, imgHeight);
          yPosition += imgHeight + 10;
        } catch (error) {
          console.error('Erro ao capturar gráfico:', error);
        }
      }

      // Footer
      doc.setFontSize(8);
      doc.setTextColor(150, 150, 150);
      doc.text(
        'Gerado pelo EcoMonitor - Sistema de Simulações Ambientais',
        20,
        pageHeight - 10
      );

      // Save PDF
      const filename = `simulacao_${simulationData.type}_${new Date().getTime()}.pdf`;
      doc.save(filename);
      
      toast.success('PDF exportado com sucesso!');
    } catch (error) {
      console.error('Erro ao exportar PDF:', error);
      toast.error('Erro ao exportar PDF');
    }
  };

  return { exportSimulationPDF };
}
