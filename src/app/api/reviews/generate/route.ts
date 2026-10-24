import { POST as generateReviewsPost } from '@/app/api/generate-reviews/route';

export const runtime = 'edge';
export const POST = generateReviewsPost;
