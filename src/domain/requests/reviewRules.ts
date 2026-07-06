import type { ProviderRequest, VerifiedReview } from "../../lib/identity";

export type ReviewValidationInput = {
  request:ProviderRequest|null;
  review:Pick<VerifiedReview,"reviewerUserId"|"reviewedProviderProfileId"|"requestId">;
  existingReviews:Pick<VerifiedReview,"requestId"|"reviewerUserId">[];
  reviewedProviderOwnerUserId:string;
};

export function validateVerifiedReview(input:ReviewValidationInput):{valid:true}|{valid:false;reason:string} {
  const {request,review,existingReviews,reviewedProviderOwnerUserId}=input;
  if(!request)return {valid:false,reason:"REQUEST_NOT_FOUND"};
  if(request.id!==review.requestId)return {valid:false,reason:"REQUEST_MISMATCH"};
  if(request.status!=="COMPLETED")return {valid:false,reason:"REQUEST_NOT_COMPLETED"};
  if(!request.confirmedByRequesterAt||!request.confirmedByProviderAt)return {valid:false,reason:"BILATERAL_CONFIRMATION_REQUIRED"};
  if(request.targetProviderProfileId!==review.reviewedProviderProfileId)return {valid:false,reason:"WRONG_PROVIDER_PROFILE"};
  if(request.requesterUserId!==review.reviewerUserId)return {valid:false,reason:"REVIEWER_NOT_PARTICIPANT"};
  if(review.reviewerUserId===reviewedProviderOwnerUserId)return {valid:false,reason:"SELF_REVIEW_NOT_ALLOWED"};
  if(existingReviews.some(item=>item.requestId===review.requestId&&item.reviewerUserId===review.reviewerUserId))return {valid:false,reason:"DUPLICATE_REVIEW"};
  return {valid:true};
}
