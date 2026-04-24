import { useState, useMemo } from "react";
import {
  Scale, MapPin, Camera, Users, FileCheck, Send, ChevronRight, ChevronLeft,
  CheckCircle2, AlertTriangle, Shield, Phone, ExternalLink, Info, Download,
  Eye, EyeOff, Clock, Hash, TreePine, Flame, Droplets, Wind, Bug, Building,
  Landmark, FileText, Image, Video, Mic, X, Plus, Copy, Printer,
  CircleAlert, Leaf, Factory, Fish, Mountain, Trash2, Globe,
} from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";
import MainLayout from "@/components/MainLayout";

// ─── Types & Constants ───────────────────────────────────────────────

interface WitnessInfo {
  name: string;
  contact: string;
}

interface ComplaintData {
  // Step 1 — Tipo de infração
  category: string;
  subcategory: string;
  description: string;
  // Step 2 — Localização
  address: string;
  neighborhood: string;
  city: string;
  state: string;
  latitude: string;
  longitude: string;
  locationDetails: string;
  // Step 3 — Evidências
  evidenceFiles: { name: string; type: string; size: string }[];
  dateOccurred: string;
  timeOccurred: string;
  isRecurring: boolean;
  frequency: string;
  // Step 4 — Testemunhas
  witnesses: WitnessInfo[];
  isAnonymous: boolean;
  // Step 5 — Revisão & envio
  urgencyLevel: "normal" | "urgent" | "critical";
  targetOrgan: string;
  additionalNotes: string;
}

const INITIAL_DATA: ComplaintData = {
  category: "",
  subcategory: "",
  description: "",
  address: "",
  neighborhood: "",
  city: "Fortaleza",
  state: "CE",
  latitude: "",
  longitude: "",
  locationDetails: "",
  evidenceFiles: [],
  dateOccurred: "",
  timeOccurred: "",
  isRecurring: false,
  frequency: "",
  witnesses: [],
  isAnonymous: false,
  urgencyLevel: "normal",
  targetOrgan: "",
  additionalNotes: "",
};

const INFRACTION_CATEGORIES = [
  {
    id: "fauna",
    label: "Crimes contra a Fauna",
    icon: <Bug className="h-5 w-5" />,
    color: "text-amber-600",
    bg: "bg-amber-50 dark:bg-amber-950/20 border-amber-200 dark:border-amber-800",
    bgSelected: "bg-amber-100 dark:bg-amber-950/40 border-amber-400 dark:border-amber-600 ring-2 ring-amber-300",
    law: "Art. 29-37, Lei 9.605/98",
    subcategories: [
      "Caça ilegal / abate de animais silvestres",
      "Tráfico de animais",
      "Maus-tratos a animais",
      "Pesca em período de defeso",
      "Destruição de ninhos / criadouros",
    ],
  },
  {
    id: "flora",
    label: "Crimes contra a Flora",
    icon: <TreePine className="h-5 w-5" />,
    color: "text-emerald-600",
    bg: "bg-emerald-50 dark:bg-emerald-950/20 border-emerald-200 dark:border-emerald-800",
    bgSelected: "bg-emerald-100 dark:bg-emerald-950/40 border-emerald-400 dark:border-emerald-600 ring-2 ring-emerald-300",
    law: "Art. 38-53, Lei 9.605/98",
    subcategories: [
      "Desmatamento ilegal",
      "Queimada não autorizada",
      "Extração ilegal de madeira",
      "Destruição de APP (Área de Preservação Permanente)",
      "Corte de árvores em área urbana sem autorização",
    ],
  },
  {
    id: "pollution",
    label: "Poluição",
    icon: <Factory className="h-5 w-5" />,
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-950/20 border-purple-200 dark:border-purple-800",
    bgSelected: "bg-purple-100 dark:bg-purple-950/40 border-purple-400 dark:border-purple-600 ring-2 ring-purple-300",
    law: "Art. 54-61, Lei 9.605/98",
    subcategories: [
      "Descarte irregular de resíduos / lixo",
      "Poluição de rios / córregos / lagos",
      "Emissão de poluentes atmosféricos",
      "Poluição sonora excessiva",
      "Contaminação do solo",
      "Despejo de esgoto irregular",
    ],
  },
  {
    id: "urban",
    label: "Ordenamento Urbano",
    icon: <Building className="h-5 w-5" />,
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-950/20 border-blue-200 dark:border-blue-800",
    bgSelected: "bg-blue-100 dark:bg-blue-950/40 border-blue-400 dark:border-blue-600 ring-2 ring-blue-300",
    law: "Art. 62-65, Lei 9.605/98",
    subcategories: [
      "Construção irregular em área protegida",
      "Ocupação de mangue / dunas",
      "Pichação de patrimônio natural",
      "Obstrução de curso d'água",
      "Aterramento ilegal de área alagável",
    ],
  },
  {
    id: "water",
    label: "Recursos Hídricos",
    icon: <Fish className="h-5 w-5" />,
    color: "text-cyan-600",
    bg: "bg-cyan-50 dark:bg-cyan-950/20 border-cyan-200 dark:border-cyan-800",
    bgSelected: "bg-cyan-100 dark:bg-cyan-950/40 border-cyan-400 dark:border-cyan-600 ring-2 ring-cyan-300",
    law: "Lei 9.433/97 (Política Nacional de Recursos Hídricos)",
    subcategories: [
      "Captação irregular de água",
      "Contaminação de manancial",
      "Destruição de nascente",
      "Alteração de curso d'água sem autorização",
      "Pesca com uso de explosivos / substâncias tóxicas",
    ],
  },
];

const TARGET_ORGANS = [
  { id: "ibama", name: "IBAMA", desc: "Inst. Brasileiro do Meio Ambiente", phone: "0800-618-080" },
  { id: "icmbio", name: "ICMBio", desc: "Inst. Chico Mendes de Conservação", phone: "(61) 2028-9280" },
  { id: "semace", name: "SEMACE", desc: "Superintendência Estadual do Meio Ambiente — CE", phone: "(85) 3101-5520" },
  { id: "seuma", name: "SEUMA", desc: "Secretaria Municipal de Urbanismo e Meio Ambiente", phone: "(85) 3452-6900" },
  { id: "mp", name: "Ministério Público", desc: "Promotoria de Meio Ambiente", phone: "(85) 3452-3800" },
  { id: "pm_ambiental", name: "Polícia Ambiental", desc: "Batalhão de Policiamento Ambiental", phone: "190" },
];

const STEPS = [
  { id: 1, label: "Infração", icon: <Scale className="h-4 w-4" /> },
  { id: 2, label: "Local", icon: <MapPin className="h-4 w-4" /> },
  { id: 3, label: "Evidências", icon: <Camera className="h-4 w-4" /> },
  { id: 4, label: "Testemunhas", icon: <Users className="h-4 w-4" /> },
  { id: 5, label: "Revisão", icon: <FileCheck className="h-4 w-4" /> },
];

// ─── Utility ─────────────────────────────────────────────────────────

function generateProtocol(): string {
  const now = new Date();
  const y = now.getFullYear().toString().slice(2);
  const m = String(now.getMonth() + 1).padStart(2, "0");
  const d = String(now.getDate()).padStart(2, "0");
  const rand = Math.random().toString(36).substring(2, 8).toUpperCase();
  return `ECO-${y}${m}${d}-${rand}`;
}

// ─── Step Components ─────────────────────────────────────────────────

function StepInfraction({ data, onChange }: { data: ComplaintData; onChange: (d: Partial<ComplaintData>) => void }) {
  const selectedCat = INFRACTION_CATEGORIES.find(c => c.id === data.category);

  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Tipo de Infração Ambiental</h3>
        <p className="text-xs text-slate-400 mb-3">Selecione a categoria com base na Lei 9.605/98 (Lei de Crimes Ambientais)</p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {INFRACTION_CATEGORIES.map(cat => (
            <button
              key={cat.id}
              onClick={() => onChange({ category: cat.id, subcategory: "" })}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                data.category === cat.id ? cat.bgSelected : cat.bg + " hover:opacity-80"
              }`}
            >
              <span className={cat.color}>{cat.icon}</span>
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{cat.label}</div>
                <div className="text-[10px] text-slate-400 truncate">{cat.law}</div>
              </div>
              {data.category === cat.id && <CheckCircle2 className="h-4 w-4 text-emerald-500 flex-shrink-0" />}
            </button>
          ))}
        </div>
      </div>

      {selectedCat && (
        <div className="animate-in slide-in-from-top-2 duration-200">
          <h4 className="text-xs font-bold text-slate-600 dark:text-slate-300 mb-2">Especifique a infração</h4>
          <div className="space-y-1.5">
            {selectedCat.subcategories.map((sub, i) => (
              <button
                key={i}
                onClick={() => onChange({ subcategory: sub })}
                className={`w-full text-left px-3 py-2.5 rounded-lg text-xs transition-all border ${
                  data.subcategory === sub
                    ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600 text-indigo-700 dark:text-indigo-300 font-bold"
                    : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 text-slate-600 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-800"
                }`}
              >
                <div className="flex items-center gap-2">
                  {data.subcategory === sub ? <CheckCircle2 className="h-3.5 w-3.5 text-indigo-500" /> : <div className="h-3.5 w-3.5 rounded-full border-2 border-slate-300 dark:border-slate-600" />}
                  {sub}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}

      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1.5">
          Descreva a infração detalhadamente *
        </label>
        <textarea
          value={data.description}
          onChange={e => onChange({ description: e.target.value })}
          placeholder="Descreva o que observou, quando ocorreu, quem são os possíveis responsáveis..."
          className="w-full h-28 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-indigo-300 focus:border-indigo-400 outline-none transition-all"
        />
        <p className="text-[10px] text-slate-400 mt-1">Mínimo 30 caracteres. Quanto mais detalhes, melhor a investigação.</p>
      </div>
    </div>
  );
}

function StepLocation({ data, onChange }: { data: ComplaintData; onChange: (d: Partial<ComplaintData>) => void }) {
  const handleGetGPS = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        pos => {
          onChange({
            latitude: pos.coords.latitude.toFixed(6),
            longitude: pos.coords.longitude.toFixed(6),
          });
        },
        () => alert("Não foi possível obter localização. Verifique as permissões do navegador.")
      );
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Localização da Infração</h3>
        <p className="text-xs text-slate-400 mb-3">Informe o local exato onde foi observada a infração ambiental</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div className="sm:col-span-2">
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Endereço / Referência *</label>
          <input
            type="text"
            value={data.address}
            onChange={e => onChange({ address: e.target.value })}
            placeholder="Rua, número ou ponto de referência"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Bairro</label>
          <input
            type="text"
            value={data.neighborhood}
            onChange={e => onChange({ neighborhood: e.target.value })}
            placeholder="Ex: Aldeota"
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-2">
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Cidade</label>
            <input
              type="text"
              value={data.city}
              onChange={e => onChange({ city: e.target.value })}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">UF</label>
            <input
              type="text"
              value={data.state}
              onChange={e => onChange({ state: e.target.value })}
              maxLength={2}
              className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
            />
          </div>
        </div>
      </div>

      {/* GPS */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between mb-2">
          <span className="text-xs font-bold text-blue-600 dark:text-blue-400 flex items-center gap-1.5">
            <MapPin className="h-3.5 w-3.5" /> Coordenadas GPS
          </span>
          <button
            onClick={handleGetGPS}
            className="text-[10px] font-bold bg-blue-600 text-white px-2.5 py-1 rounded-lg hover:bg-blue-700 transition-colors"
          >
            📍 Obter automático
          </button>
        </div>
        <div className="grid grid-cols-2 gap-2">
          <input
            type="text"
            value={data.latitude}
            onChange={e => onChange({ latitude: e.target.value })}
            placeholder="Latitude (ex: -3.731862)"
            className="px-2.5 py-2 text-xs rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300 outline-none"
          />
          <input
            type="text"
            value={data.longitude}
            onChange={e => onChange({ longitude: e.target.value })}
            placeholder="Longitude (ex: -38.526670)"
            className="px-2.5 py-2 text-xs rounded-lg border border-blue-200 dark:border-blue-800 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-blue-300 outline-none"
          />
        </div>
        <p className="text-[10px] text-blue-400 mt-1.5">Coordenadas GPS fortalecem a denúncia e facilitam a fiscalização.</p>
      </div>

      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Detalhes adicionais do local</label>
        <textarea
          value={data.locationDetails}
          onChange={e => onChange({ locationDetails: e.target.value })}
          placeholder="Pontos de referência, como chegar, detalhes que ajudem a localizar..."
          className="w-full h-20 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      </div>
    </div>
  );
}

function StepEvidence({ data, onChange }: { data: ComplaintData; onChange: (d: Partial<ComplaintData>) => void }) {
  const addFile = () => {
    const fakeFiles = [
      { name: "foto_evidencia_01.jpg", type: "image", size: "2.4 MB" },
      { name: "video_local.mp4", type: "video", size: "15.8 MB" },
      { name: "audio_testemunho.m4a", type: "audio", size: "1.1 MB" },
      { name: "foto_evidencia_02.jpg", type: "image", size: "3.1 MB" },
    ];
    const next = fakeFiles[data.evidenceFiles.length % fakeFiles.length];
    onChange({ evidenceFiles: [...data.evidenceFiles, next] });
  };

  const removeFile = (index: number) => {
    onChange({ evidenceFiles: data.evidenceFiles.filter((_, i) => i !== index) });
  };

  const fileIcon = (type: string) => {
    switch (type) {
      case "image": return <Image className="h-4 w-4 text-emerald-500" />;
      case "video": return <Video className="h-4 w-4 text-blue-500" />;
      case "audio": return <Mic className="h-4 w-4 text-purple-500" />;
      default: return <FileText className="h-4 w-4 text-slate-400" />;
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Evidências e Provas</h3>
        <p className="text-xs text-slate-400 mb-3">Anexe fotos, vídeos ou áudios que comprovem a infração</p>
      </div>

      {/* Upload area */}
      <button
        onClick={addFile}
        className="w-full border-2 border-dashed border-slate-300 dark:border-slate-600 rounded-2xl p-8 text-center hover:border-indigo-400 hover:bg-indigo-50/50 dark:hover:bg-indigo-950/10 transition-all group"
      >
        <div className="inline-flex p-3 rounded-2xl bg-slate-100 dark:bg-slate-800 group-hover:bg-indigo-100 dark:group-hover:bg-indigo-900/30 transition-colors mb-2">
          <Camera className="h-6 w-6 text-slate-400 group-hover:text-indigo-500 transition-colors" />
        </div>
        <p className="text-sm font-bold text-slate-500 group-hover:text-indigo-600 transition-colors">Clique para anexar evidências</p>
        <p className="text-[10px] text-slate-400 mt-1">Fotos (JPG, PNG), Vídeos (MP4), Áudios (M4A) — máx. 50MB cada</p>
      </button>

      {/* File list */}
      {data.evidenceFiles.length > 0 && (
        <div className="space-y-2">
          {data.evidenceFiles.map((file, i) => (
            <div key={i} className="flex items-center gap-3 p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
              {fileIcon(file.type)}
              <div className="flex-1 min-w-0">
                <p className="text-xs font-bold text-slate-700 dark:text-slate-200 truncate">{file.name}</p>
                <p className="text-[10px] text-slate-400">{file.size}</p>
              </div>
              <button onClick={() => removeFile(i)} className="p-1 rounded-lg hover:bg-red-50 dark:hover:bg-red-950/20 text-slate-400 hover:text-red-500 transition-colors">
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Date & Time */}
      <div className="grid grid-cols-2 gap-3">
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Data da ocorrência *</label>
          <input
            type="date"
            value={data.dateOccurred}
            onChange={e => onChange({ dateOccurred: e.target.value })}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>
        <div>
          <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Horário aproximado</label>
          <input
            type="time"
            value={data.timeOccurred}
            onChange={e => onChange({ timeOccurred: e.target.value })}
            className="w-full px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 focus:ring-2 focus:ring-indigo-300 outline-none"
          />
        </div>
      </div>

      {/* Recurring */}
      <div className="p-3 bg-amber-50 dark:bg-amber-950/20 rounded-xl border border-amber-200 dark:border-amber-800">
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isRecurring}
            onChange={e => onChange({ isRecurring: e.target.checked })}
            className="w-4 h-4 rounded border-amber-300 text-amber-500 focus:ring-amber-300"
          />
          <div>
            <span className="text-xs font-bold text-amber-700 dark:text-amber-400">Infração recorrente</span>
            <p className="text-[10px] text-amber-500">Marque se esta infração ocorre repetidamente</p>
          </div>
        </label>
        {data.isRecurring && (
          <input
            type="text"
            value={data.frequency}
            onChange={e => onChange({ frequency: e.target.value })}
            placeholder="Ex: Todo sábado à noite, diariamente pela manhã..."
            className="mt-2 w-full px-3 py-2 text-xs rounded-lg border border-amber-200 dark:border-amber-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-amber-300 outline-none"
          />
        )}
      </div>
    </div>
  );
}

function StepWitnesses({ data, onChange }: { data: ComplaintData; onChange: (d: Partial<ComplaintData>) => void }) {
  const addWitness = () => {
    onChange({ witnesses: [...data.witnesses, { name: "", contact: "" }] });
  };

  const updateWitness = (index: number, field: keyof WitnessInfo, value: string) => {
    const updated = [...data.witnesses];
    updated[index] = { ...updated[index], [field]: value };
    onChange({ witnesses: updated });
  };

  const removeWitness = (index: number) => {
    onChange({ witnesses: data.witnesses.filter((_, i) => i !== index) });
  };

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Testemunhas e Identificação</h3>
        <p className="text-xs text-slate-400 mb-3">Testemunhas são opcionais mas fortalecem a denúncia</p>
      </div>

      {/* Anonymous toggle */}
      <div className={`p-4 rounded-xl border-2 transition-all ${
        data.isAnonymous
          ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600"
          : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700"
      }`}>
        <label className="flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            checked={data.isAnonymous}
            onChange={e => onChange({ isAnonymous: e.target.checked })}
            className="w-4 h-4 rounded border-indigo-300 text-indigo-500 focus:ring-indigo-300"
          />
          <div className="flex-1">
            <div className="flex items-center gap-2">
              {data.isAnonymous ? <EyeOff className="h-4 w-4 text-indigo-500" /> : <Eye className="h-4 w-4 text-slate-400" />}
              <span className="text-sm font-bold text-slate-700 dark:text-slate-200">Denúncia Anônima</span>
            </div>
            <p className="text-[10px] text-slate-400 mt-0.5">
              Seu nome não será revelado ao denunciado. Direito garantido pela Constituição Federal (Art. 5°, IV).
            </p>
          </div>
        </label>
      </div>

      {/* Witnesses list */}
      <div className="space-y-3">
        {data.witnesses.map((w, i) => (
          <div key={i} className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-slate-500">Testemunha {i + 1}</span>
              <button
                onClick={() => removeWitness(i)}
                className="text-[10px] text-red-500 hover:text-red-700 font-bold"
              >
                Remover
              </button>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="text"
                value={w.name}
                onChange={e => updateWitness(i, "name", e.target.value)}
                placeholder="Nome completo"
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 outline-none"
              />
              <input
                type="text"
                value={w.contact}
                onChange={e => updateWitness(i, "contact", e.target.value)}
                placeholder="Telefone ou email"
                className="px-3 py-2 text-xs rounded-lg border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 focus:ring-2 focus:ring-indigo-300 outline-none"
              />
            </div>
          </div>
        ))}

        <button
          onClick={addWitness}
          className="w-full flex items-center justify-center gap-2 p-3 rounded-xl border-2 border-dashed border-slate-300 dark:border-slate-600 text-xs font-bold text-slate-500 hover:text-indigo-600 hover:border-indigo-400 transition-all"
        >
          <Plus className="h-3.5 w-3.5" /> Adicionar testemunha
        </button>
      </div>

      <div className="p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
        <p className="text-[10px] text-slate-400 leading-relaxed">
          <strong>⚖️ Nota legal:</strong> A denúncia falsa ou caluniosa é crime previsto no Art. 339 do Código Penal.
          Denuncie apenas fatos que você presenciou ou tem evidências concretas.
        </p>
      </div>
    </div>
  );
}

function StepReview({ data, onChange, onSubmit }: { data: ComplaintData; onChange: (d: Partial<ComplaintData>) => void; onSubmit: () => void }) {
  const selectedCat = INFRACTION_CATEGORIES.find(c => c.id === data.category);

  return (
    <div className="space-y-4">
      <div>
        <h3 className="text-sm font-bold text-slate-700 dark:text-slate-200 mb-1">Revisão e Envio</h3>
        <p className="text-xs text-slate-400 mb-3">Revise os dados antes de formalizar a denúncia</p>
      </div>

      {/* Summary cards */}
      <div className="space-y-3">
        {/* Infraction */}
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Infração</div>
          <div className="flex items-center gap-2 mb-1">
            {selectedCat && <span className={selectedCat.color}>{selectedCat.icon}</span>}
            <span className="text-sm font-bold text-slate-800 dark:text-white">{selectedCat?.label || "—"}</span>
          </div>
          <p className="text-xs text-slate-600 dark:text-slate-300">{data.subcategory || "—"}</p>
          {data.description && <p className="text-xs text-slate-500 mt-1 line-clamp-2">{data.description}</p>}
        </div>

        {/* Location */}
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Local</div>
          <p className="text-xs font-bold text-slate-700 dark:text-slate-200">{data.address || "—"}</p>
          <p className="text-xs text-slate-500">{data.neighborhood}{data.neighborhood && ", "}{data.city}/{data.state}</p>
          {data.latitude && <p className="text-[10px] text-blue-500 mt-1">📍 {data.latitude}, {data.longitude}</p>}
        </div>

        {/* Evidence */}
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Evidências</div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {data.evidenceFiles.length} arquivo(s) anexado(s) · Data: {data.dateOccurred || "—"} {data.timeOccurred && `às ${data.timeOccurred}`}
          </p>
          {data.isRecurring && <p className="text-[10px] text-amber-500 mt-1">🔄 Recorrente: {data.frequency}</p>}
        </div>

        {/* Witnesses */}
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1.5">Testemunhas</div>
          <p className="text-xs text-slate-600 dark:text-slate-300">
            {data.isAnonymous ? "🔒 Denúncia anônima" : "👤 Identificada"} · {data.witnesses.length} testemunha(s)
          </p>
        </div>
      </div>

      {/* Urgency */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">Nível de Urgência</label>
        <div className="grid grid-cols-3 gap-2">
          {([
            { value: "normal" as const, label: "Normal", desc: "Até 30 dias", color: "bg-blue-50 border-blue-200 text-blue-600", selected: "bg-blue-100 border-blue-400 ring-2 ring-blue-300" },
            { value: "urgent" as const, label: "Urgente", desc: "Até 7 dias", color: "bg-amber-50 border-amber-200 text-amber-600", selected: "bg-amber-100 border-amber-400 ring-2 ring-amber-300" },
            { value: "critical" as const, label: "Crítico", desc: "Imediato", color: "bg-red-50 border-red-200 text-red-600", selected: "bg-red-100 border-red-400 ring-2 ring-red-300" },
          ]).map(u => (
            <button
              key={u.value}
              onClick={() => onChange({ urgencyLevel: u.value })}
              className={`p-3 rounded-xl border-2 text-center transition-all ${
                data.urgencyLevel === u.value ? u.selected : u.color + " hover:opacity-80"
              }`}
            >
              <div className="text-xs font-bold">{u.label}</div>
              <div className="text-[10px] opacity-70">{u.desc}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Target organ */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-2">Encaminhar para</label>
        <div className="space-y-1.5">
          {TARGET_ORGANS.map(org => (
            <button
              key={org.id}
              onClick={() => onChange({ targetOrgan: org.id })}
              className={`w-full flex items-center gap-3 p-3 rounded-xl border-2 text-left transition-all ${
                data.targetOrgan === org.id
                  ? "bg-indigo-50 dark:bg-indigo-950/20 border-indigo-300 dark:border-indigo-600"
                  : "bg-white dark:bg-slate-800/40 border-slate-200 dark:border-slate-700 hover:bg-slate-50 dark:hover:bg-slate-800"
              }`}
            >
              <Landmark className={`h-4 w-4 flex-shrink-0 ${data.targetOrgan === org.id ? "text-indigo-500" : "text-slate-400"}`} />
              <div className="flex-1 min-w-0">
                <div className="text-xs font-bold text-slate-700 dark:text-slate-200">{org.name}</div>
                <div className="text-[10px] text-slate-400">{org.desc}</div>
              </div>
              <a
                href={`tel:${org.phone}`}
                onClick={e => e.stopPropagation()}
                className="text-[10px] text-blue-500 hover:text-blue-700 font-bold flex items-center gap-1"
                aria-label={`Ligar para ${org.name}: ${org.phone}`}
              >
                <Phone className="h-3 w-3" /> {org.phone}
              </a>
            </button>
          ))}
        </div>
      </div>

      {/* Additional notes */}
      <div>
        <label className="text-xs font-bold text-slate-600 dark:text-slate-300 block mb-1">Observações adicionais</label>
        <textarea
          value={data.additionalNotes}
          onChange={e => onChange({ additionalNotes: e.target.value })}
          placeholder="Informações complementares para o órgão fiscalizador..."
          className="w-full h-20 px-3 py-2.5 text-sm rounded-xl border border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-800/60 text-slate-700 dark:text-slate-200 placeholder:text-slate-400 resize-none focus:ring-2 focus:ring-indigo-300 outline-none"
        />
      </div>

      {/* Legal notice */}
      <div className="p-3 bg-red-50 dark:bg-red-950/20 rounded-xl border border-red-200 dark:border-red-800">
        <p className="text-[10px] text-red-600 dark:text-red-400 leading-relaxed font-medium">
          ⚖️ <strong>Declaração Legal:</strong> Ao enviar esta denúncia, declaro que as informações prestadas são verdadeiras
          e estou ciente de que denúncia falsa constitui crime (Art. 339, Código Penal). A denúncia será registrada
          com base na Lei 9.605/98 (Crimes Ambientais) e Art. 225 da Constituição Federal.
        </p>
      </div>
    </div>
  );
}

// ─── Success Screen ──────────────────────────────────────────────────

function SuccessScreen({ protocol, data }: { protocol: string; data: ComplaintData }) {
  const selectedCat = INFRACTION_CATEGORIES.find(c => c.id === data.category);
  const targetOrg = TARGET_ORGANS.find(o => o.id === data.targetOrgan);

  const copyProtocol = () => {
    navigator.clipboard.writeText(protocol);
  };

  return (
    <div className="max-w-lg mx-auto text-center space-y-5 py-4">
      {/* Success icon */}
      <div className="inline-flex p-4 rounded-full bg-emerald-100 dark:bg-emerald-900/30">
        <CheckCircle2 className="h-12 w-12 text-emerald-500" />
      </div>

      <div>
        <h2 className="text-xl font-black text-slate-900 dark:text-white">Denúncia Registrada!</h2>
        <p className="text-sm text-slate-500 mt-1">Sua denúncia foi formalizada com sucesso</p>
      </div>

      {/* Protocol */}
      <div className="p-4 bg-indigo-50 dark:bg-indigo-950/20 rounded-2xl border-2 border-indigo-200 dark:border-indigo-700">
        <div className="text-[10px] font-bold text-indigo-400 uppercase tracking-wider mb-1">Número de Protocolo</div>
        <div className="flex items-center justify-center gap-2">
          <Hash className="h-5 w-5 text-indigo-500" />
          <span className="text-2xl font-black text-indigo-600 dark:text-indigo-300 tracking-wider font-mono">{protocol}</span>
        </div>
        <button
          onClick={copyProtocol}
          className="mt-2 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 flex items-center justify-center gap-1 mx-auto"
        >
          <Copy className="h-3 w-3" /> Copiar protocolo
        </button>
      </div>

      {/* Summary */}
      <div className="text-left space-y-2">
        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="flex items-center gap-2 text-xs">
            <span className={selectedCat?.color}>{selectedCat?.icon}</span>
            <span className="font-bold text-slate-700 dark:text-slate-200">{selectedCat?.label}</span>
            <span className="text-slate-400">·</span>
            <span className="text-slate-500">{data.subcategory}</span>
          </div>
        </div>

        {targetOrg && (
          <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
            <div className="flex items-center gap-2 text-xs">
              <Landmark className="h-4 w-4 text-indigo-500" />
              <span className="font-bold text-slate-700 dark:text-slate-200">Encaminhada para: {targetOrg.name}</span>
            </div>
          </div>
        )}

        <div className="p-3 bg-white dark:bg-slate-800/40 rounded-xl border border-slate-200 dark:border-slate-700">
          <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Timeline Esperada</div>
          <div className="flex items-center gap-4">
            {["Recebida", "Em Análise", "Encaminhada", "Fiscalização", "Resolvida"].map((step, i) => (
              <div key={i} className="flex items-center gap-1.5">
                <div className={`h-2.5 w-2.5 rounded-full ${i === 0 ? "bg-emerald-500" : "bg-slate-200 dark:bg-slate-600"}`} />
                <span className={`text-[9px] ${i === 0 ? "font-bold text-emerald-600" : "text-slate-400"}`}>{step}</span>
                {i < 4 && <ChevronRight className="h-2.5 w-2.5 text-slate-300" />}
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Legal info */}
      <div className="p-3 bg-blue-50 dark:bg-blue-950/20 rounded-xl text-left">
        <h4 className="text-xs font-bold text-blue-600 dark:text-blue-400 mb-1">📋 Guarde este protocolo</h4>
        <p className="text-[10px] text-slate-600 dark:text-slate-300 leading-relaxed">
          Use o número de protocolo para acompanhar sua denúncia junto ao órgão competente.
          Você pode ligar para {targetOrg?.phone || "o órgão"} e informar o código.
        </p>
      </div>
    </div>
  );
}

// ─── Main Page ───────────────────────────────────────────────────────

export default function FormalComplaint() {
  const { user } = useAuth();
  const [step, setStep] = useState(1);
  const [data, setData] = useState<ComplaintData>(INITIAL_DATA);
  const [submitted, setSubmitted] = useState(false);
  const [protocol, setProtocol] = useState("");

  const updateData = (partial: Partial<ComplaintData>) => {
    setData(prev => ({ ...prev, ...partial }));
  };

  const canProceed = useMemo(() => {
    switch (step) {
      case 1: return data.category && data.subcategory && data.description.length >= 30;
      case 2: return data.address.length > 0;
      case 3: return data.dateOccurred.length > 0;
      case 4: return true; // witnesses optional
      case 5: return data.targetOrgan.length > 0;
      default: return false;
    }
  }, [step, data]);

  const handleSubmit = () => {
    const proto = generateProtocol();
    setProtocol(proto);
    setSubmitted(true);
  };

  const handleReset = () => {
    setData(INITIAL_DATA);
    setStep(1);
    setSubmitted(false);
    setProtocol("");
  };

  return (
    <MainLayout>
      <div className="max-w-2xl mx-auto pb-12">
        {/* Hero */}
        <div className="relative p-5 rounded-2xl bg-gradient-to-br from-indigo-600 via-purple-600 to-violet-600 overflow-hidden mb-6">
          <div className="absolute top-0 right-0 w-36 h-36 bg-white/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/2" />
          <div className="absolute bottom-0 left-0 w-28 h-28 bg-purple-300/20 rounded-full blur-2xl translate-y-1/2 -translate-x-1/2" />
          <div className="relative flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-white/20 backdrop-blur-sm">
              <Scale className="h-6 w-6 text-white" />
            </div>
            <div>
              <h1 className="text-xl font-black text-white">Denúncia Formal</h1>
              <p className="text-indigo-200 text-xs">Lei 9.605/98 — Crimes Ambientais · Art. 225 CF</p>
            </div>
          </div>
        </div>

        {submitted ? (
          <>
            <SuccessScreen protocol={protocol} data={data} />
            <div className="flex justify-center mt-6">
              <button
                onClick={handleReset}
                className="px-6 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors"
              >
                Nova Denúncia
              </button>
            </div>
          </>
        ) : (
          <>
            {/* Stepper */}
            <div className="flex items-center gap-1 mb-6 px-1">
              {STEPS.map((s, i) => {
                const isActive = s.id === step;
                const isDone = s.id < step;
                return (
                  <div key={s.id} className="flex items-center flex-1">
                    <button
                      onClick={() => s.id < step && setStep(s.id)}
                      disabled={s.id > step}
                      className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-xs font-bold transition-all flex-1 justify-center ${
                        isActive
                          ? "bg-indigo-100 dark:bg-indigo-950/30 text-indigo-600 dark:text-indigo-300 ring-2 ring-indigo-300"
                          : isDone
                          ? "bg-emerald-50 dark:bg-emerald-950/20 text-emerald-600 cursor-pointer hover:bg-emerald-100"
                          : "bg-slate-100 dark:bg-slate-800 text-slate-400"
                      }`}
                    >
                      {isDone ? <CheckCircle2 className="h-3.5 w-3.5" /> : s.icon}
                      <span className="hidden sm:inline">{s.label}</span>
                    </button>
                    {i < STEPS.length - 1 && (
                      <ChevronRight className={`h-3.5 w-3.5 mx-0.5 flex-shrink-0 ${isDone ? "text-emerald-400" : "text-slate-300"}`} />
                    )}
                  </div>
                );
              })}
            </div>

            {/* Step Content */}
            <div className="bg-white dark:bg-slate-900/80 border border-slate-200/60 dark:border-white/5 rounded-2xl p-5">
              {step === 1 && <StepInfraction data={data} onChange={updateData} />}
              {step === 2 && <StepLocation data={data} onChange={updateData} />}
              {step === 3 && <StepEvidence data={data} onChange={updateData} />}
              {step === 4 && <StepWitnesses data={data} onChange={updateData} />}
              {step === 5 && <StepReview data={data} onChange={updateData} onSubmit={handleSubmit} />}
            </div>

            {/* Navigation */}
            <div className="flex items-center justify-between mt-4">
              <button
                onClick={() => setStep(Math.max(1, step - 1))}
                disabled={step === 1}
                className="flex items-center gap-1.5 px-4 py-2.5 text-sm font-bold text-slate-500 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors disabled:opacity-30 disabled:cursor-not-allowed"
              >
                <ChevronLeft className="h-4 w-4" /> Voltar
              </button>

              <div className="text-[10px] text-slate-400 font-bold">
                Etapa {step} de {STEPS.length}
              </div>

              {step < 5 ? (
                <button
                  onClick={() => setStep(Math.min(5, step + 1))}
                  disabled={!canProceed}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  Próximo <ChevronRight className="h-4 w-4" />
                </button>
              ) : (
                <button
                  onClick={handleSubmit}
                  disabled={!canProceed}
                  className="flex items-center gap-1.5 px-5 py-2.5 text-sm font-bold bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl hover:from-indigo-700 hover:to-purple-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed shadow-lg shadow-indigo-500/20"
                >
                  <Send className="h-4 w-4" /> Formalizar Denúncia
                </button>
              )}
            </div>

            {/* Quick contact strip */}
            <div className="mt-6 p-3 bg-slate-50 dark:bg-slate-800/30 rounded-xl">
              <div className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-2">Contatos diretos de emergência</div>
              <div className="flex flex-wrap gap-2">
                {[
                  { label: "IBAMA", phone: "0800-618-080", color: "bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400" },
                  { label: "Polícia Ambiental", phone: "190", color: "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400" },
                  { label: "Disque Denúncia", phone: "181", color: "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400" },
                  { label: "MP-CE", phone: "(85) 3452-3800", color: "bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400" },
                ].map((c, i) => (
                  <a
                    key={i}
                    href={`tel:${c.phone}`}
                    className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-bold ${c.color} hover:opacity-80 transition-opacity`}
                    aria-label={`Ligar para ${c.label}: ${c.phone}`}
                  >
                    <Phone className="h-3 w-3" /> {c.label}: {c.phone}
                  </a>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </MainLayout>
  );
}
