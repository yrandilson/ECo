import { useState, useEffect, useCallback } from "react";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, MapPin, Loader2 } from "lucide-react";
import { toast } from "sonner";

// ─── Tipos ──────────────────────────────────────────────
interface Estado {
  id: number;
  sigla: string;
  nome: string;
}

interface Municipio {
  id: number;
  nome: string;
}

interface LocationSearchProps {
  onLocationSelect: (location: { lat: number; lng: number; label: string }) => void;
}

// Cache para evitar chamadas repetidas à API do IBGE
const estadosCache: { data: Estado[] | null } = { data: null };
const municipiosCache: Map<string, Municipio[]> = new Map();

// ─── Componente ─────────────────────────────────────────
export default function LocationSearch({ onLocationSelect }: LocationSearchProps) {
  const [estados, setEstados] = useState<Estado[]>([]);
  const [municipios, setMunicipios] = useState<Municipio[]>([]);

  const [estadoSelecionado, setEstadoSelecionado] = useState<string>("");
  const [municipioSelecionado, setMunicipioSelecionado] = useState<string>("");
  const [bairroOuLocal, setBairroOuLocal] = useState<string>("");

  const [loadingEstados, setLoadingEstados] = useState(false);
  const [loadingMunicipios, setLoadingMunicipios] = useState(false);
  const [loadingGeocode, setLoadingGeocode] = useState(false);

  // ─── Carregar Estados (IBGE API) ─────────────────────
  useEffect(() => {
    if (estadosCache.data) {
      setEstados(estadosCache.data);
      return;
    }

    setLoadingEstados(true);
    fetch("https://servicodados.ibge.gov.br/api/v1/localidades/estados?orderBy=nome")
      .then((res) => res.json())
      .then((data: Estado[]) => {
        estadosCache.data = data;
        setEstados(data);
      })
      .catch(() => {
        toast.error("Erro ao carregar lista de estados");
      })
      .finally(() => setLoadingEstados(false));
  }, []);

  // ─── Carregar Municípios quando Estado muda ───────────
  useEffect(() => {
    if (!estadoSelecionado) {
      setMunicipios([]);
      setMunicipioSelecionado("");
      return;
    }

    // Verificar cache
    if (municipiosCache.has(estadoSelecionado)) {
      setMunicipios(municipiosCache.get(estadoSelecionado)!);
      setMunicipioSelecionado("");
      return;
    }

    setLoadingMunicipios(true);
    setMunicipioSelecionado("");
    fetch(
      `https://servicodados.ibge.gov.br/api/v1/localidades/estados/${estadoSelecionado}/municipios?orderBy=nome`
    )
      .then((res) => res.json())
      .then((data: Municipio[]) => {
        municipiosCache.set(estadoSelecionado, data);
        setMunicipios(data);
      })
      .catch(() => {
        toast.error("Erro ao carregar municípios");
      })
      .finally(() => setLoadingMunicipios(false));
  }, [estadoSelecionado]);

  // ─── Geocodificar localização via Nominatim ───────────
  const handleSearch = useCallback(async () => {
    if (!estadoSelecionado || !municipioSelecionado) {
      toast.error("Selecione o estado e o município");
      return;
    }

    const estadoNome = estados.find((e) => String(e.id) === estadoSelecionado)?.nome || "";
    const municipioNome = municipios.find((m) => String(m.id) === municipioSelecionado)?.nome || "";

    // Montar query de busca
    const parts = [bairroOuLocal, municipioNome, estadoNome, "Brasil"].filter(Boolean);
    const query = parts.join(", ");

    setLoadingGeocode(true);
    try {
      const url = `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1&countrycodes=br`;
      const res = await fetch(url, {
        headers: { "Accept-Language": "pt-BR" },
      });
      const results = await res.json();

      if (results.length === 0) {
        // Tentar sem o bairro/local
        const fallbackQuery = [municipioNome, estadoNome, "Brasil"].join(", ");
        const fallbackRes = await fetch(
          `https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(fallbackQuery)}&limit=1&countrycodes=br`,
          { headers: { "Accept-Language": "pt-BR" } }
        );
        const fallbackResults = await fallbackRes.json();

        if (fallbackResults.length === 0) {
          toast.error("Localização não encontrada. Tente ajustar a busca.");
          return;
        }

        const { lat, lon, display_name } = fallbackResults[0];
        onLocationSelect({ lat: parseFloat(lat), lng: parseFloat(lon), label: display_name });
        toast.success(`📍 Localização encontrada: ${municipioNome}, ${estadoNome}`);
        return;
      }

      const { lat, lon, display_name } = results[0];
      onLocationSelect({ lat: parseFloat(lat), lng: parseFloat(lon), label: display_name });
      toast.success(`📍 ${display_name}`);
    } catch {
      toast.error("Erro ao buscar localização. Verifique sua conexão.");
    } finally {
      setLoadingGeocode(false);
    }
  }, [estadoSelecionado, municipioSelecionado, bairroOuLocal, estados, municipios, onLocationSelect]);

  return (
    <div className="space-y-3 p-4 bg-white dark:bg-slate-800 rounded-lg border border-gray-200 dark:border-gray-700">
      <div className="flex items-center gap-2 mb-2">
        <Search className="w-4 h-4 text-emerald-600" />
        <Label className="text-sm font-semibold text-emerald-700 dark:text-emerald-400">
          Busca rápida por localização
        </Label>
      </div>

      {/* Estado */}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Estado</Label>
        <Select value={estadoSelecionado} onValueChange={setEstadoSelecionado} disabled={loadingEstados}>
          <SelectTrigger className="w-full">
            <SelectValue placeholder={loadingEstados ? "Carregando estados..." : "Selecione o estado"} />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {estados.map((estado) => (
              <SelectItem key={estado.id} value={String(estado.id)}>
                {estado.sigla} - {estado.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Município */}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Município</Label>
        <Select
          value={municipioSelecionado}
          onValueChange={setMunicipioSelecionado}
          disabled={!estadoSelecionado || loadingMunicipios}
        >
          <SelectTrigger className="w-full">
            <SelectValue
              placeholder={
                !estadoSelecionado
                  ? "Selecione o estado primeiro"
                  : loadingMunicipios
                  ? "Carregando municípios..."
                  : "Selecione o município"
              }
            />
          </SelectTrigger>
          <SelectContent className="max-h-60">
            {municipios.map((mun) => (
              <SelectItem key={mun.id} value={String(mun.id)}>
                {mun.nome}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Bairro / Local (opcional) */}
      <div>
        <Label className="text-xs text-gray-500 mb-1 block">Bairro ou local (opcional)</Label>
        <Input
          placeholder="Ex: Centro, Parque Nacional, Av. Brasil..."
          value={bairroOuLocal}
          onChange={(e) => setBairroOuLocal(e.target.value)}
          disabled={!municipioSelecionado}
          onKeyDown={(e) => {
            if (e.key === "Enter") {
              e.preventDefault();
              handleSearch();
            }
          }}
        />
      </div>

      {/* Botão Buscar */}
      <Button
        type="button"
        onClick={handleSearch}
        disabled={!estadoSelecionado || !municipioSelecionado || loadingGeocode}
        className="w-full bg-emerald-600 hover:bg-emerald-700 text-white"
      >
        {loadingGeocode ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Buscando...
          </>
        ) : (
          <>
            <MapPin className="w-4 h-4 mr-2" />
            Localizar no mapa
          </>
        )}
      </Button>
    </div>
  );
}
