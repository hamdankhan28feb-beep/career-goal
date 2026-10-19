export type QuizQuestion = {
  id: string;
  category: string;
  question: string;
  field_weights: Record<string, number>;
};

export const QUIZ_QUESTIONS: QuizQuestion[] = [
  // Math & Logic
  { id: 'q1', category: 'Math & Logic', question: 'How much do you enjoy solving complex mathematical problems?', field_weights: { 'computer-science': 4, 'software-engineering': 4, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 5, 'civil-engineering': 4, 'bba': 2, 'accounting-finance': 3, 'mbbs': 2, 'pharmacy': 2, 'psychology': 2, 'architecture': 2, 'cyber-security': 3 } },
  { id: 'q2', category: 'Math & Logic', question: 'How comfortable are you with statistics and probability?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 3, 'civil-engineering': 3, 'bba': 3, 'accounting-finance': 4, 'mbbs': 2, 'pharmacy': 2, 'psychology': 4, 'architecture': 2, 'cyber-security': 2 } },
  { id: 'q3', category: 'Math & Logic', question: 'Do you enjoy logic puzzles and algorithm challenges?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 5, 'data-science': 4, 'electrical-engineering': 4, 'civil-engineering': 3, 'bba': 2, 'accounting-finance': 2, 'mbbs': 2, 'pharmacy': 2, 'psychology': 3, 'architecture': 2, 'cyber-security': 5 } },
  // Programming
  { id: 'q4', category: 'Programming', question: 'How much do you enjoy writing code and building software?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 5, 'data-science': 4, 'electrical-engineering': 3, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 2, 'cyber-security': 5 } },
  { id: 'q5', category: 'Programming', question: 'How interested are you in building websites or mobile apps?', field_weights: { 'computer-science': 5, 'software-engineering': 5, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 2, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 3, 'cyber-security': 4 } },
  { id: 'q6', category: 'Programming', question: 'Do you enjoy finding and fixing bugs in code or systems?', field_weights: { 'computer-science': 4, 'software-engineering': 5, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 3, 'civil-engineering': 2, 'bba': 1, 'accounting-finance': 2, 'mbbs': 2, 'pharmacy': 2, 'psychology': 2, 'architecture': 1, 'cyber-security': 5 } },
  // Biology & Medicine
  { id: 'q7', category: 'Biology & Medicine', question: 'How passionate are you about biology, human anatomy, or medicine?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 5, 'pharmacy': 5, 'psychology': 4, 'architecture': 1, 'cyber-security': 1 } },
  { id: 'q8', category: 'Biology & Medicine', question: 'Do you want to directly help patients in a clinical setting?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 5, 'pharmacy': 4, 'psychology': 5, 'architecture': 1, 'cyber-security': 1 } },
  { id: 'q9', category: 'Biology & Medicine', question: 'How interested are you in pharmaceutical sciences and drugs?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 2, 'accounting-finance': 1, 'mbbs': 4, 'pharmacy': 5, 'psychology': 2, 'architecture': 1, 'cyber-security': 1 } },
  // Business
  { id: 'q10', category: 'Business', question: 'How much do you enjoy leadership and managing teams?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 3, 'mbbs': 2, 'pharmacy': 2, 'psychology': 3, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q11', category: 'Business', question: 'Are you interested in marketing, sales, or brand building?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 2, 'data-science': 3, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 5, 'accounting-finance': 2, 'mbbs': 1, 'pharmacy': 2, 'psychology': 2, 'architecture': 2, 'cyber-security': 1 } },
  { id: 'q12', category: 'Business', question: 'How interested are you in entrepreneurship and starting your own business?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 3, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 4, 'mbbs': 2, 'pharmacy': 3, 'psychology': 3, 'architecture': 4, 'cyber-security': 3 } },
  // Creativity & Design
  { id: 'q13', category: 'Creativity & Design', question: 'How much do you enjoy drawing, design, or visual art?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 1, 'civil-engineering': 2, 'bba': 2, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 1 } },
  { id: 'q14', category: 'Creativity & Design', question: 'Are you interested in designing spaces, buildings, or environments?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 2, 'civil-engineering': 4, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 1 } },
  { id: 'q15', category: 'Creativity & Design', question: 'Do you enjoy working on UI/UX or digital design projects?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 3, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 5, 'cyber-security': 2 } },
  // Communication & Social
  { id: 'q16', category: 'Communication', question: 'How much do you enjoy communicating with and helping people?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 2, 'bba': 4, 'accounting-finance': 3, 'mbbs': 5, 'pharmacy': 4, 'psychology': 5, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q17', category: 'Communication', question: 'Are you interested in understanding human behavior and emotions?', field_weights: { 'computer-science': 2, 'software-engineering': 1, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 1, 'civil-engineering': 1, 'bba': 3, 'accounting-finance': 2, 'mbbs': 3, 'pharmacy': 2, 'psychology': 5, 'architecture': 3, 'cyber-security': 2 } },
  { id: 'q18', category: 'Communication', question: 'Do you enjoy public speaking and presenting ideas?', field_weights: { 'computer-science': 2, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 3, 'bba': 5, 'accounting-finance': 3, 'mbbs': 3, 'pharmacy': 2, 'psychology': 4, 'architecture': 3, 'cyber-security': 2 } },
  // Research
  { id: 'q19', category: 'Research', question: 'How much do you enjoy conducting experiments and research?', field_weights: { 'computer-science': 3, 'software-engineering': 2, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 4, 'civil-engineering': 3, 'bba': 2, 'accounting-finance': 2, 'mbbs': 4, 'pharmacy': 4, 'psychology': 5, 'architecture': 3, 'cyber-security': 3 } },
  { id: 'q20', category: 'Research', question: 'Are you interested in data analysis and finding patterns in data?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 5, 'data-science': 5, 'electrical-engineering': 3, 'civil-engineering': 2, 'bba': 3, 'accounting-finance': 4, 'mbbs': 3, 'pharmacy': 3, 'psychology': 4, 'architecture': 2, 'cyber-security': 3 } },
  // Infrastructure
  { id: 'q21', category: 'Infrastructure', question: 'How interested are you in building infrastructure like roads, bridges, dams?', field_weights: { 'computer-science': 1, 'software-engineering': 1, 'artificial-intelligence': 1, 'data-science': 1, 'electrical-engineering': 3, 'civil-engineering': 5, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 4, 'cyber-security': 1 } },
  { id: 'q22', category: 'Infrastructure', question: 'Do you enjoy working with electrical circuits and electronics?', field_weights: { 'computer-science': 3, 'software-engineering': 2, 'artificial-intelligence': 2, 'data-science': 1, 'electrical-engineering': 5, 'civil-engineering': 2, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 1, 'cyber-security': 3 } },
  // Security
  { id: 'q23', category: 'Security', question: 'How interested are you in network security and ethical hacking?', field_weights: { 'computer-science': 4, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 1, 'architecture': 1, 'cyber-security': 5 } },
  { id: 'q24', category: 'Security', question: 'Do you enjoy protecting systems and investigating cyber threats?', field_weights: { 'computer-science': 3, 'software-engineering': 3, 'artificial-intelligence': 3, 'data-science': 2, 'electrical-engineering': 2, 'civil-engineering': 1, 'bba': 1, 'accounting-finance': 1, 'mbbs': 1, 'pharmacy': 1, 'psychology': 2, 'architecture': 1, 'cyber-security': 5 } },
];


export const QUIZ_OPTIONS = [
  { value: 0, label: 'Not at all' },
  { value: 1, label: 'A little' },
  { value: 2, label: 'Somewhat' },
  { value: 3, label: 'Quite a bit' },
  { value: 4, label: 'Very much' },
];


export function quizCategories(): string[] {
  return [...new Set(QUIZ_QUESTIONS.map((q) => q.category))];
}
