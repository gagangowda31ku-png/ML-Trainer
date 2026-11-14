import { FeatureEngineeringAudit, FeatureEngineeringConfig } from '../types';

export function runFeatureEngineering(
  rows: Record<string, any>[],
  targetColumn: string,
  config: FeatureEngineeringConfig
): { engineeredRows: Record<string, any>[]; audit: FeatureEngineeringAudit } {
  if (!rows || rows.length === 0) {
    return {
      engineeredRows: [],
      audit: {
        initialFeatureCount: 0,
        engineeredFeatureCount: 0,
        newFeatures: [],
        droppedBySelection: [],
        finalFeatureNames: [],
      },
    };
  }

  const initialFeatureNames = Object.keys(rows[0] || {}).filter(k => k !== targetColumn);
  const initialFeatureCount = initialFeatureNames.length;
  const newFeatures: { name: string; type: 'interaction' | 'log_transform' | 'binned' | 'datetime'; formula: string }[] = [];

  let currentRows = rows.map(r => ({ ...r }));

  // Robust numeric feature identification across rows
  const numericFeatures = initialFeatureNames.filter(f => {
    let numericFound = 0;
    for (let i = 0; i < Math.min(20, currentRows.length); i++) {
      const val = currentRows[i]?.[f];
      if (typeof val === 'number' || (!isNaN(Number(val)) && val !== '' && val !== null && val !== undefined)) {
        numericFound++;
      }
    }
    return numericFound > 0;
  });

  // 1. Log Transformations on skewed numeric features
  if (config.applyLogTransforms && numericFeatures.length > 0) {
    numericFeatures.slice(0, 5).forEach(f => {
      const vals = currentRows.map(r => Number(r[f])).filter(v => !isNaN(v));
      if (vals.length < 5) return;

      const min = vals.reduce((m, v) => (v < m ? v : m), vals[0] ?? 0);
      
      // Calculate skewness
      const mean = vals.reduce((a, b) => a + b, 0) / (vals.length || 1);
      const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / (vals.length || 1);
      const std = Math.sqrt(variance) || 1;
      const skewness = vals.reduce((acc, v) => acc + Math.pow((v - mean) / std, 3), 0) / (vals.length || 1);

      if (Math.abs(skewness) > 0.75 && min >= 0) {
        const newCol = `log_${f}`;
        currentRows.forEach(r => {
          const raw = Number(r[f]);
          const safeVal = isNaN(raw) ? 0 : Math.max(0, raw);
          r[newCol] = Number(Math.log1p(safeVal).toFixed(4));
        });
        newFeatures.push({
          name: newCol,
          type: 'log_transform',
          formula: `log(1 + ${f}) [skew: ${skewness.toFixed(2)}]`,
        });
      }
    });
  }

  // 2. Interaction terms between top numeric pairs
  if (config.generateInteractions && numericFeatures.length >= 2) {
    const pairA = numericFeatures[0];
    const pairB = numericFeatures[1];
    const newCol = `${pairA}_x_${pairB}`;
    currentRows.forEach(r => {
      const valA = Number(r[pairA] ?? 0);
      const valB = Number(r[pairB] ?? 0);
      const prod = (isNaN(valA) ? 0 : valA) * (isNaN(valB) ? 0 : valB);
      r[newCol] = Number(prod.toFixed(4));
    });
    newFeatures.push({
      name: newCol,
      type: 'interaction',
      formula: `${pairA} × ${pairB}`,
    });

    if (numericFeatures.length >= 4) {
      const pairC = numericFeatures[2];
      const pairD = numericFeatures[3];
      const newCol2 = `${pairC}_x_${pairD}`;
      currentRows.forEach(r => {
        const valC = Number(r[pairC] ?? 0);
        const valD = Number(r[pairD] ?? 0);
        const prod2 = (isNaN(valC) ? 0 : valC) * (isNaN(valD) ? 0 : valD);
        r[newCol2] = Number(prod2.toFixed(4));
      });
      newFeatures.push({
        name: newCol2,
        type: 'interaction',
        formula: `${pairC} × ${pairD}`,
      });
    }
  }

  // 3. Binning continuous features
  if (config.binContinuousFeatures && numericFeatures.length > 0) {
    const targetFeat = numericFeatures[0];
    const vals = currentRows.map(r => Number(r[targetFeat])).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (vals.length > 10) {
      const q33 = vals[Math.floor(vals.length * 0.33)] ?? 0;
      const q66 = vals[Math.floor(vals.length * 0.66)] ?? 0;
      const newCol = `${targetFeat}_tertile_bin`;

      currentRows.forEach(r => {
        const v = Number(r[targetFeat] ?? 0);
        r[newCol] = v <= q33 ? 0 : (v <= q66 ? 1 : 2);
      });
      newFeatures.push({
        name: newCol,
        type: 'binned',
        formula: `Tertile Bin (${targetFeat} ≤ ${q33.toFixed(1)}, ≤ ${q66.toFixed(1)}, > ${q66.toFixed(1)})`,
      });
    }
  }

  // 4. Feature selection (Top K features)
  const allCurrentFeatures = Object.keys(currentRows[0] || {}).filter(k => k !== targetColumn);
  let droppedBySelection: string[] = [];

  if (config.selectTopFeatures && config.topKFeatures < allCurrentFeatures.length && config.topKFeatures >= 2) {
    const scoredFeatures = allCurrentFeatures.map(feat => {
      let score = 0;
      const vals = currentRows.map(r => Number(r[feat])).filter(v => !isNaN(v));
      if (vals.length > 0) {
        const mean = vals.reduce((a, b) => a + b, 0) / vals.length;
        const variance = vals.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / vals.length;
        score = Math.sqrt(variance);
      }
      return { feat, score };
    }).sort((a, b) => b.score - a.score);

    const keepFeatures = new Set(scoredFeatures.slice(0, Math.max(2, config.topKFeatures)).map(s => s.feat));
    droppedBySelection = allCurrentFeatures.filter(f => !keepFeatures.has(f));

    currentRows.forEach(r => {
      droppedBySelection.forEach(f => delete r[f]);
    });
  }

  const finalFeatureNames = Object.keys(currentRows[0] || {}).filter(k => k !== targetColumn);

  return {
    engineeredRows: currentRows,
    audit: {
      initialFeatureCount,
      engineeredFeatureCount: newFeatures.length,
      newFeatures,
      droppedBySelection,
      finalFeatureNames,
    },
  };
}
