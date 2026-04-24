import { useEffect, useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge as BadgeUI } from '@/components/ui/badge';
import { trpc } from '@/lib/trpc';
import { toast } from 'sonner';
import { get3DViewsCount, getScenarioComparisonsCount } from '@/hooks/useBadgeTracking';

interface UserBadge {
  id: string;
  name: string;
  description: string;
  icon: string;
  condition: string;
  unlockedAt?: Date | null;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

const AVAILABLE_BADGES: UserBadge[] = [
  {
    id: 'first-simulation',
    name: 'Iniciante',
    description: 'Complete sua primeira simulação',
    icon: '🌱',
    condition: 'Salvar 1 simulação',
    rarity: 'common',
  },
  {
    id: 'fire-master',
    name: 'Mestre do Fogo',
    description: 'Complete 10 simulações de incêndio',
    icon: '🔥',
    condition: 'Salvar 10 simulações de incêndio',
    rarity: 'rare',
  },
  {
    id: 'water-expert',
    name: 'Protetor da Água',
    description: 'Complete 10 simulações hidrológicas',
    icon: '💧',
    condition: 'Salvar 10 simulações de hidrologia',
    rarity: 'rare',
  },
  {
    id: 'pollution-fighter',
    name: 'Ar Limpo',
    description: 'Complete 10 simulações de poluição',
    icon: '💨',
    condition: 'Salvar 10 simulações de poluição',
    rarity: 'rare',
  },
  {
    id: 'conservationist',
    name: 'Conservacionista',
    description: 'Complete 5 simulações de desflorestamento',
    icon: '🌲',
    condition: 'Salvar 5 simulações de desflorestamento',
    rarity: 'epic',
  },
  {
    id: 'water-quality-expert',
    name: 'Biólogo Aquático',
    description: 'Complete 5 simulações de qualidade de água',
    icon: '🧪',
    condition: 'Salvar 5 simulações de qualidade da água',
    rarity: 'epic',
  },
  {
    id: 'polymath',
    name: 'Polímata Ambiental',
    description: 'Complete simulações de todos os 5 tipos',
    icon: '🧠',
    condition: 'Completar simulações de todos os tipos',
    rarity: 'epic',
  },
  {
    id: 'simulator-master',
    name: 'Mestre dos Simuladores',
    description: 'Complete 50 simulações no total',
    icon: '👑',
    condition: 'Salvar 50 simulações',
    rarity: 'legendary',
  },
  {
    id: 'researcher',
    name: 'Pesquisador',
    description: 'Utilize a visualização 3D 10 vezes',
    icon: '🔬',
    condition: 'Usar visualização 3D 10 vezes',
    rarity: 'epic',
  },
  {
    id: 'analyst',
    name: 'Analista de Dados',
    description: 'Compare 20 cenários diferentes',
    icon: '📊',
    condition: 'Comparar 20 cenários',
    rarity: 'epic',
  },
];

const rarityColors = {
  common: 'bg-gray-100 dark:bg-gray-800 border-gray-300 dark:border-gray-600',
  rare: 'bg-blue-100 dark:bg-blue-900/30 border-blue-300 dark:border-blue-600',
  epic: 'bg-purple-100 dark:bg-purple-900/30 border-purple-300 dark:border-purple-600',
  legendary: 'bg-yellow-100 dark:bg-yellow-900/30 border-yellow-300 dark:border-yellow-600',
};

const rarityLabels = {
  common: 'Comum',
  rare: 'Raro',
  epic: 'Épico',
  legendary: 'Lendário',
};

export default function BadgeSystem() {
  const [unlockedBadges, setUnlockedBadges] = useState<string[]>([]);
  const [views3D, setViews3D] = useState(() => get3DViewsCount());
  const [comparisons, setComparisons] = useState(() => getScenarioComparisonsCount());
  const { data: simulations = [] } = trpc.simulations.getUserSimulations.useQuery({
    limit: 1000,
  });

  useEffect(() => {
    const on3D = () => setViews3D(get3DViewsCount());
    const onComp = () => setComparisons(getScenarioComparisonsCount());
    window.addEventListener('ecomonitor_3d_views_updated', on3D);
    window.addEventListener('ecomonitor_scenario_comparisons_updated', onComp);
    return () => {
      window.removeEventListener('ecomonitor_3d_views_updated', on3D);
      window.removeEventListener('ecomonitor_scenario_comparisons_updated', onComp);
    };
  }, []);

  // Calculate unlocked badges based on simulations + tracking
  useEffect(() => {
    const newUnlocked: string[] = [];

    // First simulation badge
    if (simulations && simulations.length >= 1) {
      newUnlocked.push('first-simulation');
    }

    // Type-specific badges (5 tipos: fire, water, pollution, deforestation, water-quality)
    const fireCount = (simulations || []).filter((s: any) => s.type === 'fire').length;
    const waterCount = (simulations || []).filter((s: any) => s.type === 'water').length;
    const pollutionCount = (simulations || []).filter((s: any) => s.type === 'pollution').length;
    const deforestationCount = (simulations || []).filter((s: any) => s.type === 'deforestation').length;
    const waterQualityCount = (simulations || []).filter((s: any) => s.type === 'water-quality').length;

    if (fireCount >= 10) newUnlocked.push('fire-master');
    if (waterCount >= 10) newUnlocked.push('water-expert');
    if (pollutionCount >= 10) newUnlocked.push('pollution-fighter');
    if (deforestationCount >= 5) newUnlocked.push('conservationist');
    if (waterQualityCount >= 5) newUnlocked.push('water-quality-expert');

    // Polymath: completar simulações dos 5 tipos
    if (fireCount > 0 && waterCount > 0 && pollutionCount > 0 && deforestationCount > 0 && waterQualityCount > 0) {
      newUnlocked.push('polymath');
    }

    // Master badge
    if (simulations && simulations.length >= 50) {
      newUnlocked.push('simulator-master');
    }

    // Researcher: usar visualização 3D 10 vezes
    if (views3D >= 10) newUnlocked.push('researcher');

    // Analyst: comparar 20 cenários
    if (comparisons >= 20) newUnlocked.push('analyst');

    // Check for new badges and show toast
    const previousUnlocked = unlockedBadges;
    newUnlocked.forEach((badge) => {
      if (!previousUnlocked.includes(badge)) {
        const badgeData = AVAILABLE_BADGES.find((b) => b.id === badge);
        if (badgeData) {
          toast.success(`🎉 Badge desbloqueado: ${badgeData.icon} ${badgeData.name}`);
        }
      }
    });

    setUnlockedBadges(newUnlocked);
  }, [simulations, views3D, comparisons]);

  const lockedBadges = AVAILABLE_BADGES.filter((b) => !unlockedBadges.includes(b.id));

  const getProgressText = (badgeId: string): string | null => {
    const fireCount = (simulations || []).filter((s: any) => s.type === 'fire').length;
    const waterCount = (simulations || []).filter((s: any) => s.type === 'water').length;
    const pollutionCount = (simulations || []).filter((s: any) => s.type === 'pollution').length;
    const deforestationCount = (simulations || []).filter((s: any) => s.type === 'deforestation').length;
    const waterQualityCount = (simulations || []).filter((s: any) => s.type === 'water-quality').length;
    const total = (simulations || []).length;
    const typesCompleted = [fireCount, waterCount, pollutionCount, deforestationCount, waterQualityCount].filter((c) => c > 0).length;

    switch (badgeId) {
      case 'first-simulation':
        return total >= 1 ? null : `0/1 simulação`;
      case 'fire-master':
        return fireCount >= 10 ? null : `${fireCount}/10 incêndio`;
      case 'water-expert':
        return waterCount >= 10 ? null : `${waterCount}/10 hidrologia`;
      case 'pollution-fighter':
        return pollutionCount >= 10 ? null : `${pollutionCount}/10 poluição`;
      case 'conservationist':
        return deforestationCount >= 5 ? null : `${deforestationCount}/5 desflorestamento`;
      case 'water-quality-expert':
        return waterQualityCount >= 5 ? null : `${waterQualityCount}/5 qualidade água`;
      case 'polymath':
        return typesCompleted >= 5 ? null : `${typesCompleted}/5 tipos`;
      case 'simulator-master':
        return total >= 50 ? null : `${total}/50 total`;
      case 'researcher':
        return views3D >= 10 ? null : `${views3D}/10 visualizações 3D`;
      case 'analyst':
        return comparisons >= 20 ? null : `${comparisons}/20 comparações`;
      default:
        return null;
    }
  };

  return (
    <div className="space-y-6">
      {/* Unlocked Badges */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-yellow-500 to-amber-500 text-white rounded-t-lg">
          <CardTitle className="flex items-center gap-2">
            <span>🏆</span> Badges Desbloqueados ({unlockedBadges.length}/{AVAILABLE_BADGES.length})
          </CardTitle>
          <CardDescription className="text-yellow-100">
            Simulações desbloqueadas por progresso
          </CardDescription>
        </CardHeader>

        <CardContent className="pt-6">
          {unlockedBadges.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-gray-500">Nenhum badge desbloqueado ainda</p>
              <p className="text-sm text-gray-400 mt-2">Complete simulações para desbloquear badges!</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {unlockedBadges.map((badgeId) => {
                const badge = AVAILABLE_BADGES.find((b) => b.id === badgeId)!;
                return (
                  <div
                    key={badge.id}
                    className={`${rarityColors[badge.rarity]} border-2 rounded-lg p-4 text-center hover:shadow-lg transition-shadow`}
                  >
                    <p className="text-4xl mb-2">{badge.icon}</p>
                    <p className="font-semibold text-sm">{badge.name}</p>
                    <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.description}</p>
                    <BadgeUI variant="secondary" className="mt-2 text-xs">
                      {rarityLabels[badge.rarity]}
                    </BadgeUI>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Locked Badges */}
      {lockedBadges.length > 0 && (
        <Card className="shadow-lg border-0">
          <CardHeader className="bg-gradient-to-r from-slate-500 to-gray-500 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-2">
              <span>🔒</span> Badges Bloqueados ({lockedBadges.length})
            </CardTitle>
            <CardDescription className="text-gray-100">
              Continue simulando para desbloquear esses badges
            </CardDescription>
          </CardHeader>

          <CardContent className="pt-6">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {lockedBadges.map((badge) => (
                <div
                  key={badge.id}
                  className="bg-gray-200 dark:bg-gray-700 border-2 border-gray-300 dark:border-gray-600 rounded-lg p-4 text-center opacity-50"
                >
                  <p className="text-4xl mb-2 filter grayscale">{badge.icon}</p>
                  <p className="font-semibold text-sm">{badge.name}</p>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mt-1">{badge.description}</p>
                  <div className="mt-2 p-2 bg-gray-100 dark:bg-gray-800 rounded text-xs font-mono">
                    <p className="text-gray-700 dark:text-gray-300">{badge.condition}</p>
                    {getProgressText(badge.id) && (
                      <p className="text-emerald-600 dark:text-emerald-400 mt-1 font-semibold">
                        Progresso: {getProgressText(badge.id)}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Badge Information */}
      <Card className="shadow-lg border-0">
        <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white rounded-t-lg">
          <CardTitle>Sistema de Badges</CardTitle>
        </CardHeader>
        <CardContent className="pt-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            {[
              {
                rarity: 'common',
                desc: 'Badges básicos, obtidos facilmente com pouca atividade',
                color: 'bg-gray-100 dark:bg-gray-800',
              },
              {
                rarity: 'rare',
                desc: 'Badges valiosos, obtidos com 10 simulações de um tipo',
                color: 'bg-blue-100 dark:bg-blue-900/30',
              },
              {
                rarity: 'epic',
                desc: 'Badges especiais, obtidos com progresso significativo',
                color: 'bg-purple-100 dark:bg-purple-900/30',
              },
              {
                rarity: 'legendary',
                desc: 'Badges lendários, obtidos com maestria completa',
                color: 'bg-yellow-100 dark:bg-yellow-900/30',
              },
            ].map(({ rarity, desc, color }) => (
              <div key={rarity} className={`${color} p-4 rounded-lg`}>
                <p className="font-semibold capitalize mb-1">{rarityLabels[rarity as keyof typeof rarityLabels]}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{desc}</p>
              </div>
            ))}
          </div>

          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">💡 Como Desbloquear</h4>
            <ul className="text-sm text-gray-600 dark:text-gray-300 space-y-1 list-disc list-inside">
              <li><strong>Simulações:</strong> Incêndio, Hidrologia, Poluição, Desflorestamento, Qualidade da Água</li>
              <li><strong>Pesquisador:</strong> Abra a aba 3D (visualização) 10 vezes</li>
              <li><strong>Analista:</strong> Compare 20 pares de cenários no Comparador</li>
              <li><strong>Polímata:</strong> Salve pelo menos 1 simulação de cada um dos 5 tipos</li>
            </ul>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
