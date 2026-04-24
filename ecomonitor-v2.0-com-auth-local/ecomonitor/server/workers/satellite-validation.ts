/**
 * Worker para Validação Automática de Ocorrências via Satélite
 * 
 * Executa periodicamente para:
 * 1. Buscar ocorrências pendentes de validação
 * 2. Verificar com NASA FIRMS se há detecções de satélite
 * 3. Atualizar status da ocorrência
 * 4. Enviar notificações aos usuários
 * 
 * Executar como cron job: a cada 3 horas
 */

import { eq, and, sql } from 'drizzle-orm';
import { getDb } from '../db';
import { occurrences, users, alerts } from '../../drizzle/schema';
import { validateFireOccurrence, getFireDetections } from '../integrations/nasa-firms';

export interface ValidationJob {
  occurrenceId: number;
  latitude: number;
  longitude: number;
  createdAt: Date;
  userId: number;
}

/**
 * Processar validações pendentes
 */
export async function runSatelliteValidation(): Promise<{
  processed: number;
  validated: number;
  rejected: number;
  errors: number;
}> {
  console.log('[Satellite Validation] Iniciando job de validação...');
  
  const db = await getDb();
  if (!db) {
    console.error('[Satellite Validation] Database not available');
    return { processed: 0, validated: 0, rejected: 0, errors: 0 };
  }
  
  const stats = {
    processed: 0,
    validated: 0,
    rejected: 0,
    errors: 0,
  };

  try {
    // Buscar ocorrências de incêndio pendentes das últimas 48 horas
    // (NASA FIRMS tem dados com delay de até 3 horas)
    const pendingOccurrences = await db
      .select({
        id: occurrences.id,
        userId: occurrences.userId,
        latitude: occurrences.latitude,
        longitude: occurrences.longitude,
        createdAt: occurrences.createdAt,
        type: occurrences.type,
        riskScore: occurrences.riskScore,
      })
      .from(occurrences)
      .where(
        and(
          eq(occurrences.type, 'fire'),
          eq(occurrences.validatedBySatellite, false),
          eq(occurrences.status, 'pending'),
          sql`${occurrences.createdAt} >= DATE_SUB(NOW(), INTERVAL 48 HOUR)`
        )
      )
      .limit(50); // Processar 50 por vez para não sobrecarregar

    console.log(`[Satellite Validation] ${pendingOccurrences.length} ocorrências para validar`);

    for (const occurrence of pendingOccurrences) {
      stats.processed++;

      try {
        // Validar com NASA FIRMS
        const validation = await validateFireOccurrence(
          Number(occurrence.latitude),
          Number(occurrence.longitude),
          new Date(occurrence.createdAt),
          5, // 5km de raio
          48 // 48 horas de janela
        );

        console.log(
          `[Satellite Validation] Ocorrência #${occurrence.id}: ${validation.message}`
        );

        // Atualizar ocorrência
        if (validation.isValidated) {
          // Validada por satélite
          await db
            .update(occurrences)
            .set({
              validatedBySatellite: true,
              status: 'validated',
              riskScore: String(Math.max(Number(occurrence.riskScore || 0), validation.confidence)),
              updatedAt: new Date(),
            })
            .where(eq(occurrences.id, occurrence.id));

          stats.validated++;

          // Criar alerta para o usuário
          await db.insert(alerts).values({
            userId: occurrence.userId,
            occurrenceId: occurrence.id,
            type: 'validation',
            severity: 'medium',
            message: `Sua ocorrência #${occurrence.id} foi VALIDADA por satélite ${validation.nearestFire?.satellite}! Confiança: ${validation.confidence}%`,
            isRead: false,
          });

          // Aumentar trust score do usuário
          await db
            .update(users)
            .set({
              trustScore: sql`LEAST(1.0, ${users.trustScore} + 0.05)`,
              points: sql`${users.points} + 5`, // Bônus por validação de satélite
            })
            .where(eq(users.id, occurrence.userId));
        } else if (validation.confidence < 30 && stats.processed > 24) {
          // Se confiança muito baixa e já passou 24h+, pode ser falso positivo
          // Mas não rejeitamos automaticamente, apenas marcamos para revisão manual
          await db
            .update(occurrences)
            .set({
              status: 'pending', // Mantém pendente para revisão manual
              updatedAt: new Date(),
            })
            .where(eq(occurrences.id, occurrence.id));

          // Notificar usuário que precisa validação comunitária
          await db.insert(alerts).values({
            userId: occurrence.userId,
            occurrenceId: occurrence.id,
            type: 'validation',
            severity: 'low',
            message: `Sua ocorrência #${occurrence.id} não foi detectada por satélite. Ela passará por validação comunitária.`,
            isRead: false,
          });
        }
      } catch (error) {
        console.error(
          `[Satellite Validation] Erro ao processar ocorrência #${occurrence.id}:`,
          error
        );
        stats.errors++;
      }

      // Delay entre requisições para não sobrecarregar API
      await sleep(500);
    }

    console.log('[Satellite Validation] Job concluído:', stats);
    return stats;
  } catch (error) {
    console.error('[Satellite Validation] Erro fatal no job:', error);
    throw error;
  }
}

/**
 * Buscar ocorrências próximas a focos de calor detectados
 * e notificar usuários na região
 */
export async function detectNewFiresAndNotify(): Promise<number> {
  console.log('[Fire Detection] Buscando novos focos de calor...');

  const db = await getDb();
  if (!db) {
    console.error('[Fire Detection] Database not available');
    return 0;
  }

  try {
    // Buscar todas as ocorrências recentes para obter regiões de interesse
    const recentOccurrences = await db
      .select({
        latitude: occurrences.latitude,
        longitude: occurrences.longitude,
      })
      .from(occurrences)
      .where(sql`${occurrences.createdAt} >= DATE_SUB(NOW(), INTERVAL 7 DAY)`)
      .groupBy(occurrences.latitude, occurrences.longitude);

    let notificationsSent = 0;

    // Para cada região, buscar novos focos
    for (const region of recentOccurrences.slice(0, 10)) {
      // Limitar a 10 regiões
      try {
        const fires = await getFireDetections(
          Number(region.latitude),
          Number(region.longitude),
          20, // 20km de raio
          1 // último dia
        );

        if (fires.length > 0) {
          console.log(
            `[Fire Detection] ${fires.length} focos detectados em (${region.latitude}, ${region.longitude})`
          );

          // Buscar usuários que reportaram na região ou configuraram alertas
          const nearbyUsers = await db
            .select({
              id: users.id,
              name: users.name,
            })
            .from(users)
            .innerJoin(occurrences, eq(users.id, occurrences.userId))
            .where(
              sql`
                ST_Distance_Sphere(
                  point(${occurrences.longitude}, ${occurrences.latitude}),
                  point(${region.longitude}, ${region.latitude})
                ) < 20000
              `
            )
            .groupBy(users.id, users.name);

          // Enviar alertas
          for (const user of nearbyUsers) {
            const highestFRP = Math.max(...fires.map((f) => f.frp));
            const severity = highestFRP > 100 ? 'critical' : highestFRP > 50 ? 'high' : 'medium';

            await db.insert(alerts).values({
              userId: user.id,
              occurrenceId: null,
              type: 'geofence',
              severity,
              message: `ALERTA: ${fires.length} foco(s) de calor detectado(s) por satélite próximo à sua localização! Fique atento.`,
              isRead: false,
            });

            notificationsSent++;
          }
        }

        await sleep(1000); // Delay entre regiões
      } catch (error) {
        console.error('[Fire Detection] Erro ao processar região:', error);
      }
    }

    console.log(`[Fire Detection] ${notificationsSent} notificações enviadas`);
    return notificationsSent;
  } catch (error) {
    console.error('[Fire Detection] Erro no job de detecção:', error);
    return 0;
  }
}

/**
 * Função auxiliar para delay
 */
function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

/**
 * Executar todos os jobs de validação
 */
export async function runAllValidationJobs(): Promise<void> {
  console.log('[Validation Worker] Iniciando jobs de validação...');

  try {
    const validationStats = await runSatelliteValidation();
    console.log('[Validation Worker] Validação concluída:', validationStats);

    const notificationCount = await detectNewFiresAndNotify();
    console.log('[Validation Worker] Notificações enviadas:', notificationCount);

    console.log('[Validation Worker] Todos os jobs concluídos com sucesso!');
  } catch (error) {
    console.error('[Validation Worker] Erro ao executar jobs:', error);
    throw error;
  }
}

// Configurar cron job (executar a cada 3 horas)
// Adicionar ao package.json: "worker:validation": "tsx server/workers/satellite-validation.ts"
// Configurar cron: 0 */3 * * * cd /path/to/project && pnpm worker:validation
if (import.meta.url === `file://${process.argv[1]}`) {
  // Se executado diretamente
  runAllValidationJobs()
    .then(() => {
      console.log('[Validation Worker] Execução concluída');
      process.exit(0);
    })
    .catch((error) => {
      console.error('[Validation Worker] Erro fatal:', error);
      process.exit(1);
    });
}
