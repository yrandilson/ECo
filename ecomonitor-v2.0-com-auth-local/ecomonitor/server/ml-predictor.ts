/**
 * Machine Learning Predictor para Previsão de Riscos de Incêndio
 * Implementa regressão linear, random forest e redes neurais simples
 */

export interface FirePredictionInput {
  latitude: number;
  longitude: number;
  historicalTemperature: number[];
  historicalHumidity: number[];
  historicalWindSpeed: number[];
  historicalPrecipitation: number[];
  vegetationDensity: number;
  elevation: number;
  daysAhead: number; // 1-7 dias
}

export interface FirePredictionOutput {
  day: number;
  date: string;
  predictedRiskScore: number;
  confidence: number;
  factors: {
    temperature: number;
    humidity: number;
    windSpeed: number;
    precipitation: number;
    vegetation: number;
  };
  recommendation: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

/**
 * Modelo de Regressão Linear Simples
 * Usa histórico de 30 dias para prever próximos 7 dias
 */
class LinearRegressionModel {
  private weights: number[] = [];
  private bias: number = 0;

  /**
   * Treinar modelo com dados históricos
   */
  train(features: number[][], targets: number[]): void {
    const n = features.length;
    const m = features[0].length;

    // Inicializar pesos aleatoriamente
    this.weights = Array(m).fill(0).map(() => Math.random() * 0.01);
    this.bias = 0;

    // Gradient descent (10 iterações)
    const learningRate = 0.01;
    for (let iteration = 0; iteration < 10; iteration++) {
      let totalError = 0;

      for (let i = 0; i < n; i++) {
        // Predição
        let prediction = this.bias;
        for (let j = 0; j < m; j++) {
          prediction += this.weights[j] * features[i][j];
        }

        // Erro
        const error = targets[i] - prediction;
        totalError += error * error;

        // Atualizar pesos
        this.bias += learningRate * error;
        for (let j = 0; j < m; j++) {
          this.weights[j] += learningRate * error * features[i][j];
        }
      }
    }
  }

  /**
   * Fazer predição
   */
  predict(features: number[]): number {
    let prediction = this.bias;
    for (let i = 0; i < features.length; i++) {
      prediction += this.weights[i] * features[i];
    }
    return Math.max(0, Math.min(100, prediction)); // Limitar entre 0-100
  }
}

/**
 * Modelo Random Forest Simplificado
 * Ensemble de árvores de decisão
 */
class RandomForestModel {
  private trees: DecisionTree[] = [];
  private numTrees = 5;

  train(features: number[][], targets: number[]): void {
    for (let t = 0; t < this.numTrees; t++) {
      // Bootstrap sampling
      const sampleIndices = this.bootstrapSample(features.length);
      const sampledFeatures = sampleIndices.map(i => features[i]);
      const sampledTargets = sampleIndices.map(i => targets[i]);

      // Treinar árvore
      const tree = new DecisionTree();
      tree.train(sampledFeatures, sampledTargets);
      this.trees.push(tree);
    }
  }

  predict(features: number[]): number {
    const predictions = this.trees.map(tree => tree.predict(features));
    const average = predictions.reduce((a, b) => a + b, 0) / predictions.length;
    return Math.max(0, Math.min(100, average));
  }

  private bootstrapSample(size: number): number[] {
    const indices: number[] = [];
    for (let i = 0; i < size; i++) {
      indices.push(Math.floor(Math.random() * size));
    }
    return indices;
  }
}

/**
 * Árvore de Decisão Simples
 */
class DecisionTree {
  private threshold: number = 0;
  private featureIndex: number = 0;
  private leftValue: number = 0;
  private rightValue: number = 0;

  train(features: number[][], targets: number[]): void {
    // Encontrar melhor split
    let bestGain = 0;
    let bestFeature = 0;
    let bestThreshold = 0;

    for (let featureIdx = 0; featureIdx < features[0].length; featureIdx++) {
      const values = features.map(f => f[featureIdx]).sort((a, b) => a - b);
      const uniqueValues = Array.from(new Set(values));

      for (const threshold of uniqueValues.slice(0, 5)) {
        const leftIndices = features
          .map((f, i) => (f[featureIdx] <= threshold ? i : -1))
          .filter(i => i !== -1);
        const rightIndices = features
          .map((f, i) => (f[featureIdx] > threshold ? i : -1))
          .filter(i => i !== -1);

        if (leftIndices.length === 0 || rightIndices.length === 0) continue;

        const leftTargets = leftIndices.map(i => targets[i]);
        const rightTargets = rightIndices.map(i => targets[i]);

        const leftMean = leftTargets.reduce((a, b) => a + b) / leftTargets.length;
        const rightMean = rightTargets.reduce((a, b) => a + b) / rightTargets.length;

        const gain = this.calculateGain(targets, leftTargets, rightTargets, leftMean, rightMean);

        if (gain > bestGain) {
          bestGain = gain;
          bestFeature = featureIdx;
          bestThreshold = threshold;
        }
      }
    }

    this.featureIndex = bestFeature;
    this.threshold = bestThreshold;

    const leftIndices = features
      .map((f, i) => (f[bestFeature] <= bestThreshold ? i : -1))
      .filter(i => i !== -1);
    const rightIndices = features
      .map((f, i) => (f[bestFeature] > bestThreshold ? i : -1))
      .filter(i => i !== -1);

    this.leftValue = leftIndices.length > 0
      ? leftIndices.map(i => targets[i]).reduce((a, b) => a + b) / leftIndices.length
      : 50;

    this.rightValue = rightIndices.length > 0
      ? rightIndices.map(i => targets[i]).reduce((a, b) => a + b) / rightIndices.length
      : 50;
  }

  predict(features: number[]): number {
    return features[this.featureIndex] <= this.threshold
      ? this.leftValue
      : this.rightValue;
  }

  private calculateGain(
    targets: number[],
    leftTargets: number[],
    rightTargets: number[],
    leftMean: number,
    rightMean: number
  ): number {
    const totalVariance = this.variance(targets);
    const leftVariance = this.variance(leftTargets);
    const rightVariance = this.variance(rightTargets);

    const weightedVariance =
      (leftTargets.length / targets.length) * leftVariance +
      (rightTargets.length / targets.length) * rightVariance;

    return totalVariance - weightedVariance;
  }

  private variance(values: number[]): number {
    if (values.length === 0) return 0;
    const mean = values.reduce((a, b) => a + b) / values.length;
    const squaredDiffs = values.map(v => (v - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b) / values.length;
  }
}

/**
 * Rede Neural Simples (1 camada oculta)
 */
class NeuralNetworkModel {
  private weights1: number[][] = [];
  private weights2: number[] = [];
  private bias1: number[] = [];
  private bias2: number = 0;
  private hiddenSize = 8;

  train(features: number[][], targets: number[]): void {
    const inputSize = features[0].length;

    // Inicializar pesos
    this.weights1 = Array(inputSize)
      .fill(0)
      .map(() => Array(this.hiddenSize).fill(0).map(() => Math.random() * 0.1));

    this.weights2 = Array(this.hiddenSize).fill(0).map(() => Math.random() * 0.1);
    this.bias1 = Array(this.hiddenSize).fill(0.1);
    this.bias2 = 0.1;

    // Treinamento (5 épocas)
    const learningRate = 0.01;
    for (let epoch = 0; epoch < 5; epoch++) {
      for (let i = 0; i < features.length; i++) {
        // Forward pass
        const hidden = this.relu(this.matmul(features[i], this.weights1, this.bias1));
        const output = this.sigmoid(this.dotProduct(hidden, this.weights2) + this.bias2);

        // Backward pass (simplificado)
        const error = targets[i] - output;
        const outputGradient = error * output * (1 - output);

        for (let j = 0; j < this.hiddenSize; j++) {
          this.weights2[j] += learningRate * outputGradient * hidden[j];
        }
        this.bias2 += learningRate * outputGradient;

        for (let j = 0; j < inputSize; j++) {
          for (let k = 0; k < this.hiddenSize; k++) {
            this.weights1[j][k] += learningRate * outputGradient * this.weights2[k] * features[i][j];
          }
        }
      }
    }
  }

  predict(features: number[]): number {
    const hidden = this.relu(this.matmul(features, this.weights1, this.bias1));
    const output = this.sigmoid(this.dotProduct(hidden, this.weights2) + this.bias2);
    return output * 100; // Escalar para 0-100
  }

  private relu(x: number[]): number[] {
    return x.map(v => Math.max(0, v));
  }

  private sigmoid(x: number): number {
    return 1 / (1 + Math.exp(-x));
  }

  private matmul(x: number[], weights: number[][], bias: number[]): number[] {
    const result = bias.slice();
    for (let i = 0; i < x.length; i++) {
      for (let j = 0; j < weights[i].length; j++) {
        result[j] += x[i] * weights[i][j];
      }
    }
    return result;
  }

  private dotProduct(x: number[], y: number[]): number {
    return x.reduce((sum, xi, i) => sum + xi * y[i], 0);
  }
}

/**
 * Preditor Principal
 */
export class FireRiskPredictor {
  private linearModel: LinearRegressionModel;
  private forestModel: RandomForestModel;
  private neuralModel: NeuralNetworkModel;
  private isTrainedLinear = false;
  private isTrainedForest = false;
  private isTrainedNeural = false;

  constructor() {
    this.linearModel = new LinearRegressionModel();
    this.forestModel = new RandomForestModel();
    this.neuralModel = new NeuralNetworkModel();
  }

  /**
   * Treinar modelos com dados históricos
   */
  train(historicalData: {
    temperature: number[];
    humidity: number[];
    windSpeed: number[];
    precipitation: number[];
    riskScores: number[];
  }): void {
    // Preparar features (últimos 30 dias)
    const features: number[][] = [];
    const targets: number[] = [];

    const n = Math.min(historicalData.temperature.length, 30);
    for (let i = 0; i < n - 1; i++) {
      features.push([
        historicalData.temperature[i],
        historicalData.humidity[i],
        historicalData.windSpeed[i],
        historicalData.precipitation[i],
      ]);
      targets.push(historicalData.riskScores[i + 1]);
    }

    if (features.length > 0) {
      this.linearModel.train(features, targets);
      this.isTrainedLinear = true;

      this.forestModel.train(features, targets);
      this.isTrainedForest = true;

      this.neuralModel.train(features, targets);
      this.isTrainedNeural = true;
    }
  }

  /**
   * Prever riscos para os próximos 7 dias
   */
  predictNext7Days(input: FirePredictionInput): FirePredictionOutput[] {
    const predictions: FirePredictionOutput[] = [];

    for (let day = 1; day <= 7; day++) {
      // Simular dados meteorológicos para o dia
      const tempTrend = this.calculateTrend(input.historicalTemperature);
      const humidityTrend = this.calculateTrend(input.historicalHumidity);
      const windTrend = this.calculateTrend(input.historicalWindSpeed);
      const precipTrend = this.calculateTrend(input.historicalPrecipitation);

      const predictedTemp = input.historicalTemperature[input.historicalTemperature.length - 1] + tempTrend * day;
      const predictedHumidity = Math.max(0, input.historicalHumidity[input.historicalHumidity.length - 1] + humidityTrend * day);
      const predictedWind = Math.max(0, input.historicalWindSpeed[input.historicalWindSpeed.length - 1] + windTrend * day);
      const predictedPrecip = Math.max(0, input.historicalPrecipitation[input.historicalPrecipitation.length - 1] + precipTrend * day);

      const features = [predictedTemp, predictedHumidity, predictedWind, predictedPrecip];

      // Ensemble de modelos (média ponderada)
      let riskScore = 0;
      let totalWeight = 0;

      if (this.isTrainedLinear) {
        const linearPred = this.linearModel.predict(features);
        riskScore += linearPred * 0.3;
        totalWeight += 0.3;
      }

      if (this.isTrainedForest) {
        const forestPred = this.forestModel.predict(features);
        riskScore += forestPred * 0.4;
        totalWeight += 0.4;
      }

      if (this.isTrainedNeural) {
        const neuralPred = this.neuralModel.predict(features);
        riskScore += neuralPred * 0.3;
        totalWeight += 0.3;
      }

      if (totalWeight === 0) {
        riskScore = 50; // Valor padrão se nenhum modelo foi treinado
      } else {
        riskScore = riskScore / totalWeight;
      }

      // Ajustar por fatores locais
      const vegetationFactor = input.vegetationDensity / 100;
      const elevationFactor = Math.max(0.5, Math.min(1.5, input.elevation / 1000));
      riskScore = riskScore * vegetationFactor * elevationFactor;

      // Calcular confiança (baseada na variância dos modelos)
      const confidence = this.calculateConfidence(riskScore, input);

      // Gerar recomendação
      const recommendation = this.generateRecommendation(riskScore, predictedTemp, predictedHumidity, predictedWind);

      // Determinar severidade
      const severity = this.getSeverity(riskScore);

      const predictionDate = new Date();
      predictionDate.setDate(predictionDate.getDate() + day);

      predictions.push({
        day,
        date: predictionDate.toISOString().split('T')[0],
        predictedRiskScore: Math.min(100, Math.max(0, riskScore)),
        confidence,
        factors: {
          temperature: predictedTemp,
          humidity: predictedHumidity,
          windSpeed: predictedWind,
          precipitation: predictedPrecip,
          vegetation: input.vegetationDensity,
        },
        recommendation,
        severity,
      });
    }

    return predictions;
  }

  /**
   * Calcular tendência dos dados
   */
  private calculateTrend(data: number[]): number {
    if (data.length < 2) return 0;
    const recent = data.slice(-7);
    const sum = recent.reduce((a, b) => a + b, 0);
    const mean = sum / recent.length;
    const diffs = recent.map((v, i) => (i + 1) * (v - mean));
    const trend = diffs.reduce((a, b) => a + b, 0) / (recent.length * (recent.length + 1) / 2);
    return trend / 7; // Normalizar por dia
  }

  /**
   * Calcular confiança da predição
   */
  private calculateConfidence(riskScore: number, input: FirePredictionInput): number {
    // Confiança baseada em:
    // 1. Quantidade de dados históricos
    // 2. Estabilidade dos dados
    // 3. Proximidade da predição

    let confidence = 0.5; // Base 50%

    // Mais dados históricos = mais confiança
    const dataPoints = input.historicalTemperature.length;
    confidence += Math.min(0.3, dataPoints / 100);

    // Dados estáveis = mais confiança
    const tempVariance = this.calculateVariance(input.historicalTemperature);
    const humidityVariance = this.calculateVariance(input.historicalHumidity);
    const stability = 1 - (tempVariance + humidityVariance) / 200;
    confidence += stability * 0.2;

    return Math.min(0.95, Math.max(0.5, confidence));
  }

  /**
   * Calcular variância
   */
  private calculateVariance(data: number[]): number {
    if (data.length === 0) return 0;
    const mean = data.reduce((a, b) => a + b) / data.length;
    const squaredDiffs = data.map(v => (v - mean) ** 2);
    return squaredDiffs.reduce((a, b) => a + b) / data.length;
  }

  /**
   * Gerar recomendação
   */
  private generateRecommendation(
    riskScore: number,
    temp: number,
    humidity: number,
    windSpeed: number
  ): string {
    if (riskScore > 80) {
      return `ALERTA CRÍTICO: Risco muito alto de incêndio. Temp: ${temp.toFixed(1)}°C, Umidade: ${humidity.toFixed(1)}%, Vento: ${windSpeed.toFixed(1)} km/h. Evite atividades com fogo.`;
    } else if (riskScore > 60) {
      return `ALERTA: Risco alto de incêndio. Mantenha vigilância e tenha equipamentos de segurança prontos.`;
    } else if (riskScore > 40) {
      return `CUIDADO: Risco moderado. Monitore condições meteorológicas.`;
    } else {
      return `Risco baixo. Condições favoráveis.`;
    }
  }

  /**
   * Determinar severidade
   */
  private getSeverity(riskScore: number): 'low' | 'medium' | 'high' | 'critical' {
    if (riskScore > 80) return 'critical';
    if (riskScore > 60) return 'high';
    if (riskScore > 40) return 'medium';
    return 'low';
  }
}

/**
 * Função auxiliar para gerar dados históricos de teste
 */
export function generateMockHistoricalData(days: number = 30) {
  const temperature: number[] = [];
  const humidity: number[] = [];
  const windSpeed: number[] = [];
  const precipitation: number[] = [];
  const riskScores: number[] = [];

  for (let i = 0; i < days; i++) {
    // Simular padrões realistas
    const dayOfYear = (i % 365) / 365;
    const seasonalTemp = 25 + 10 * Math.sin(dayOfYear * 2 * Math.PI);
    temperature.push(seasonalTemp + (Math.random() - 0.5) * 5);

    const seasonalHumidity = 60 - 20 * Math.sin(dayOfYear * 2 * Math.PI);
    humidity.push(Math.max(10, Math.min(100, seasonalHumidity + (Math.random() - 0.5) * 15)));

    windSpeed.push(Math.max(0, 10 + (Math.random() - 0.5) * 8));
    precipitation.push(Math.max(0, Math.random() < 0.3 ? Math.random() * 20 : 0));

    // Calcular risco baseado em parâmetros
    const temp = temperature[i];
    const humid = humidity[i];
    const wind = windSpeed[i];
    const precip = precipitation[i];

    const risk = (temp / 50) * 40 + (100 - humid) / 100 * 30 + (wind / 30) * 20 - (precip / 20) * 10;
    riskScores.push(Math.max(0, Math.min(100, risk)));
  }

  return { temperature, humidity, windSpeed, precipitation, riskScores };
}
