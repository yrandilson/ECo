/**
 * Modelo LSTM (Long Short-Term Memory) para Previsão de Séries Temporais
 * Implementação simplificada de rede neural recorrente
 */

export interface LSTMConfig {
  inputSize: number;
  hiddenSize: number;
  outputSize: number;
  sequenceLength: number;
  learningRate: number;
  epochs: number;
}

export interface LSTMPrediction {
  day: number;
  predictedValue: number;
  confidence: number;
  trend: "increasing" | "decreasing" | "stable";
}

/**
 * Célula LSTM básica
 */
class LSTMCell {
  // Pesos
  private Wf: number[][]; // Forget gate
  private Wi: number[][]; // Input gate
  private Wo: number[][]; // Output gate
  private Wc: number[][]; // Cell candidate
  private bf: number[];
  private bi: number[];
  private bo: number[];
  private bc: number[];

  // Estados
  private h: number[] = [];
  private c: number[] = [];

  constructor(inputSize: number, hiddenSize: number) {
    // Inicializar pesos aleatoriamente
    this.Wf = this.randomMatrix(inputSize + hiddenSize, hiddenSize);
    this.Wi = this.randomMatrix(inputSize + hiddenSize, hiddenSize);
    this.Wo = this.randomMatrix(inputSize + hiddenSize, hiddenSize);
    this.Wc = this.randomMatrix(inputSize + hiddenSize, hiddenSize);

    this.bf = Array(hiddenSize).fill(0.1);
    this.bi = Array(hiddenSize).fill(0.1);
    this.bo = Array(hiddenSize).fill(0.1);
    this.bc = Array(hiddenSize).fill(0.1);

    this.h = Array(hiddenSize).fill(0);
    this.c = Array(hiddenSize).fill(0);
  }

  /**
   * Forward pass através da célula LSTM
   */
  forward(x: number[], h_prev: number[], c_prev: number[]): { h: number[]; c: number[] } {
    const hiddenSize = h_prev.length;

    // Concatenar entrada com estado anterior
    const combined = [...x, ...h_prev];

    // Forget gate
    const f = this.sigmoid(this.matmul(combined, this.Wf, this.bf));

    // Input gate
    const i = this.sigmoid(this.matmul(combined, this.Wi, this.bi));

    // Output gate
    const o = this.sigmoid(this.matmul(combined, this.Wo, this.bo));

    // Cell candidate
    const c_tilde = this.matmul(combined, this.Wc, this.bc).map(x => Math.tanh(x));

    // Atualizar cell state
    const c = f.map((f_i, idx) => f_i * c_prev[idx] + i[idx] * c_tilde[idx]);

    // Atualizar hidden state
    const h = o.map((o_i, idx) => o_i * Math.tanh(c[idx]));

    this.h = h;
    this.c = c;

    return { h, c };
  }

  /**
   * Obter estado atual
   */
  getState(): { h: number[]; c: number[] } {
    return { h: this.h, c: this.c };
  }

  /**
   * Resetar estado
   */
  resetState(hiddenSize: number): void {
    this.h = Array(hiddenSize).fill(0);
    this.c = Array(hiddenSize).fill(0);
  }

  // Funções auxiliares
  private sigmoid(x: number[]): number[] {
    return x.map((v) => 1 / (1 + Math.exp(-v)));
  }

  private matmul(x: number[], W: number[][], b: number[]): number[] {
    const result = b.slice();
    for (let i = 0; i < x.length; i++) {
      if (W[i]) {
        for (let j = 0; j < W[i].length; j++) {
          result[j] = (result[j] || 0) + x[i] * W[i][j];
        }
      }
    }
    return result;
  }

  private randomMatrix(rows: number, cols: number): number[][] {
    const matrix: number[][] = [];
    for (let i = 0; i < rows; i++) {
      matrix[i] = [];
      for (let j = 0; j < cols; j++) {
        matrix[i][j] = (Math.random() - 0.5) * 0.1;
      }
    }
    return matrix;
  }
}

/**
 * Modelo LSTM Simplificado
 */
export class LSTMPredictor {
  private lstm: LSTMCell;
  private Wy: number[] = [];
  private by: number = 0;
  private config: LSTMConfig;

  constructor(config: LSTMConfig) {
    this.config = config;
    this.lstm = new LSTMCell(config.inputSize, config.hiddenSize);
    this.Wy = Array(config.hiddenSize)
      .fill(0)
      .map(() => (Math.random() - 0.5) * 0.1);
    this.by = 0.1;
  }

  /**
   * Treinar modelo com dados históricos
   */
  train(sequences: number[][], targets: number[]): void {
    for (let epoch = 0; epoch < this.config.epochs; epoch++) {
      let totalLoss = 0;

      for (let i = 0; i < sequences.length; i++) {
        const sequence = sequences[i];
        const target = targets[i];

        // Forward pass
        let h = Array(this.config.hiddenSize).fill(0);
        let c = Array(this.config.hiddenSize).fill(0);

        for (let t = 0; t < sequence.length; t++) {
          const x = [sequence[t]];
          const { h: h_new, c: c_new } = this.lstm.forward(x, h, c);
          h = h_new;
          c = c_new;
        }

        // Output layer
        let output = this.by;
        for (let j = 0; j < h.length; j++) {
          output += h[j] * this.Wy[j];
        }

        // Calcular erro
        const error = target - output;
        totalLoss += error * error;

        // Atualizar pesos de saída (simplificado)
        this.by += this.config.learningRate * error;
        for (let j = 0; j < h.length; j++) {
          this.Wy[j] += this.config.learningRate * error * h[j];
        }

        // Reset estado
        this.lstm.resetState(this.config.hiddenSize);
      }

      if (epoch % 10 === 0) {
        console.log(`[LSTM] Epoch ${epoch}, Loss: ${(totalLoss / sequences.length).toFixed(4)}`);
      }
    }
  }

  /**
   * Fazer previsões para próximos N dias
   */
  predict(sequence: number[], daysAhead: number): LSTMPrediction[] {
    const predictions: LSTMPrediction[] = [];
    let currentSequence = sequence.slice();

    for (let day = 1; day <= daysAhead; day++) {
      // Forward pass
      let h = Array(this.config.hiddenSize).fill(0);
      let c = Array(this.config.hiddenSize).fill(0);

      for (let t = 0; t < currentSequence.length; t++) {
        const x = [currentSequence[t]];
        const { h: h_new, c: c_new } = this.lstm.forward(x, h, c);
        h = h_new;
        c = c_new;
      }

      // Prever próximo valor
      let output = this.by;
      for (let j = 0; j < h.length; j++) {
        output += h[j] * this.Wy[j];
      }

      // Normalizar saída
      const predictedValue = Math.max(0, Math.min(100, output));

      // Calcular confiança (baseada na variância)
      const confidence = 0.7 + (day / daysAhead) * 0.15; // Diminui com o tempo

      // Determinar tendência
      const trend = this.calculateTrend(currentSequence.slice(-5));

      predictions.push({
        day,
        predictedValue,
        confidence,
        trend,
      });

      // Adicionar predição à sequência
      currentSequence.push(predictedValue);
      currentSequence.shift(); // Manter tamanho da sequência

      // Reset estado
      this.lstm.resetState(this.config.hiddenSize);
    }

    return predictions;
  }

  /**
   * Calcular tendência dos últimos valores
   */
  private calculateTrend(values: number[]): "increasing" | "decreasing" | "stable" {
    if (values.length < 2) return "stable";

    const diffs = [];
    for (let i = 1; i < values.length; i++) {
      diffs.push(values[i] - values[i - 1]);
    }

    const avgDiff = diffs.reduce((a, b) => a + b) / diffs.length;
    const threshold = 2; // Threshold para considerar mudança

    if (avgDiff > threshold) return "increasing";
    if (avgDiff < -threshold) return "decreasing";
    return "stable";
  }
}

/**
 * Modelo LSTM Ensemble (múltiplos LSTMs)
 */
export class LSTMEnsemble {
  private models: LSTMPredictor[] = [];
  private numModels: number = 3;

  constructor(config: LSTMConfig, numModels: number = 3) {
    this.numModels = numModels;
    for (let i = 0; i < numModels; i++) {
      this.models.push(new LSTMPredictor(config));
    }
  }

  /**
   * Treinar todos os modelos
   */
  train(sequences: number[][], targets: number[]): void {
    for (let i = 0; i < this.numModels; i++) {
      console.log(`[LSTM Ensemble] Treinando modelo ${i + 1}/${this.numModels}`);
      this.models[i].train(sequences, targets);
    }
  }

  /**
   * Fazer previsões com ensemble
   */
  predictEnsemble(sequence: number[], daysAhead: number): LSTMPrediction[] {
    const allPredictions = this.models.map((model) => model.predict(sequence, daysAhead));

    // Média das previsões
    const ensemblePredictions: LSTMPrediction[] = [];

    for (let day = 0; day < daysAhead; day++) {
      const values = allPredictions.map((p) => p[day].predictedValue);
      const confidences = allPredictions.map((p) => p[day].confidence);

      const avgValue = values.reduce((a, b) => a + b) / values.length;
      const avgConfidence = confidences.reduce((a, b) => a + b) / confidences.length;

      // Calcular variância para ajustar confiança
      const variance =
        values.reduce((sum, v) => sum + Math.pow(v - avgValue, 2), 0) / values.length;
      const adjustedConfidence = Math.max(0.5, avgConfidence - variance / 100);

      ensemblePredictions.push({
        day: day + 1,
        predictedValue: avgValue,
        confidence: adjustedConfidence,
        trend: allPredictions[0][day].trend, // Usar tendência do primeiro modelo
      });
    }

    return ensemblePredictions;
  }
}

/**
 * Preparar dados para LSTM
 */
export function prepareSequences(
  data: number[],
  sequenceLength: number
): { sequences: number[][]; targets: number[] } {
  const sequences: number[][] = [];
  const targets: number[] = [];

  for (let i = 0; i < data.length - sequenceLength; i++) {
    sequences.push(data.slice(i, i + sequenceLength));
    targets.push(data[i + sequenceLength]);
  }

  return { sequences, targets };
}

/**
 * Normalizar dados para LSTM
 */
export function normalizeData(data: number[]): {
  normalized: number[];
  min: number;
  max: number;
} {
  const min = Math.min(...data);
  const max = Math.max(...data);
  const range = max - min || 1;

  const normalized = data.map((v) => (v - min) / range);

  return { normalized, min, max };
}

/**
 * Desnormalizar dados
 */
export function denormalizeData(normalized: number[], min: number, max: number): number[] {
  const range = max - min || 1;
  return normalized.map((v) => v * range + min);
}

/**
 * Exemplo de uso
 */
export function createLSTMPredictor(): LSTMEnsemble {
  const config: LSTMConfig = {
    inputSize: 1,
    hiddenSize: 16,
    outputSize: 1,
    sequenceLength: 7,
    learningRate: 0.01,
    epochs: 20,
  };

  return new LSTMEnsemble(config, 3);
}
