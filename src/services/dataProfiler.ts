import { ColumnProfile, ColumnStats, DataHealthScore, DatasetProfile, DataType, TaskType } from '../types';

export function parseCSVToRows(csvText: string): { headers: string[]; rows: Record<string, any>[] } {
  const lines = csvText.trim().split(/\r\n|\n|\r/);
  if (lines.length < 2) {
    throw new Error("Dataset must contain at least a header row and one data row.");
  }

  // Parse header line safely handling quotes
  const headers = parseCSVLine(lines[0]).map(h => h.trim().replace(/^["']|["']$/g, ''));
  const rows: Record<string, any>[] = [];

  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    const values = parseCSVLine(line);
    const rowObj: Record<string, any> = {};

    headers.forEach((header, index) => {
      let rawVal = values[index] !== undefined ? values[index].trim() : '';
      if (rawVal.startsWith('"') && rawVal.endsWith('"')) {
        rawVal = rawVal.slice(1, -1);
      }
      
      // Attempt numerical conversion
      if (rawVal === '' || rawVal === 'NA' || rawVal === 'null' || rawVal === 'NaN' || rawVal === 'None' || rawVal === '?') {
        rowObj[header] = null;
      } else if (!isNaN(Number(rawVal)) && rawVal.trim() !== '') {
        rowObj[header] = Number(rawVal);
      } else if (rawVal.toLowerCase() === 'true') {
        rowObj[header] = true;
      } else if (rawVal.toLowerCase() === 'false') {
        rowObj[header] = false;
      } else {
        rowObj[header] = rawVal;
      }
    });

    rows.push(rowObj);
  }

  return { headers, rows };
}

function parseCSVLine(text: string): string[] {
  const result: string[] = [];
  let cur = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (c === '"') {
      if (inQuotes && text[i + 1] === '"') {
        cur += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (c === ',' && !inQuotes) {
      result.push(cur);
      cur = '';
    } else {
      cur += c;
    }
  }
  result.push(cur);
  return result;
}

export function profileDataset(
  datasetName: string,
  headers: string[],
  rows: Record<string, any>[]
): DatasetProfile {
  const totalRows = rows.length;
  const totalColumns = headers.length;
  
  if (totalRows === 0 || totalColumns === 0) {
    throw new Error("Cannot profile empty dataset");
  }

  // Count duplicate rows
  const seenRowStrings = new Set<string>();
  let duplicateCount = 0;
  rows.forEach(r => {
    const str = JSON.stringify(r);
    if (seenRowStrings.has(str)) {
      duplicateCount++;
    } else {
      seenRowStrings.add(str);
    }
  });

  let totalMissingCells = 0;
  const columnProfiles: ColumnProfile[] = [];

  let numericalCount = 0;
  let categoricalCount = 0;
  let datetimeCount = 0;
  let booleanCount = 0;

  // Profile each column
  headers.forEach((colName, colIdx) => {
    const values = rows.map(r => r[colName]);
    const nonNullValues = values.filter(v => v !== null && v !== undefined && v !== '');
    const missingCount = totalRows - nonNullValues.length;
    totalMissingCells += missingCount;

    const uniqueSet = new Set(nonNullValues);
    const uniqueCount = uniqueSet.size;
    const uniquePercentage = totalRows > 0 ? (uniqueCount / totalRows) * 100 : 0;
    const missingPercentage = totalRows > 0 ? (missingCount / totalRows) * 100 : 0;

    // Type detection
    let inferredType: DataType = 'categorical';
    const numMatches = nonNullValues.filter(v => typeof v === 'number').length;
    const boolMatches = nonNullValues.filter(v => typeof v === 'boolean' || v === 'true' || v === 'false' || v === 0 || v === 1).length;
    
    // Check if date
    const dateMatches = nonNullValues.filter(v => {
      if (typeof v !== 'string') return false;
      const parsed = Date.parse(v);
      return !isNaN(parsed) && v.includes('-') || v.includes('/');
    }).length;

    const isAllConstant = uniqueCount <= 1;
    const isIdCandidate = uniquePercentage > 95 && totalRows > 20 && (colName.toLowerCase().includes('id') || colIdx === 0);

    if (isAllConstant) {
      inferredType = 'constant';
    } else if (isIdCandidate) {
      inferredType = 'id';
    } else if (dateMatches / nonNullValues.length > 0.8) {
      inferredType = 'datetime';
      datetimeCount++;
    } else if (numMatches / nonNullValues.length > 0.85 && uniqueCount > 2) {
      inferredType = 'numerical';
      numericalCount++;
    } else if (boolMatches / nonNullValues.length > 0.9 && uniqueCount <= 2) {
      inferredType = 'boolean';
      booleanCount++;
    } else {
      inferredType = 'categorical';
      categoricalCount++;
    }

    // Compute numerical statistics if numerical
    let stats: ColumnStats | undefined;
    let outlierCount = 0;

    if (inferredType === 'numerical' && nonNullValues.length > 0) {
      const numbers = (nonNullValues as number[]).slice().sort((a, b) => a - b);
      const min = numbers[0];
      const max = numbers[numbers.length - 1];
      const sum = numbers.reduce((acc, val) => acc + val, 0);
      const mean = sum / numbers.length;

      const mid = Math.floor(numbers.length / 2);
      const median = numbers.length % 2 !== 0 ? numbers[mid] : (numbers[mid - 1] + numbers[mid]) / 2;

      const q25Idx = Math.floor(numbers.length * 0.25);
      const q75Idx = Math.floor(numbers.length * 0.75);
      const q25 = numbers[q25Idx];
      const q75 = numbers[q75Idx];
      const iqr = q75 - q25;

      const variance = numbers.reduce((acc, val) => acc + Math.pow(val - mean, 2), 0) / numbers.length;
      const std = Math.sqrt(variance);

      // Skewness and Kurtosis
      let skewSum = 0;
      let kurtSum = 0;
      if (std > 0) {
        numbers.forEach(val => {
          skewSum += Math.pow((val - mean) / std, 3);
          kurtSum += Math.pow((val - mean) / std, 4);
        });
      }
      const skewness = numbers.length > 2 ? skewSum / numbers.length : 0;
      const kurtosis = numbers.length > 3 ? (kurtSum / numbers.length) - 3 : 0;

      // IQR Outlier count
      const lowerBound = q25 - 1.5 * iqr;
      const upperBound = q75 + 1.5 * iqr;
      outlierCount = numbers.filter(n => n < lowerBound || n > upperBound).length;

      stats = {
        min: Number(min.toFixed(4)),
        max: Number(max.toFixed(4)),
        mean: Number(mean.toFixed(4)),
        median: Number(median.toFixed(4)),
        std: Number(std.toFixed(4)),
        q25: Number(q25.toFixed(4)),
        q75: Number(q75.toFixed(4)),
        iqr: Number(iqr.toFixed(4)),
        skewness: Number(skewness.toFixed(4)),
        kurtosis: Number(kurtosis.toFixed(4)),
      };
    }

    // Top categories for categorical or low-cardinality
    let topCategories: { label: string; count: number; percentage: number }[] | undefined;
    if (uniqueCount <= 30) {
      const freqMap = new Map<string, number>();
      nonNullValues.forEach(v => {
        const key = String(v);
        freqMap.set(key, (freqMap.get(key) || 0) + 1);
      });

      topCategories = Array.from(freqMap.entries())
        .sort((a, b) => b[1] - a[1])
        .slice(0, 10)
        .map(([label, count]) => ({
          label,
          count,
          percentage: Number(((count / totalRows) * 100).toFixed(1)),
        }));
    }

    // Target scoring heuristic
    let targetScore = 0;
    let targetReason = "";
    const lowerName = colName.toLowerCase();

    // High keyword match
    if (/^(target|label|class|y|churn|survived|default|price|saleprice|quality|diagnosis|outcome|status|attrition|revenue)$/i.test(lowerName)) {
      targetScore += 80;
      targetReason = "Strong standard target keyword name";
    } else if (lowerName.includes('target') || lowerName.includes('churn') || lowerName.includes('price') || lowerName.includes('default') || lowerName.includes('status')) {
      targetScore += 50;
      targetReason = "Contains target-related semantic keyword";
    }

    // Last column bonus
    if (colIdx === headers.length - 1) {
      targetScore += 30;
      targetReason = targetReason ? `${targetReason} + dataset final column position` : "Final column in dataset";
    }

    // Feasibility penalties
    if (inferredType === 'id' || isIdCandidate) {
      targetScore = 0;
    }
    if (isAllConstant) {
      targetScore = 0;
    }
    if (missingPercentage > 30) {
      targetScore -= 30;
    }

    const isTargetCandidate = targetScore >= 40;

    columnProfiles.push({
      name: colName,
      type: inferredType,
      inferredType: inferredType.toUpperCase(),
      missingCount,
      missingPercentage: Number(missingPercentage.toFixed(1)),
      uniqueCount,
      uniquePercentage: Number(uniquePercentage.toFixed(1)),
      isTargetCandidate,
      targetScore,
      targetReason,
      isIdColumn: inferredType === 'id',
      isConstantColumn: inferredType === 'constant',
      stats,
      outlierCount,
      outlierPercentage: Number(((outlierCount / totalRows) * 100).toFixed(1)),
      topCategories,
      sampleValues: nonNullValues.slice(0, 5),
    });
  });

  // Pick top recommended target
  const sortedTargetCandidates = [...columnProfiles].sort((a, b) => b.targetScore - a.targetScore);
  const recommendedTarget = sortedTargetCandidates[0]?.targetScore > 0 
    ? sortedTargetCandidates[0].name 
    : headers[headers.length - 1];

  // Infer recommended task type
  const targetColProfile = columnProfiles.find(c => c.name === recommendedTarget);
  let recommendedTaskType: TaskType = 'binary_classification';

  if (targetColProfile) {
    if (targetColProfile.uniqueCount === 2) {
      recommendedTaskType = 'binary_classification';
    } else if (targetColProfile.type === 'categorical' || (targetColProfile.uniqueCount >= 3 && targetColProfile.uniqueCount <= 15)) {
      recommendedTaskType = 'multiclass_classification';
    } else if (targetColProfile.type === 'numerical' && targetColProfile.uniqueCount > 15) {
      recommendedTaskType = 'regression';
    }
  }

  // Calculate Data Health Score /100
  const healthScore = calculateHealthScore(totalRows, totalColumns, duplicateCount, totalMissingCells, columnProfiles);

  return {
    datasetName,
    totalRows,
    totalColumns,
    numericalCount,
    categoricalCount,
    datetimeCount,
    booleanCount,
    duplicateRows: duplicateCount,
    duplicatePercentage: Number(((duplicateCount / totalRows) * 100).toFixed(1)),
    totalMissingCells,
    totalMissingPercentage: Number(((totalMissingCells / (totalRows * totalColumns)) * 100).toFixed(2)),
    memoryUsageKb: Number(((JSON.stringify(rows).length * 2) / 1024).toFixed(1)),
    columns: columnProfiles,
    recommendedTarget,
    recommendedTaskType,
    healthScore,
  };
}

function calculateHealthScore(
  totalRows: number,
  totalColumns: number,
  duplicates: number,
  missingCells: number,
  columns: ColumnProfile[]
): DataHealthScore {
  const issues: { severity: 'high' | 'medium' | 'low'; message: string; column?: string }[] = [];
  const suggestions: string[] = [];

  // 1. Completeness Score (0-100)
  const totalCells = totalRows * totalColumns;
  const missingRatio = totalCells > 0 ? missingCells / totalCells : 0;
  const completeness = Math.max(0, Math.round(100 - (missingRatio * 300)));

  if (missingRatio > 0.15) {
    issues.push({ severity: 'high', message: `High missing data rate (${(missingRatio * 100).toFixed(1)}% missing cells across dataset)` });
    suggestions.push("Apply median/mode imputation or iterative KNN strategy to restore completeness.");
  } else if (missingRatio > 0.02) {
    issues.push({ severity: 'medium', message: `Moderate missing cells (${(missingRatio * 100).toFixed(1)}% total missingness)` });
    suggestions.push("Impute numerical missing values with column medians to avoid dropping records.");
  }

  // 2. Uniqueness Score (0-100)
  const duplicateRatio = totalRows > 0 ? duplicates / totalRows : 0;
  const uniqueness = Math.max(0, Math.round(100 - (duplicateRatio * 250)));

  if (duplicateRatio > 0.05) {
    issues.push({ severity: 'high', message: `Found ${duplicates} duplicate rows (${(duplicateRatio * 100).toFixed(1)}% duplication)` });
    suggestions.push("Remove duplicate rows before model training to eliminate bias and cross-validation leakage.");
  }

  // 3. Validity Score (Outliers & Constant columns)
  let constantColCount = 0;
  let severeOutlierColCount = 0;

  columns.forEach(col => {
    if (col.isConstantColumn) {
      constantColCount++;
      issues.push({ severity: 'medium', message: `Column '${col.name}' contains a single constant value with zero variance.`, column: col.name });
    }
    if (col.outlierPercentage > 12) {
      severeOutlierColCount++;
      issues.push({ severity: 'low', message: `Column '${col.name}' has ${(col.outlierPercentage).toFixed(1)}% outlier instances (IQR method).`, column: col.name });
    }
  });

  const validity = Math.max(0, Math.round(100 - (constantColCount * 15) - (severeOutlierColCount * 5)));
  if (constantColCount > 0) {
    suggestions.push(`Drop ${constantColCount} zero-variance column(s) to streamline feature dimensions.`);
  }
  if (severeOutlierColCount > 0) {
    suggestions.push("Apply IQR Winsorization (clipping at 1.5x IQR boundaries) to stabilize regression/gradient metrics.");
  }

  // 4. Cardinality & Distribution Sanity
  let highCardIdCount = 0;
  columns.forEach(col => {
    if (col.isIdColumn) {
      highCardIdCount++;
      issues.push({ severity: 'medium', message: `Column '${col.name}' is an identifier with high cardinality.`, column: col.name });
    }
  });
  const cardinalityBalance = Math.max(0, Math.round(100 - (highCardIdCount * 12)));
  const distributionSanity = Math.round((validity + completeness) / 2);

  // Overall Composite Score
  const overall = Math.min(100, Math.max(0, Math.round(
    completeness * 0.35 +
    validity * 0.25 +
    uniqueness * 0.20 +
    cardinalityBalance * 0.10 +
    distributionSanity * 0.10
  )));

  let grade: 'A+' | 'A' | 'B' | 'C' | 'D' | 'F' = 'A';
  let status: 'Optimal' | 'Good' | 'Acceptable' | 'Needs Attention' | 'Critical' = 'Optimal';

  if (overall >= 95) { grade = 'A+'; status = 'Optimal'; }
  else if (overall >= 85) { grade = 'A'; status = 'Good'; }
  else if (overall >= 72) { grade = 'B'; status = 'Acceptable'; }
  else if (overall >= 58) { grade = 'C'; status = 'Needs Attention'; }
  else if (overall >= 40) { grade = 'D'; status = 'Critical'; }
  else { grade = 'F'; status = 'Critical'; }

  if (suggestions.length === 0) {
    suggestions.push("Dataset shows high integrity. Ready for automated cleaning and feature engineering.");
  }

  return {
    overall,
    completeness,
    validity,
    uniqueness,
    distributionSanity,
    cardinalityBalance,
    grade,
    status,
    issues,
    suggestions,
  };
}
