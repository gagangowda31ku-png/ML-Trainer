import { BoxPlotItem, CorrelationItem, DatasetProfile, DistributionBin, EDAResult } from '../types';

export function generateEDA(
  rows: Record<string, any>[],
  profile: DatasetProfile,
  targetColumn: string
): EDAResult {
  const numericalCols = profile.columns.filter(c => c.type === 'numerical' && !c.isConstantColumn && !c.isIdColumn).map(c => c.name);
  const categoricalCols = profile.columns.filter(c => c.type === 'categorical' && !c.isConstantColumn && !c.isIdColumn).map(c => c.name);

  // 1. Correlation Matrix
  const correlationFeatures = numericalCols.slice(0, 12);
  const matrix: number[][] = [];
  const topCorrelations: CorrelationItem[] = [];

  correlationFeatures.forEach((featA, i) => {
    const rowA: number[] = [];
    const valsA = rows.map(r => Number(r[featA])).filter(v => !isNaN(v));
    const meanA = valsA.reduce((a, b) => a + b, 0) / (valsA.length || 1);

    correlationFeatures.forEach((featB, j) => {
      if (i === j) {
        rowA.push(1.0);
        return;
      }
      const valsB = rows.map(r => Number(r[featB])).filter(v => !isNaN(v));
      const meanB = valsB.reduce((a, b) => a + b, 0) / (valsB.length || 1);

      let numerator = 0;
      let denomA = 0;
      let denomB = 0;
      const count = Math.min(rows.length, 500);

      for (let k = 0; k < count; k++) {
        const a = Number(rows[k][featA]);
        const b = Number(rows[k][featB]);
        if (!isNaN(a) && !isNaN(b)) {
          const diffA = a - meanA;
          const diffB = b - meanB;
          numerator += diffA * diffB;
          denomA += diffA * diffA;
          denomB += diffB * diffB;
        }
      }

      const denominator = Math.sqrt(denomA * denomB);
      const corr = denominator > 0 ? Math.max(-1, Math.min(1, numerator / denominator)) : 0;
      const roundedCorr = Number(corr.toFixed(3));
      rowA.push(roundedCorr);

      if (i < j) {
        topCorrelations.push({
          featureA: featA,
          featureB: featB,
          correlation: roundedCorr,
        });
      }
    });
    matrix.push(rowA);
  });

  topCorrelations.sort((a, b) => Math.abs(b.correlation) - Math.abs(a.correlation));

  // 2. Numerical Histograms & Distributions (10 bins)
  const numericalDistributions: Record<string, DistributionBin[]> = {};
  numericalCols.forEach(colName => {
    const numbers = rows.map(r => Number(r[colName])).filter(v => !isNaN(v));
    if (numbers.length === 0) return;

    const min = numbers.reduce((m, v) => (v < m ? v : m), numbers[0] ?? 0);
    const max = numbers.reduce((m, v) => (v > m ? v : m), numbers[0] ?? 0);
    const binCount = 10;
    const step = (max - min) / binCount || 1;

    const bins: DistributionBin[] = [];
    for (let b = 0; b < binCount; b++) {
      const bMin = min + b * step;
      const bMax = min + (b + 1) * step;
      bins.push({
        binRange: `${bMin.toFixed(1)}-${bMax.toFixed(1)}`,
        min: Number(bMin.toFixed(2)),
        max: Number(bMax.toFixed(2)),
        count: 0,
        density: 0,
      });
    }

    numbers.forEach(n => {
      let idx = Math.floor((n - min) / step);
      if (idx >= binCount) idx = binCount - 1;
      if (idx < 0) idx = 0;
      bins[idx].count++;
    });

    bins.forEach(b => {
      b.density = Number(((b.count / numbers.length) * 100).toFixed(1));
    });

    numericalDistributions[colName] = bins;
  });

  // 3. Box Plots
  const boxPlots: BoxPlotItem[] = [];
  numericalCols.slice(0, 10).forEach(colName => {
    const numbers = rows.map(r => Number(r[colName])).filter(v => !isNaN(v)).sort((a, b) => a - b);
    if (numbers.length < 4) return;

    const min = numbers[0];
    const max = numbers[numbers.length - 1];
    const q25 = numbers[Math.floor(numbers.length * 0.25)];
    const median = numbers[Math.floor(numbers.length * 0.5)];
    const q75 = numbers[Math.floor(numbers.length * 0.75)];
    const iqr = q75 - q25;
    const lower = q25 - 1.5 * iqr;
    const upper = q75 + 1.5 * iqr;

    const outliers = numbers.filter(n => n < lower || n > upper).slice(0, 8);

    boxPlots.push({
      feature: colName,
      min: Number(min.toFixed(2)),
      q25: Number(q25.toFixed(2)),
      median: Number(median.toFixed(2)),
      q75: Number(q75.toFixed(2)),
      max: Number(max.toFixed(2)),
      outliers,
    });
  });

  // 4. Categorical Distributions
  const categoricalDistributions: Record<string, any[]> = {};
  categoricalCols.forEach(colName => {
    const prof = profile.columns.find(c => c.name === colName);
    if (prof?.topCategories) {
      categoricalDistributions[colName] = prof.topCategories;
    }
  });

  // 5. Target Bivariate Analysis
  const targetBivariate: Record<string, any[]> = {};
  const targetProfile = profile.columns.find(c => c.name === targetColumn);
  const isTargetCategorical = targetProfile?.type === 'categorical' || (targetProfile ? targetProfile.uniqueCount <= 10 : false);

  categoricalCols.slice(0, 6).forEach(colName => {
    if (colName === targetColumn) return;
    const grouped = new Map<string, { total: number; targetSum: number; count: number }>();

    rows.forEach(r => {
      const cat = String(r[colName] ?? 'Unknown');
      const targetVal = r[targetColumn];
      const entry = grouped.get(cat) || { total: 0, targetSum: 0, count: 0 };
      entry.count++;

      if (typeof targetVal === 'number') {
        entry.targetSum += targetVal;
      } else if (targetVal === 'Yes' || targetVal === '1' || targetVal === true || targetVal === 'Malignant') {
        entry.targetSum += 1;
      }
      grouped.set(cat, entry);
    });

    const bivarItems = Array.from(grouped.entries()).map(([cat, val]) => ({
      categoryOrBin: cat,
      targetMeanOrCount: Number((val.targetSum / (val.count || 1)).toFixed(3)),
      count: val.count,
    })).sort((a, b) => b.count - a.count).slice(0, 8);

    targetBivariate[colName] = bivarItems;
  });

  // 6. Missingness Summary
  const missingnessSummary = profile.columns.map(c => ({
    feature: c.name,
    missingCount: c.missingCount,
    percentage: c.missingPercentage,
  })).sort((a, b) => b.percentage - a.percentage);

  // 7. Target distribution
  const targetColProfile = profile.columns.find(c => c.name === targetColumn);
  const targetDistribution = targetColProfile?.topCategories || numericalDistributions[targetColumn] || [];

  return {
    correlationMatrix: {
      features: correlationFeatures,
      matrix,
      topCorrelations: topCorrelations.slice(0, 15),
    },
    numericalDistributions,
    boxPlots,
    categoricalDistributions,
    targetBivariate,
    missingnessSummary,
    targetDistribution,
  };
}
