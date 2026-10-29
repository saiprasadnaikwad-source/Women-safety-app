import { MLPredictionResponse } from './mlService';
import { dbStore, ITrip, IAnomalyEvent } from '../models/db';

export interface StagedRiskResult {
  riskScore: number;
  riskLevel: 'LOW' | 'MODERATE' | 'HIGH' | 'CRITICAL';
  stage: 'NORMAL' | 'STAGE_1_MINOR_DEVIATION' | 'STAGE_2_PERSISTENT_DEVIATION' | 'STAGE_3_HIGH_RISK_ESCALATION';
  userMessage: string;
  actionRequired: boolean;
}

export function evaluateJourneyRisk(
  trip: ITrip,
  mlResult: MLPredictionResponse,
  hasActiveSOS: boolean
): StagedRiskResult {
  const distMeters = mlResult.feature_summary.distance_from_route_m;
  const isGeofenceBreached = distMeters > 500;
  const isMLAnomaly = mlResult.anomaly;
  const stopMins = mlResult.feature_summary.stop_duration_min;

  let score = mlResult.risk_score;

  // SOS override
  if (hasActiveSOS) {
    return {
      riskScore: 100,
      riskLevel: 'CRITICAL',
      stage: 'STAGE_3_HIGH_RISK_ESCALATION',
      userMessage: 'EMERGENCY: Discreet SOS activated. Emergency contacts and authorities notified.',
      actionRequired: true
    };
  }

  // Staged Response Logic
  if (!isGeofenceBreached && !isMLAnomaly && stopMins < 10) {
    return {
      riskScore: Math.min(30, score),
      riskLevel: 'LOW',
      stage: 'NORMAL',
      userMessage: 'You are on the expected route and moving safely.',
      actionRequired: false
    };
  }

  // Stage 1 — Minor deviation (500m - 1200m corridor breach) or moderate ML anomaly
  if (isGeofenceBreached && distMeters <= 1200 && score < 70) {
    return {
      riskScore: Math.max(45, score),
      riskLevel: 'MODERATE',
      stage: 'STAGE_1_MINOR_DEVIATION',
      userMessage: `Route deviation detected (${distMeters} meters from corridor). Please confirm you are safe.`,
      actionRequired: true
    };
  }

  // Stage 2 — Persistent deviation / Prolonged stop combined with ML anomaly
  if ((isGeofenceBreached && distMeters > 1200) || (stopMins > 15 && isMLAnomaly)) {
    return {
      riskScore: Math.max(75, score),
      riskLevel: 'HIGH',
      stage: 'STAGE_2_PERSISTENT_DEVIATION',
      userMessage: 'Unusual journey pattern detected. Safety prompt active.',
      actionRequired: true
    };
  }

  // Stage 3 — High-Risk Anomaly
  return {
    riskScore: Math.max(85, score),
    riskLevel: 'CRITICAL',
    stage: 'STAGE_3_HIGH_RISK_ESCALATION',
    userMessage: 'Critical anomaly detected! Safety verification timeout — emergency alert triggered.',
    actionRequired: true
  };
}
