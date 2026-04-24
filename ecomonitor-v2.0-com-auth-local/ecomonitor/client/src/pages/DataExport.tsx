import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Checkbox } from "@/components/ui/checkbox";
import { Download, FileJson, FileText, Database } from "lucide-react";
import { toast } from "sonner";

import MainLayout from "@/components/MainLayout";
export default function DataExport() {
  const [selectedFormats, setSelectedFormats] = useState<string[]>(["json"]);
  const [selectedData, setSelectedData] = useState<string[]>(["occurrences", "validations"]);
  const [exporting, setExporting] = useState(false);

  const formats = [
    { id: "json", label: "JSON", description: "Formato estruturado", icon: FileJson },
    { id: "csv", label: "CSV", description: "Planilha Excel", icon: FileText },
    { id: "pdf", label: "PDF", description: "Relatório formatado", icon: FileText },
  ];

  const dataTypes = [
    { id: "occurrences", label: "Ocorrências", description: "Todos os registros de ocorrências" },
    { id: "validations", label: "Validações", description: "Histórico de validações" },
    { id: "simulations", label: "Simulações", description: "Resultados de simuladores" },
    { id: "activity", label: "Atividades", description: "Histórico de atividades" },
    { id: "badges", label: "Badges", description: "Badges conquistadas" },
    { id: "rankings", label: "Rankings", description: "Posição em rankings" },
  ];

  const toggleFormat = (id: string) => {
    setSelectedFormats((prev) =>
      prev.includes(id) ? prev.filter((f) => f !== id) : [...prev, id]
    );
  };

  const toggleData = (id: string) => {
    setSelectedData((prev) =>
      prev.includes(id) ? prev.filter((d) => d !== id) : [...prev, id]
    );
  };

  const handleExport = async () => {
    if (selectedFormats.length === 0) {
      toast.error("Selecione pelo menos um formato");
      return;
    }

    if (selectedData.length === 0) {
      toast.error("Selecione pelo menos um tipo de dado");
      return;
    }

    setExporting(true);

    try {
      // Simular exportação
      await new Promise((resolve) => setTimeout(resolve, 2000));

      // Simular download
      selectedFormats.forEach((format) => {
        const filename = `ecomonitor-export-${new Date().toISOString().split("T")[0]}.${format}`;
        const link = document.createElement("a");
        link.href = "#";
        link.download = filename;
        link.click();
      });

      toast.success("Dados exportados com sucesso!");
    } catch (error) {
      toast.error("Erro ao exportar dados");
    } finally {
      setExporting(false);
    }
  };

  return (
    <MainLayout>
<div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-blue-600 to-cyan-600 bg-clip-text text-transparent">
              Exportar Dados
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Baixe seus dados em diferentes formatos
            </p>
          </div>
  
          <div className="grid md:grid-cols-2 gap-6">
            {/* Format Selection */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileJson className="w-5 h-5" />
                  Formato de Exportação
                </CardTitle>
                <CardDescription>Escolha um ou mais formatos</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {formats.map((format) => {
                  const Icon = format.icon;
                  return (
                    <div
                      key={format.id}
                      className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                      onClick={() => toggleFormat(format.id)}
                    >
                      <Checkbox
                        checked={selectedFormats.includes(format.id)}
                        onChange={() => toggleFormat(format.id)}
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{format.label}</p>
                        <p className="text-sm text-gray-600 dark:text-gray-400">{format.description}</p>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>
  
            {/* Data Selection */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Database className="w-5 h-5" />
                  Tipos de Dados
                </CardTitle>
                <CardDescription>Selecione quais dados exportar</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {dataTypes.map((data) => (
                  <div
                    key={data.id}
                    className="flex items-start gap-3 p-3 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 cursor-pointer"
                    onClick={() => toggleData(data.id)}
                  >
                    <Checkbox
                      checked={selectedData.includes(data.id)}
                      onChange={() => toggleData(data.id)}
                    />
                    <div className="flex-1">
                      <p className="font-semibold">{data.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{data.description}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          </div>
  
          {/* Summary */}
          <Card className="shadow-lg border-0 mt-6">
            <CardHeader>
              <CardTitle>Resumo da Exportação</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm font-medium mb-2">Formatos Selecionados:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedFormats.map((format) => (
                    <Badge key={format} variant="secondary" className="uppercase">
                      {format}
                    </Badge>
                  ))}
                </div>
              </div>
  
              <div>
                <p className="text-sm font-medium mb-2">Dados a Exportar:</p>
                <div className="flex flex-wrap gap-2">
                  {selectedData.map((data) => (
                    <Badge key={data} variant="outline">
                      {dataTypes.find((d) => d.id === data)?.label}
                    </Badge>
                  ))}
                </div>
              </div>
  
              <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Tamanho estimado:</strong> ~2.5 MB
                </p>
                <p className="text-sm text-blue-900 dark:text-blue-200">
                  <strong>Tempo estimado:</strong> ~30 segundos
                </p>
              </div>
  
              <Button
                onClick={handleExport}
                disabled={exporting || selectedFormats.length === 0 || selectedData.length === 0}
                className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 hover:from-blue-700 hover:to-cyan-700 h-12 text-lg"
              >
                <Download className="w-5 h-5 mr-2" />
                {exporting ? "Exportando..." : "Exportar Agora"}
              </Button>
            </CardContent>
          </Card>
  
          {/* Info */}
          <Card className="shadow-lg border-0 mt-6 bg-gray-50 dark:bg-gray-800/50">
            <CardContent className="pt-6 space-y-3">
              <div>
                <p className="font-semibold mb-2">📋 Informações Importantes:</p>
                <ul className="text-sm text-gray-600 dark:text-gray-400 space-y-1 list-disc list-inside">
                  <li>Seus dados são exportados com criptografia</li>
                  <li>Você pode exportar a qualquer momento</li>
                  <li>Arquivos expiram após 30 dias</li>
                  <li>Máximo 5 exportações por dia</li>
                  <li>Dados pessoais são inclusos apenas em sua própria exportação</li>
                </ul>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </MainLayout>
  );
}
