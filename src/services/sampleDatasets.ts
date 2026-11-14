export interface SampleDatasetMeta {
  id: string;
  name: string;
  category: string;
  description: string;
  taskType: 'binary_classification' | 'regression' | 'multiclass_classification';
  targetColumn: string;
  rowCount: number;
  colCount: number;
  icon: string;
  badge: string;
  csvData: string;
}

// Generate realistic synthetic dataset for Telco Customer Churn
function generateTelcoChurnCSV(): string {
  const headers = "customerID,gender,SeniorCitizen,Partner,Dependents,tenure,PhoneService,MultipleLines,InternetService,OnlineSecurity,TechSupport,Contract,PaperlessBilling,PaymentMethod,MonthlyCharges,TotalCharges,Churn";
  const rows: string[] = [];
  
  const genders = ["Male", "Female"];
  const binaryYN = ["Yes", "No"];
  const internetServices = ["DSL", "Fiber optic", "No"];
  const contracts = ["Month-to-month", "One year", "Two year"];
  const paymentMethods = ["Electronic check", "Mailed check", "Bank transfer", "Credit card"];

  for (let i = 1; i <= 250; i++) {
    const id = `7590-${1000 + i}`;
    const gender = genders[i % 2];
    const senior = (i % 6 === 0) ? 1 : 0;
    const partner = (i % 3 === 0) ? "Yes" : "No";
    const dependents = (partner === "Yes" && i % 2 === 0) ? "Yes" : "No";
    const tenure = Math.floor((i * 7) % 72) + 1;
    const phone = (i % 10 === 0) ? "No" : "Yes";
    const multi = phone === "Yes" ? ((i % 3 === 0) ? "Yes" : "No") : "No phone service";
    const internet = internetServices[i % 3];
    const security = internet === "No" ? "No internet service" : (i % 4 === 0 ? "Yes" : "No");
    const support = internet === "No" ? "No internet service" : (i % 5 === 0 ? "Yes" : "No");
    const contract = contracts[i % 3];
    const paperless = (i % 2 === 0) ? "Yes" : "No";
    const payment = paymentMethods[i % 4];
    
    // Feature dependent monthly charges
    let baseMonthly = 20;
    if (internet === "DSL") baseMonthly += 35;
    if (internet === "Fiber optic") baseMonthly += 55;
    if (security === "Yes") baseMonthly += 10;
    if (support === "Yes") baseMonthly += 15;
    const monthlyCharges = Number((baseMonthly + (i % 15) * 1.5).toFixed(2));
    const totalCharges = Number((monthlyCharges * tenure + (i % 50)).toFixed(2));

    // Churn probability depends on contract, monthly charges, fiber optic, and tenure
    let churnScore = 0;
    if (contract === "Month-to-month") churnScore += 0.45;
    if (internet === "Fiber optic") churnScore += 0.25;
    if (tenure < 12) churnScore += 0.35;
    if (support === "No") churnScore += 0.15;
    if (monthlyCharges > 85) churnScore += 0.2;
    if (contract === "Two year") churnScore -= 0.6;
    if (tenure > 40) churnScore -= 0.4;
    
    const churn = (churnScore + (i % 7) * 0.05 > 0.65) ? "Yes" : "No";

    rows.push(`${id},${gender},${senior},${partner},${dependents},${tenure},${phone},${multi},${internet},${security},${support},${contract},${paperless},${payment},${monthlyCharges},${totalCharges},${churn}`);
  }
  return [headers, ...rows].join("\n");
}

// Generate realistic House Price dataset for regression
function generateHousePricesCSV(): string {
  const headers = "Id,LotArea,OverallQual,OverallCond,YearBuilt,GrLivArea,FullBath,HalfBath,BedroomAbvGr,GarageCars,Neighborhood,SaleCondition,SalePrice";
  const rows: string[] = [];
  const neighborhoods = ["CollgCr", "Veenker", "Crawfor", "NoRidge", "Mitchel", "Somerst", "NWAmes", "OldTown"];
  const conditions = ["Normal", "Abnorml", "Partial", "AdjLand", "Alloca"];

  for (let i = 1; i <= 250; i++) {
    const id = i;
    const overallQual = Math.min(10, Math.max(3, Math.floor((i % 7) + 4)));
    const overallCond = Math.min(9, Math.max(4, Math.floor((i % 5) + 4)));
    const yearBuilt = 1960 + Math.floor((i * 13) % 62);
    const lotArea = 5000 + (i * 240) % 18000;
    const grLivArea = 850 + (overallQual * 180) + (i * 35) % 1500;
    const fullBath = overallQual >= 7 ? 2 : (overallQual >= 5 ? 1 : 1);
    const halfBath = (i % 2 === 0) ? 1 : 0;
    const bedrooms = 2 + (i % 3);
    const garageCars = overallQual >= 8 ? 3 : (overallQual >= 6 ? 2 : 1);
    const neighborhood = neighborhoods[i % neighborhoods.length];
    const condition = conditions[i % conditions.length];

    // Price formula
    let basePrice = 50000 + (grLivArea * 85) + (overallQual * 22000) + (garageCars * 12000) + ((yearBuilt - 1960) * 800);
    if (neighborhood === "NoRidge" || neighborhood === "Somerst") basePrice += 45000;
    if (neighborhood === "OldTown") basePrice -= 20000;
    const salePrice = Math.round(basePrice + ((i % 19) * 1500));

    rows.push(`${id},${lotArea},${overallQual},${overallCond},${yearBuilt},${grLivArea},${fullBath},${halfBath},${bedrooms},${garageCars},${neighborhood},${condition},${salePrice}`);
  }
  return [headers, ...rows].join("\n");
}

// Generate Breast Cancer Wisconsin dataset
function generateBreastCancerCSV(): string {
  const headers = "id,radius_mean,texture_mean,perimeter_mean,area_mean,smoothness_mean,compactness_mean,concavity_mean,concave_points_mean,symmetry_mean,fractal_dimension_mean,diagnosis";
  const rows: string[] = [];

  for (let i = 1; i <= 250; i++) {
    const id = 842300 + i;
    const isMalignant = (i % 3 === 0 || (i % 7 === 0 && i % 2 === 1));
    
    // Malignant tumors have higher radius, area, concavity
    const radius = isMalignant ? 16 + (i % 10) * 0.8 : 11 + (i % 7) * 0.6;
    const texture = isMalignant ? 20 + (i % 9) * 0.9 : 15 + (i % 8) * 0.7;
    const perimeter = Number((radius * 6.28 + (i % 5)).toFixed(2));
    const area = Number((3.14 * radius * radius).toFixed(1));
    const smoothness = Number((isMalignant ? 0.105 + (i % 10) * 0.003 : 0.085 + (i % 8) * 0.002).toFixed(4));
    const compactness = Number((isMalignant ? 0.14 + (i % 10) * 0.01 : 0.06 + (i % 8) * 0.008).toFixed(4));
    const concavity = Number((isMalignant ? 0.15 + (i % 10) * 0.015 : 0.03 + (i % 8) * 0.005).toFixed(4));
    const concavePoints = Number((isMalignant ? 0.08 + (i % 10) * 0.008 : 0.02 + (i % 8) * 0.003).toFixed(4));
    const symmetry = Number((0.17 + (i % 10) * 0.005).toFixed(4));
    const fractal = Number((0.06 + (i % 10) * 0.002).toFixed(4));
    const diagnosis = isMalignant ? "Malignant" : "Benign";

    rows.push(`${id},${radius.toFixed(2)},${texture.toFixed(2)},${perimeter},${area},${smoothness},${compactness},${concavity},${concavePoints},${symmetry},${fractal},${diagnosis}`);
  }
  return [headers, ...rows].join("\n");
}

// Generate Credit Default Risk dataset
function generateCreditDefaultCSV(): string {
  const headers = "ID,LIMIT_BAL,SEX,EDUCATION,MARRIAGE,AGE,PAY_0,BILL_AMT1,BILL_AMT2,PAY_AMT1,PAY_AMT2,default_payment_next_month";
  const rows: string[] = [];
  const sexList = ["Male", "Female"];
  const eduList = ["Graduate School", "University", "High School", "Others"];
  const marList = ["Married", "Single", "Others"];

  for (let i = 1; i <= 250; i++) {
    const id = i;
    const limitBal = 20000 + (i * 15000) % 400000;
    const sex = sexList[i % 2];
    const edu = eduList[i % 4];
    const mar = marList[i % 3];
    const age = 22 + (i * 5) % 45;
    const pay0 = (i % 4 === 0) ? 2 : ((i % 3 === 0) ? 1 : 0);
    const bill1 = Math.round(limitBal * (0.2 + (i % 7) * 0.1));
    const bill2 = Math.round(bill1 * 0.95);
    const payAmt1 = pay0 > 0 ? Math.round(bill1 * 0.1) : Math.round(bill1 * 0.8);
    const payAmt2 = pay0 > 0 ? Math.round(bill2 * 0.15) : Math.round(bill2 * 0.85);

    let defaultRisk = 0;
    if (pay0 >= 2) defaultRisk += 0.55;
    if (limitBal < 50000) defaultRisk += 0.2;
    if (payAmt1 < bill1 * 0.2) defaultRisk += 0.3;
    if (age < 25) defaultRisk += 0.15;
    const isDefault = (defaultRisk + (i % 5) * 0.05 > 0.5) ? 1 : 0;

    rows.push(`${id},${limitBal},${sex},${edu},${mar},${age},${pay0},${bill1},${bill2},${payAmt1},${payAmt2},${isDefault}`);
  }
  return [headers, ...rows].join("\n");
}

// Generate Employee Attrition dataset
function generateEmployeeAttritionCSV(): string {
  const headers = "EmployeeID,Age,Department,DistanceFromHome,Education,JobSatisfaction,MonthlyIncome,NumCompaniesWorked,OverTime,PercentSalaryHike,TotalWorkingYears,YearsAtCompany,Attrition";
  const rows: string[] = [];
  const depts = ["Sales", "Research & Development", "Human Resources"];
  const yesNo = ["Yes", "No"];

  for (let i = 1; i <= 250; i++) {
    const id = 1000 + i;
    const age = 22 + (i * 3) % 38;
    const dept = depts[i % 3];
    const distance = 1 + (i * 7) % 29;
    const education = 1 + (i % 4);
    const satisfaction = 1 + (i % 4);
    const overtime = (i % 3 === 0) ? "Yes" : "No";
    const salaryHike = 11 + (i * 2) % 15;
    const totalExp = Math.max(1, Math.floor(age - 21));
    const yearsAtCo = Math.min(totalExp, Math.floor((i * 3) % 18) + 1);
    const monthlyIncome = Math.round(2500 + (totalExp * 450) + (satisfaction * 300) + (i % 10) * 200);

    let attritionScore = 0;
    if (overtime === "Yes") attritionScore += 0.35;
    if (satisfaction <= 2) attritionScore += 0.35;
    if (monthlyIncome < 3500) attritionScore += 0.25;
    if (distance > 18) attritionScore += 0.2;
    if (yearsAtCo < 2) attritionScore += 0.2;
    if (age > 40) attritionScore -= 0.3;
    if (satisfaction === 4) attritionScore -= 0.3;

    const attrition = (attritionScore + (i % 6) * 0.05 > 0.55) ? "Yes" : "No";

    rows.push(`${id},${age},${dept},${distance},${education},${satisfaction},${monthlyIncome},${(i % 5)},${overtime},${salaryHike},${totalExp},${yearsAtCo},${attrition}`);
  }
  return [headers, ...rows].join("\n");
}

// Generate Wine Quality dataset
function generateWineQualityCSV(): string {
  const headers = "fixed_acidity,volatile_acidity,citric_acid,residual_sugar,chlorides,free_sulfur_dioxide,total_sulfur_dioxide,density,pH,sulphates,alcohol,quality";
  const rows: string[] = [];

  for (let i = 1; i <= 250; i++) {
    const fixedAcidity = Number((6.5 + (i % 15) * 0.3).toFixed(1));
    const volatileAcidity = Number((0.2 + (i % 12) * 0.05).toFixed(2));
    const citricAcid = Number((0.1 + (i % 10) * 0.04).toFixed(2));
    const residualSugar = Number((1.5 + (i % 15) * 0.8).toFixed(1));
    const chlorides = Number((0.04 + (i % 8) * 0.008).toFixed(3));
    const freeSO2 = 10 + (i * 3) % 45;
    const totalSO2 = Math.round(freeSO2 * (2.2 + (i % 4) * 0.4));
    const density = Number((0.992 + (i % 10) * 0.0008).toFixed(4));
    const pH = Number((3.1 + (i % 8) * 0.05).toFixed(2));
    const sulphates = Number((0.45 + (i % 12) * 0.04).toFixed(2));
    const alcohol = Number((9.2 + (i % 14) * 0.35).toFixed(1));

    // Quality calculation (3 to 8)
    let score = 5.5 + (alcohol - 10) * 0.8 + (sulphates - 0.5) * 2.0 - (volatileAcidity - 0.4) * 3.5;
    const quality = Math.min(8, Math.max(3, Math.round(score + (i % 5 - 2) * 0.3)));

    rows.push(`${fixedAcidity},${volatileAcidity},${citricAcid},${residualSugar},${chlorides},${freeSO2},${totalSO2},${density},${pH},${sulphates},${alcohol},${quality}`);
  }
  return [headers, ...rows].join("\n");
}

export const SAMPLE_DATASETS: SampleDatasetMeta[] = [
  {
    id: "telco_churn",
    name: "Customer Churn Intelligence",
    category: "Customer Analytics & Retention",
    description: "Telecom subscriber dataset with contract terms, monthly fees, and tenure to predict customer attrition.",
    taskType: "binary_classification",
    targetColumn: "Churn",
    rowCount: 250,
    colCount: 17,
    icon: "Users",
    badge: "Binary Classification",
    csvData: generateTelcoChurnCSV(),
  },
  {
    id: "house_prices",
    name: "Ames Real Estate Valuation",
    category: "Property & Asset Pricing",
    description: "Architectural specifications, neighborhood ratings, and lot dimensions to predict residential property sale values.",
    taskType: "regression",
    targetColumn: "SalePrice",
    rowCount: 250,
    colCount: 13,
    icon: "Home",
    badge: "Regression",
    csvData: generateHousePricesCSV(),
  },
  {
    id: "breast_cancer",
    name: "Oncology Diagnostic Biopsy",
    category: "Healthcare & Clinical ML",
    description: "Fine needle aspirate cell nucleus geometric measurements to classify malignant vs benign tumors.",
    taskType: "binary_classification",
    targetColumn: "diagnosis",
    rowCount: 250,
    colCount: 12,
    icon: "Activity",
    badge: "Binary Classification",
    csvData: generateBreastCancerCSV(),
  },
  {
    id: "credit_default",
    name: "Credit Default & Solvency Risk",
    category: "Fintech & Credit Risk",
    description: "Credit line limits, bill statements, repayment history, and demographic indicators for credit default forecasting.",
    taskType: "binary_classification",
    targetColumn: "default_payment_next_month",
    rowCount: 250,
    colCount: 12,
    icon: "CreditCard",
    badge: "Binary Classification",
    csvData: generateCreditDefaultCSV(),
  },
  {
    id: "employee_attrition",
    name: "Workforce Attrition & Mobility",
    category: "HR Analytics & Talent",
    description: "Employee compensation, overtime frequency, commute distance, and satisfaction scores predicting turnover.",
    taskType: "binary_classification",
    targetColumn: "Attrition",
    rowCount: 250,
    colCount: 13,
    icon: "Briefcase",
    badge: "Binary Classification",
    csvData: generateEmployeeAttritionCSV(),
  },
  {
    id: "wine_quality",
    name: "Physicochemical Wine Benchmark",
    category: "Quality Assurance & Chemistry",
    description: "Acidity, alcohol percentage, sulphates, residual sugar, and pH metrics evaluating vintage quality.",
    taskType: "regression",
    targetColumn: "quality",
    rowCount: 250,
    colCount: 12,
    icon: "Wine",
    badge: "Regression / Score",
    csvData: generateWineQualityCSV(),
  },
];
