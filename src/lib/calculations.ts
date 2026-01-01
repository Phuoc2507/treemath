// Tree measurement calculations

export interface TreeData {
  treeNumber: number;
  actualHeight: number; // meters
  actualDiameter: number; // cm
  species: string;
}

export interface MeasurementInput {
  circumference: number; // cm
  height: number; // meters (directly measured by user)
}

export interface CalculationResult {
  calculatedHeight: number; // meters
  calculatedDiameter: number; // cm
  heightAccuracy: number; // percentage
  diameterAccuracy: number; // percentage
  overallAccuracy: number; // percentage
  biomassKg: number;
  co2AbsorbedKg: number;
}

const EYE_HEIGHT = 1.6; // meters - average eye height

/**
 * Calculate tree diameter from circumference
 * D = Circumference / π
 */
export function calculateDiameter(circumference: number): number {
  return circumference / Math.PI;
}

/**
 * Calculate tree height using trigonometry
 * H = distance * tan(angle in radians) + eye height
 */
export function calculateHeight(angle: number, distance: number): number {
  const angleInRadians = (angle * Math.PI) / 180;
  return distance * Math.tan(angleInRadians) + EYE_HEIGHT;
}

/**
 * Calculate accuracy percentage
 * Accuracy = 100 - |measured - actual| / actual * 100
 */
export function calculateAccuracy(measured: number, actual: number): number {
  if (actual === 0) return 0;
  const percentageError = Math.abs((measured - actual) / actual) * 100;
  return Math.max(0, Math.min(100, 100 - percentageError));
}

/**
 * Calculate biomass using allometric equation
 * Simplified formula: Biomass (kg) = 0.0509 * D^2.54 * H^0.57
 * Where D is diameter (cm) and H is height (m)
 */
export function calculateBiomass(diameter: number, height: number): number {
  return 0.0509 * Math.pow(diameter, 2.54) * Math.pow(height, 0.57);
}

/**
 * Calculate CO2 absorbed
 * CO2 = Biomass * 0.5 (carbon content) * 3.67 (CO2/C ratio)
 */
export function calculateCO2Absorbed(biomassKg: number): number {
  return biomassKg * 0.5 * 3.67;
}

/**
 * Main calculation function
 */
export function calculateTreeMeasurement(
  input: MeasurementInput,
  actualTree: TreeData
): CalculationResult {
  const calculatedDiameter = calculateDiameter(input.circumference);
  const calculatedHeight = input.height; // User inputs height directly
  
  const heightAccuracy = calculateAccuracy(calculatedHeight, actualTree.actualHeight);
  const diameterAccuracy = calculateAccuracy(calculatedDiameter, actualTree.actualDiameter);
  const overallAccuracy = (heightAccuracy + diameterAccuracy) / 2;
  
  const biomassKg = calculateBiomass(calculatedDiameter, calculatedHeight);
  const co2AbsorbedKg = calculateCO2Absorbed(biomassKg);
  
  return {
    calculatedHeight: Math.round(calculatedHeight * 100) / 100,
    calculatedDiameter: Math.round(calculatedDiameter * 100) / 100,
    heightAccuracy: Math.round(heightAccuracy * 10) / 10,
    diameterAccuracy: Math.round(diameterAccuracy * 10) / 10,
    overallAccuracy: Math.round(overallAccuracy * 10) / 10,
    biomassKg: Math.round(biomassKg * 10) / 10,
    co2AbsorbedKg: Math.round(co2AbsorbedKg * 10) / 10,
  };
}

/**
 * Get equivalent representations for CO2
 */
export function getCO2Equivalents(co2Kg: number) {
  return {
    // Average car emits ~4.6 metric tons CO2/year = ~12.6 kg/day
    carDays: Math.round(co2Kg / 12.6 * 10) / 10,
    // Average smartphone charge = ~8.22g CO2
    phoneCharges: Math.round(co2Kg * 1000 / 8.22),
    // Average plastic bottle = ~82.8g CO2
    plasticBottles: Math.round(co2Kg * 1000 / 82.8),
  };
}
