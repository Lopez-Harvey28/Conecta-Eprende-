export type RiskScoreInput = {
  avgSearchTimeSeconds:number;
  avgRequestToCompletionMinutes:number;
  avgMessagesPerRequest:number;
  newAccountsPercentage:number;
  repeatedTargetProviderScore:number;
  ratingConcentrationScore:number;
};

export type RiskLevel = "normal"|"unusual"|"suspicious"|"high-risk";

export type RiskScoreResult = {
  score:number;
  level:RiskLevel;
  recommendedAction:string;
  shouldGenerateReport:boolean;
};

const clamp=(value:number,min=0,max=100)=>Math.min(max,Math.max(min,value));

export function classifyRiskScore(score:number):RiskLevel {
  if(score>=81)return "high-risk";
  if(score>=61)return "suspicious";
  if(score>=31)return "unusual";
  return "normal";
}

export function calculateRiskScore(input:RiskScoreInput):RiskScoreResult {
  const fastSearchPenalty=input.avgSearchTimeSeconds<8?20:input.avgSearchTimeSeconds<20?10:0;
  const fastCompletionPenalty=input.avgRequestToCompletionMinutes<15?20:input.avgRequestToCompletionMinutes<60?10:0;
  const lowMessagePenalty=input.avgMessagesPerRequest<2?15:input.avgMessagesPerRequest<4?8:0;
  const newAccountPenalty=clamp(input.newAccountsPercentage)*0.2;
  const repeatedTargetPenalty=clamp(input.repeatedTargetProviderScore)*0.25;
  const concentrationPenalty=clamp(input.ratingConcentrationScore)*0.2;
  const score=Math.round(clamp(fastSearchPenalty+fastCompletionPenalty+lowMessagePenalty+newAccountPenalty+repeatedTargetPenalty+concentrationPenalty));
  const level=classifyRiskScore(score);

  return {
    score,
    level,
    shouldGenerateReport:score>=70,
    recommendedAction:score>=70?"Revisión manual: analizar patrón agregado sin exponer datos personales.":"Monitorear con controles normales.",
  };
}
