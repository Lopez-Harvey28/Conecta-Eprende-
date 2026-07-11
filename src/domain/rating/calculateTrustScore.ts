export type TrustScoreInput = {
  profileComplete:boolean;
  contactVerified:boolean;
  requestsResponded:number;
  requestsCompleted:number;
  avgReviewScore:number|null;
  responseTimeScore:number;
  accountAgeFactor:number;
  suspiciousActivityPenalty:number;
};

const clamp=(value:number,min=0,max=100)=>Math.min(max,Math.max(min,value));

export function calculateTrustScore(input:TrustScoreInput):number {
  const reviewScore=input.avgReviewScore===null?0:clamp(input.avgReviewScore,0,5);
  const trustScoreBase=
    (input.profileComplete?10:0)+
    (input.contactVerified?10:0)+
    (Math.min(Math.max(input.requestsResponded,0)/5,1)*15)+
    (Math.min(Math.max(input.requestsCompleted,0)/10,1)*25)+
    ((reviewScore/5)*25)+
    (clamp(input.responseTimeScore,0,1)*10)+
    (clamp(input.accountAgeFactor,0,1)*5);

  return Math.round(clamp(trustScoreBase-Math.max(0,input.suspiciousActivityPenalty)));
}
