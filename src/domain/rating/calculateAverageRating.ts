export type RatingReviewInput = {
  score:number;
  verified:boolean;
};

export function calculateAverageRating(reviews:RatingReviewInput[]):number|null {
  const verifiedReviews=reviews.filter(review=>review.verified&&Number.isFinite(review.score));
  if(verifiedReviews.length===0)return null;
  const total=verifiedReviews.reduce((sum,review)=>sum+Math.min(5,Math.max(1,review.score)),0);
  return Math.round((total/verifiedReviews.length)*10)/10;
}
