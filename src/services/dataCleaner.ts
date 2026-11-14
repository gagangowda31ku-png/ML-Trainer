import { CleaningAudit, CleaningConfig, CleaningStepLog, DatasetProfile } from '../types';

export function runDataCleaning(
  rows: Record<string, any>[],
  profile: DatasetProfile,
  config: CleaningConfig,
  targetColumn: string
): { cleanedRows: Record<string, any>[]; audit: CleaningAudit } {
  const startTime = performance.now();
  const logs: CleaningStepLog[] = [];
  const droppedColumns: { name: string; reason: string }[] = [];
  const encodedColumns: { original: string; newColumns: string[] }[] = [];
  const scaledColumns: string[] = [];

  const beforeRows = rows.length;
  const beforeColumns = profile.totalColumns;

  let currentRows = rows.map(r => ({ ...r }));
  let currentHeaders = profile.columns.map(c => c.name);

  // 1. Remove duplicate rows
  let duplicatesRemoved = 0;
  if (config.removeDuplicates) {
    const seen = new Set<string>();
    const deduplicated: Record<string, any>[] = [];
    currentRows.forEach(r => {
      const key = JSON.stringify(r);
      if (!seen.has(key)) {
        seen.add(key);
        deduplicated.push(r);
      } else {
        duplicatesRemoved++;
      }
    });
    currentRows = deduplicated;
    logs.push({
      stage: "Deduplication",
      action: "Remove exact duplicate rows",
      impactDescription: `Removed ${duplicatesRemoved} redundant records to eliminate model bias.`,
      itemsAffected: duplicatesRemoved,
    });
  }

  // 2. Drop constant and high-cardinality ID columns
  const colsToDrop = new Set<string>();

  profile.columns.forEach(col => {
    if (col.name === targetColumn) return; // Never drop target column

    if (config.dropConstantColumns && col.isConstantColumn) {
      colsToDrop.add(col.name);
      droppedColumns.push({ name: col.name, reason: "Zero variance (constant value across all rows)" });
    }

    if (config.dropHighCardinalityIds && col.isIdColumn) {
      colsToDrop.add(col.name);
      droppedColumns.push({ name: col.name, reason: "Identifier with near 100% unique cardinality" });
    }
  });

  if (colsToDrop.size > 0) {
    currentHeaders = currentHeaders.filter(h => !colsToDrop.has(h));
    currentRows.forEach(r => {
      colsToDrop.forEach(col => delete r[col]);
    });
    logs.push({
      stage: "Column Pruning",
      action: "Drop useless ID and constant columns",
      affectedColumns: Array.from(colsToDrop),
      impactDescription: `Pruned ${colsToDrop.size} non-informative columns: ${Array.from(colsToDrop).join(", ")}.`,
      itemsAffected: colsToDrop.size,
    });
  }

  // 3. Impute Missing Values
  let missingImputed = 0;
  currentHeaders.forEach(colName => {
    const colProf = profile.columns.find(c => c.name === colName);
    if (!colProf) return;

    const values = currentRows.map(r => r[colName]).filter(v => v !== null && v !== undefined && v !== '');
    if (values.length === currentRows.length) return; // No missing values

    const missingInCol = currentRows.length - values.length;
    missingImputed += missingInCol;

    if (colProf.type === 'numerical') {
      const nums = (values as number[]).slice().sort((a, b) => a - b);
      let fillVal = 0;
      if (config.imputeMissingStrategy === 'median') {
        const mid = Math.floor(nums.length / 2);
        fillVal = nums.length % 2 !== 0 ? nums[mid] : (nums[mid - 1] + nums[mid]) / 2;
      } else if (config.imputeMissingStrategy === 'mean') {
        fillVal = nums.reduce((a, b) => a + b, 0) / nums.length;
      } else {
        fillVal = nums[0] || 0;
      }

      currentRows.forEach(r => {
        if (r[colName] === null || r[colName] === undefined || r[colName] === '' || isNaN(r[colName])) {
          r[colName] = Number(fillVal.toFixed(4));
        }
      });
    } else {
      // Categorical mode imputation
      const freqMap = new Map<string, number>();
      values.forEach(v => {
        const key = String(v);
        freqMap.set(key, (freqMap.get(key) || 0) + 1);
      });
      let modeVal = "Missing";
      let maxCount = -1;
      freqMap.forEach((count, val) => {
        if (count > maxCount) {
          maxCount = count;
          modeVal = val;
        }
      });

      currentRows.forEach(r => {
        if (r[colName] === null || r[colName] === undefined || r[colName] === '') {
          r[colName] = config.imputeCategoricalStrategy === 'mode' ? modeVal : 'Missing';
        }
      });
    }
  });

  if (missingImputed > 0) {
    logs.push({
      stage: "Missing Value Imputation",
      action: `Impute using ${config.imputeMissingStrategy} for numeric and ${config.imputeCategoricalStrategy} for categorical`,
      impactDescription: `Imputed ${missingImputed} null/empty cells across features without dropping rows.`,
      itemsAffected: missingImputed,
    });
  }

  // 4. Outlier Treatment (IQR Winsorization)
  let outliersClipped = 0;
  if (config.outlierHandling === 'clip_iqr') {
    currentHeaders.forEach(colName => {
      if (colName === targetColumn) return;
      const colProf = profile.columns.find(c => c.name === colName);
      if (!colProf || colProf.type !== 'numerical' || !colProf.stats) return;

      const { q25, q75, iqr } = colProf.stats;
      const lower = q25 - 1.5 * iqr;
      const upper = q75 + 1.5 * iqr;

      currentRows.forEach(r => {
        const val = r[colName];
        if (typeof val === 'number') {
          if (val < lower) {
            r[colName] = Number(lower.toFixed(4));
            outliersClipped++;
          } else if (val > upper) {
            r[colName] = Number(upper.toFixed(4));
            outliersClipped++;
          }
        }
      });
    });

    if (outliersClipped > 0) {
      logs.push({
        stage: "Outlier Treatment",
        action: "IQR Winsorization (clipping to 1.5x IQR boundaries)",
        impactDescription: `Clipped ${outliersClipped} extreme outlier data points to stabilize gradient calculations.`,
        itemsAffected: outliersClipped,
      });
    }
  }

  // 5. Categorical Encoding (One-Hot Encoding or Ordinal)
  currentHeaders.forEach(colName => {
    if (colName === targetColumn) return;
    const colProf = profile.columns.find(c => c.name === colName);
    if (!colProf || colProf.type !== 'categorical') return;

    const uniqueVals = Array.from(new Set(currentRows.map(r => String(r[colName]))));

    if (config.encodingStrategy === 'one_hot' || (config.encodingStrategy === 'auto' && uniqueVals.length <= 6)) {
      // One-Hot Encode
      const newCols: string[] = [];
      uniqueVals.forEach(val => {
        const sanitizedVal = val.replace(/[^a-zA-Z0-9_]/g, '_');
        const oneHotCol = `${colName}_${sanitizedVal}`;
        newCols.push(oneHotCol);
        currentRows.forEach(r => {
          r[oneHotCol] = String(r[colName]) === val ? 1 : 0;
        });
      });

      encodedColumns.push({ original: colName, newColumns: newCols });
      // Remove original categorical string column
      currentRows.forEach(r => delete r[colName]);
      currentHeaders = currentHeaders.filter(h => h !== colName).concat(newCols);
    } else {
      // Ordinal / Frequency encoding
      const valToNum = new Map<string, number>();
      uniqueVals.forEach((val, idx) => valToNum.set(val, idx));
      currentRows.forEach(r => {
        r[colName] = valToNum.get(String(r[colName])) || 0;
      });
      encodedColumns.push({ original: colName, newColumns: [colName] });
    }
  });

  if (encodedColumns.length > 0) {
    logs.push({
      stage: "Categorical Encoding",
      action: "One-Hot / Ordinal Encoding for categorical variables",
      impactDescription: `Transformed ${encodedColumns.length} categorical features into numerical matrix dimensions.`,
      itemsAffected: encodedColumns.length,
    });
  }

  // 6. Feature Scaling (StandardScaler)
  if (config.scalingStrategy === 'standard') {
    currentHeaders.forEach(colName => {
      if (colName === targetColumn) return;
      const values = currentRows.map(r => r[colName]).filter(v => typeof v === 'number') as number[];
      if (values.length === 0) return;

      const mean = values.reduce((a, b) => a + b, 0) / values.length;
      const variance = values.reduce((a, b) => a + Math.pow(b - mean, 2), 0) / values.length;
      const std = Math.sqrt(variance) || 1;

      currentRows.forEach(r => {
        if (typeof r[colName] === 'number') {
          r[colName] = Number(((r[colName] - mean) / std).toFixed(4));
        }
      });
      scaledColumns.push(colName);
    });

    logs.push({
      stage: "Feature Scaling",
      action: "Z-Score Standardization (StandardScaler)",
      impactDescription: `Scaled ${scaledColumns.length} numerical features to mean=0 and variance=1.`,
      itemsAffected: scaledColumns.length,
    });
  } else if (config.scalingStrategy === 'minmax') {
    currentHeaders.forEach(colName => {
      if (colName === targetColumn) return;
      const values = currentRows.map(r => r[colName]).filter(v => typeof v === 'number') as number[];
      if (values.length === 0) return;

      const min = values.reduce((m, v) => (v < m ? v : m), values[0] ?? 0);
      const max = values.reduce((m, v) => (v > m ? v : m), values[0] ?? 0);
      const range = max - min || 1;

      currentRows.forEach(r => {
        if (typeof r[colName] === 'number') {
          r[colName] = Number(((r[colName] - min) / range).toFixed(4));
        }
      });
      scaledColumns.push(colName);
    });
  }

  const executionTimeMs = Math.round(performance.now() - startTime);

  return {
    cleanedRows: currentRows,
    audit: {
      beforeRows,
      afterRows: currentRows.length,
      beforeColumns,
      afterColumns: Object.keys(currentRows[0] || {}).length,
      missingImputed,
      duplicatesRemoved,
      outliersClipped,
      droppedColumns,
      encodedColumns,
      scaledColumns,
      executionTimeMs,
      logs,
    },
  };
}
