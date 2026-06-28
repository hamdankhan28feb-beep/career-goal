import { getUniversities } from '@/lib/data';
import PredictorClient from './predictor-client';

export const metadata = {
  title: 'Admission Predictor',
  description: 'Predict your admission chances at Pakistani universities based on your academic aggregate and budget.',
};

export default function PredictorPage() {
  const universities = getUniversities();
  return <PredictorClient universities={universities} />;
}
