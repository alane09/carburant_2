// COFICAB ENERGIX Dashboard - SER Module Components
// 
// This file exports all components related to the Situation Énergétique de Référence (SER) module
// for easy imports throughout the application.

// Core components
export * from './core/ser-client';
export * from './core/ser-equation';
export * from './core/ser-metrics';
export * from './core/regression-metrics';

// Input components
export * from './inputs/ser-coefficient-input';
export * from './inputs/ser-controls';

// Visualization components
export * from './visualizations/monthly-data-table';
export * from './visualizations/regression-analysis-charts';
export * from './visualizations/regression-chart';
export * from './visualizations/consumption-analysis-table';
export * from './visualizations/consumption-evolution-chart';
