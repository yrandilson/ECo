import { useMemo, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { incrementScenarioComparisons } from '@/hooks/useBadgeTracking';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Heart, X } from 'lucide-react';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';

interface SimulationRecord {
  id: string;
  type: 'fire' | 'water' | 'pollution';
  parameters: Record<string, number>;
  results?: {
    risk?: number;
  };
  createdAt: Date | string;
}

export default function ScenarioComparator() {
  const [selectedScenarios, setSelectedScenarios] = useState<string[]>([]);
  const [favorites, setFavorites] = useState<string[]>([]);
  
  const { data: simulations = [] } = trpc.simulations.getUserSimulations.useQuery({
    limit: 100,
  });

  const selectedSims = useMemo(() => {
    return selectedScenarios
      .map((id: string) => (simulations as any[]).find((s: any) => String(s.id) === id))
      .filter(Boolean) as any[];
  }, [selectedScenarios, simulations]);

  const toggleSimulation = (id: string) => {
    if (selectedScenarios.includes(id)) {
      setSelectedScenarios(selectedScenarios.filter(s => s !== id));
    } else {
      if (selectedScenarios.length < 2) {
        const next = [...selectedScenarios, id];
        setSelectedScenarios(next);
        if (next.length === 2) {
          incrementScenarioComparisons();
        }
      } else {
        toast.info('Selecione apenas 2 simulações para comparar');
      }
    }
  };

  const toggleFavorite = (id: string) => {
    if (favorites.includes(id)) {
      setFavorites(favorites.filter(f => f !== id));
    } else {
      setFavorites([...favorites, id]);
    }
  };

  const calculateDifference = (val1: number | undefined, val2: number | undefined) => {
    if (!val1 || !val2) return '0';
    const diff = ((val2 - val1) / val1) * 100;
    return diff.toFixed(1);
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      fire: '🔥 Incêndio',
      water: '💧 Hidrologia',
      pollution: '💨 Poluição',
    };
    return labels[type] || type;
  };

  const getTypeColor = (type: string) => {
    const colors: Record<string, string> = {
      fire: 'bg-red-100 dark:bg-red-900/20 border-red-300',
      water: 'bg-blue-100 dark:bg-blue-900/20 border-blue-300',
      pollution: 'bg-purple-100 dark:bg-purple-900/20 border-purple-300',
    };
    return colors[type] || 'bg-gray-100';
  };

  return (
    <div className="space-y-6">
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <span>🔄</span> Comparador de Cenários
          </CardTitle>
          <CardDescription className="text-indigo-100">
            Selecione até 2 simulações para comparar lado a lado
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {(simulations || []).length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhuma simulação encontrada</p>
              <p className="text-sm text-gray-400 mt-2">Execute uma simulação para começar a comparar</p>
            </div>
          ) : (
            <div>
              <div className="mb-4">
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  Simulações Disponíveis ({selectedScenarios.length}/2 selecionadas)
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-96 overflow-y-auto">
                  {(simulations || []).map((sim: any) => (
                    <div
                      key={sim.id}
                      className={`p-4 rounded-lg border-2 cursor-pointer transition-all ${
                        selectedScenarios.includes(String(sim.id))
                          ? 'border-indigo-500 bg-indigo-50 dark:bg-indigo-900/20'
                          : `border-gray-200 ${getTypeColor(sim.type)}`
                      }`}
                      onClick={() => toggleSimulation(String(sim.id))}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <p className="font-semibold text-sm">{getTypeLabel(sim.type)}</p>
                          <p className="text-xs text-gray-500">
                            {new Date(sim.createdAt).toLocaleDateString('pt-BR')}
                          </p>
                        </div>
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={(e) => {
                            e.stopPropagation();
                            toggleFavorite(String(sim.id));
                          }}
                          className="p-1 h-auto"
                        >
                          <Heart
                            className={`w-4 h-4 ${
                              favorites.includes(String(sim.id)) ? 'fill-red-500 text-red-500' : ''
                            }`}
                          />
                        </Button>
                      </div>
                      <div className="bg-white/50 dark:bg-black/20 p-2 rounded text-xs font-mono">
                        Risco: <span className="font-bold text-red-600">{(sim.results?.risk || 0).toFixed(1)}%</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {selectedSims.length === 2 && (
        <div className="space-y-4">
          <h2 className="text-2xl font-bold text-gray-800 dark:text-gray-100">Comparação</h2>
          
          <div className="grid md:grid-cols-2 gap-6">
            {selectedSims.map((sim: SimulationRecord) => (
              <Card key={sim.id} className="shadow-lg border-0">
                <CardHeader className={`text-white rounded-t-lg ${getTypeColor(sim.type)}`}>
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle>{getTypeLabel(sim.type)}</CardTitle>
                      <CardDescription className="text-gray-300">
                        {new Date(sim.createdAt).toLocaleDateString('pt-BR', {
                          year: 'numeric',
                          month: 'long',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </CardDescription>
                    </div>
                    {favorites.includes(String(sim.id)) && (
                      <Heart className="w-5 h-5 fill-red-500 text-red-500" />
                    )}
                  </div>
                </CardHeader>

                <CardContent className="pt-6 space-y-4">
                  <div className="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-4 rounded-lg">
                    <p className="text-sm text-gray-600 dark:text-gray-300">Nível de Risco</p>
                    <p className="text-3xl font-bold text-red-600">
                      {(sim.results?.risk || 0).toFixed(1)}%
                    </p>
                  </div>

                  <div className="space-y-3">
                    <h4 className="font-semibold text-sm text-gray-700 dark:text-gray-300">Parâmetros</h4>
                    {Object.entries(sim.parameters || {}).map(([key, value]: [string, any]) => (
                      <div key={key} className="flex justify-between text-sm">
                        <span className="text-gray-600 dark:text-gray-400">
                          {key.replace(/([A-Z])/g, (str: string) => ` ${str}`).replace(/^./, str => str.toUpperCase())}:
                        </span>
                        <span className="font-semibold text-gray-800 dark:text-gray-200">{value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>

          <Card className="shadow-lg border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-lg">
              <CardTitle className="flex items-center gap-2">
                <span>📊</span> Análise de Diferenças
              </CardTitle>
            </CardHeader>

            <CardContent className="pt-6 space-y-4">
              <div className="bg-gray-50 dark:bg-gray-900/30 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-semibold">Diferença de Risco</span>
                  <Badge variant={
                    parseFloat(calculateDifference(selectedSims[0].results?.risk, selectedSims[1].results?.risk)) > 0
                      ? 'destructive'
                      : 'default'
                  }>
                    {parseFloat(calculateDifference(selectedSims[0].results?.risk, selectedSims[1].results?.risk)) > 0 ? '+' : ''}
                    {calculateDifference(selectedSims[0].results?.risk, selectedSims[1].results?.risk)}%
                  </Badge>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Simulação 2 é {Math.abs(parseFloat(calculateDifference(selectedSims[0].results?.risk, selectedSims[1].results?.risk)))}% 
                  {parseFloat(calculateDifference(selectedSims[0].results?.risk, selectedSims[1].results?.risk)) > 0 ? ' mais' : ' menos'} arriscada
                </p>
              </div>

              <div>
                <h4 className="font-semibold text-sm mb-3 text-gray-700 dark:text-gray-300">Variação de Parâmetros</h4>
                <div className="space-y-2 max-h-64 overflow-y-auto">
                  {Object.keys(selectedSims[0]?.parameters || {}).map((key) => {
                    const val1 = (selectedSims[0]?.parameters || {})[key];
                    const val2 = (selectedSims[1]?.parameters || {})[key];
                    const diff = (val2 || 0) - (val1 || 0);
                    const diffPercent = (((diff) / (val1 || 1)) * 100).toFixed(1);

                    return (
                      <div key={key} className="flex justify-between items-center p-2 bg-white dark:bg-slate-800 rounded border">
                        <span className="text-sm text-gray-600 dark:text-gray-400">
                          {key.replace(/([A-Z])/g, (str: string) => ` ${str}`).replace(/^./, str => str.toUpperCase())}
                        </span>
                        <div className="flex gap-3 items-center">
                          <span className="text-sm font-mono text-gray-500">{val1} → {val2}</span>
                          <Badge variant={diff > 0 ? 'destructive' : 'secondary'} className="w-16 justify-center">
                            {diff > 0 ? '+' : ''}{diffPercent}%
                          </Badge>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            </CardContent>
          </Card>

          <div className="flex gap-3">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setSelectedScenarios([])}
            >
              <X className="w-4 h-4 mr-2" />
              Limpar Seleção
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
