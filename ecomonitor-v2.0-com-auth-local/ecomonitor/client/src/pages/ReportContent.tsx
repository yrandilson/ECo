import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { AlertCircle, CheckCircle, Flag, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import MainLayout from "@/components/MainLayout";

export default function ReportContent() {
  const [reportType, setReportType] = useState<string>("");
  const [contentType, setContentType] = useState<string>("post");
  const [contentId, setContentId] = useState<string>("");
  const [reason, setReason] = useState<string>("");
  const [description, setDescription] = useState<string>("");
  const [submitted, setSubmitted] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [reportId, setReportId] = useState<string>("");

  const reportTypes = [
    { id: "spam", label: "Spam", description: "Conteúdo repetitivo ou irrelevante" },
    { id: "harassment", label: "Assédio", description: "Conteúdo ofensivo ou ameaçador" },
    { id: "false_info", label: "Informação Falsa", description: "Conteúdo enganoso ou incorreto" },
    { id: "inappropriate", label: "Inapropriado", description: "Conteúdo adulto ou violento" },
    { id: "copyright", label: "Direitos Autorais", description: "Violação de direitos autorais" },
    { id: "other", label: "Outro", description: "Outro motivo não listado" },
  ];

  const createReport = trpc.reports.create.useMutation({
    onSuccess: (data) => {
      if (data.success && data.reportId) {
        setReportId(String(data.reportId));
        setSubmitted(true);
        toast.success(data.message);
      }
    },
    onError: (error) => {
      toast.error(error.message || "Erro ao enviar denúncia");
    },
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!reportType || !contentId || !reason) {
      toast.error("Preencha todos os campos obrigatórios");
      return;
    }

    setIsLoading(true);
    try {
      await createReport.mutateAsync({
        contentType: contentType as "post" | "comment" | "user" | "image" | "other",
        contentId,
        reportType: reportType as "spam" | "harassment" | "false_info" | "inappropriate" | "copyright" | "other",
        reason,
        description: description || undefined,
      });

      // Reset form após 3 segundos
      setTimeout(() => {
        setReportType("");
        setContentId("");
        setReason("");
        setDescription("");
        setContentType("post");
        setSubmitted(false);
        setReportId("");
      }, 3000);
    } catch (error) {
      console.error("Erro ao enviar denúncia:", error);
    } finally {
      setIsLoading(false);
    }
  };

  if (submitted) {
    return (
      <MainLayout>
        <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 flex items-center justify-center py-8">
          <Card className="shadow-lg border-0 max-w-md">
            <CardContent className="pt-6 text-center">
              <CheckCircle className="w-16 h-16 text-green-600 mx-auto mb-4" />
              <h2 className="text-2xl font-bold mb-2">Denúncia Enviada</h2>
              <p className="text-gray-600 dark:text-gray-300 mb-4">
                Obrigado por reportar! Nossa equipe analisará em breve.
              </p>
              <p className="text-sm text-gray-500">ID da denúncia: #{reportId || "..."}</p>
            </CardContent>
          </Card>
        </div>
      </MainLayout>
    );
  }

  return (
    <MainLayout>
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-blue-50 dark:from-slate-900 dark:to-slate-800 py-8">
        <div className="container mx-auto px-4 max-w-2xl">
          <div className="mb-8">
            <h1 className="text-4xl font-bold mb-2 bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
              Denunciar Conteúdo
            </h1>
            <p className="text-gray-600 dark:text-gray-300">
              Ajude-nos a manter a plataforma segura reportando conteúdo inapropriado
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Alert */}
            <Card className="shadow-lg border-0 bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500">
              <CardContent className="pt-6 flex gap-4">
                <AlertCircle className="w-6 h-6 text-blue-600 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="font-semibold text-blue-900 dark:text-blue-200 mb-1">
                    Sua denúncia é importante
                  </p>
                  <p className="text-sm text-blue-800 dark:text-blue-300">
                    Todas as denúncias são revisadas por nossa equipe de moderação. Não compartilhamos informações sobre quem reportou.
                  </p>
                </div>
              </CardContent>
            </Card>

            {/* Type Selection */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Flag className="w-5 h-5" />
                  Tipo de Denúncia
                </CardTitle>
                <CardDescription>Selecione o motivo da denúncia</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {reportTypes.map((type) => (
                    <button
                      key={type.id}
                      onClick={() => setReportType(type.id)}
                      type="button"
                      className={`p-4 rounded-lg border-2 transition-all text-left ${
                        reportType === type.id
                          ? "border-red-500 bg-red-50 dark:bg-red-900/20"
                          : "border-gray-200 dark:border-gray-700 hover:border-red-300"
                      }`}
                    >
                      <p className="font-semibold">{type.label}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400">{type.description}</p>
                    </button>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Content ID */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Identificar Conteúdo</CardTitle>
                <CardDescription>Qual conteúdo você está denunciando?</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Tipo de Conteúdo</label>
                  <div className="flex gap-2 flex-wrap">
                    {[
                      { id: "post", label: "Ocorrência" },
                      { id: "comment", label: "Comentário" },
                      { id: "image", label: "Foto" },
                      { id: "user", label: "Usuário" },
                      { id: "other", label: "Outro" },
                    ].map((type) => (
                      <Badge
                        key={type.id}
                        variant={contentType === type.id ? "default" : "outline"}
                        className="cursor-pointer hover:bg-red-50"
                        onClick={() => setContentType(type.id)}
                      >
                        {type.label}
                      </Badge>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">ID do Conteúdo</label>
                  <input
                    type="text"
                    placeholder="Ex: #12345 ou URL"
                    value={contentId}
                    onChange={(e) => setContentId(e.target.value)}
                    className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                    required
                  />
                </div>
              </CardContent>
            </Card>

            {/* Reason */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Motivo Específico</CardTitle>
                <CardDescription>Por que você está denunciando este conteúdo?</CardDescription>
              </CardHeader>
              <CardContent>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full px-4 py-2 border rounded-lg dark:bg-gray-800 dark:border-gray-700"
                  required
                >
                  <option value="">Selecione um motivo...</option>
                  <option value="Conteúdo violento">Conteúdo violento</option>
                  <option value="Discurso de ódio">Discurso de ódio</option>
                  <option value="Informação enganosa">Informação enganosa</option>
                  <option value="Spam">Spam</option>
                  <option value="Assédio">Assédio</option>
                  <option value="Outro motivo">Outro motivo</option>
                </select>
              </CardContent>
            </Card>

            {/* Description */}
            <Card className="shadow-lg border-0">
              <CardHeader>
                <CardTitle>Descrição Detalhada</CardTitle>
                <CardDescription>Forneça detalhes adicionais (opcional)</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  placeholder="Descreva por que você acredita que este conteúdo viola nossas políticas..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value.slice(0, 500))}
                  className="min-h-32"
                  maxLength={500}
                />
                <p className="text-xs text-gray-500 mt-2">{description.length}/500 caracteres</p>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <Button
              type="submit"
              disabled={isLoading}
              className="w-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 h-12 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  Enviando...
                </>
              ) : (
                <>
                  <Flag className="w-5 h-5 mr-2" />
                  Enviar Denúncia
                </>
              )}
            </Button>

            {/* Info */}
            <Card className="shadow-lg border-0 bg-gray-50 dark:bg-gray-800/50">
              <CardContent className="pt-6">
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Importante:</strong> Denúncias falsas ou abusivas podem resultar em restrições da sua conta. Certifique-se de que o conteúdo realmente viola nossas políticas.
                </p>
              </CardContent>
            </Card>
          </form>
        </div>
      </div>
    </MainLayout>
  );
}
