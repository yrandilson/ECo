import { useEffect, useState } from "react";
import { Shield, CheckCircle2, X } from "lucide-react";
import { Link } from "wouter";

const CONSENT_KEY = "ecomonitor_lgpd_consent";
const CONSENT_VERSION = "1.0";

export default function LgpdConsentBanner() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const stored = localStorage.getItem(CONSENT_KEY);
    if (!stored) {
      setVisible(true);
    } else {
      try {
        const parsed = JSON.parse(stored);
        if (parsed.version !== CONSENT_VERSION) setVisible(true);
      } catch {
        setVisible(true);
      }
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ accepted: true, version: CONSENT_VERSION, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  const handleReject = () => {
    localStorage.setItem(
      CONSENT_KEY,
      JSON.stringify({ accepted: false, version: CONSENT_VERSION, date: new Date().toISOString() })
    );
    setVisible(false);
  };

  if (!visible) return null;

  return (
    <div
      className="fixed bottom-0 inset-x-0 z-[100] p-4 animate-in slide-in-from-bottom duration-500"
      role="dialog"
      aria-label="Consentimento de privacidade LGPD"
    >
      <div className="max-w-2xl mx-auto p-5 bg-white dark:bg-slate-900 rounded-2xl border border-slate-200 dark:border-slate-700 shadow-2xl shadow-black/10">
        <div className="flex items-start gap-4">
          <div className="p-2.5 bg-blue-100 dark:bg-blue-950/30 rounded-xl shrink-0">
            <Shield className="h-5 w-5 text-blue-600 dark:text-blue-400" />
          </div>

          <div className="flex-1 min-w-0">
            <h3 className="text-sm font-bold text-slate-900 dark:text-white mb-1">
              🔒 Sua privacidade é importante
            </h3>
            <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed mb-3">
              O EcoMonitor coleta dados de localização, fotos e informações de perfil para
              funcionamento da plataforma. Seus dados são protegidos conforme a{" "}
              <strong>LGPD (Lei nº 13.709/2018)</strong>. Nunca vendemos seus dados.
            </p>

            <div className="flex flex-wrap items-center gap-2">
              <button
                onClick={handleAccept}
                className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-emerald-500 to-green-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-emerald-500/20 hover:shadow-xl transition-all active:scale-[0.98]"
              >
                <CheckCircle2 className="h-3.5 w-3.5" />
                Aceitar e continuar
              </button>
              <button
                onClick={handleReject}
                className="flex items-center gap-1.5 px-4 py-2 bg-slate-100 dark:bg-slate-800 text-slate-600 dark:text-slate-300 text-xs font-bold rounded-xl hover:bg-slate-200 dark:hover:bg-slate-700 transition-all"
              >
                Apenas essenciais
              </button>
              <Link href="/privacy">
                <button className="px-3 py-2 text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline">
                  Ler política completa →
                </button>
              </Link>
            </div>
          </div>

          <button
            onClick={handleReject}
            className="p-1.5 text-slate-400 hover:text-slate-600 transition-colors shrink-0"
            aria-label="Fechar banner de privacidade"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
