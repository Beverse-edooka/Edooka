/**
 * File: assessment helpers
 * Purpose: Provides a large question pool and random selection utilities.
 */
export interface AssessmentQuestion {
  id: string;
  questionText: string;
  options: string[];
  correctIndex: number;
}

/**
 * Creates a deterministic pool of 120 sample questions.
 * This simulates a 100+ question bank for demo and development.
 */
export function buildQuestionPool(): AssessmentQuestion[] {
  return Array.from({ length: 120 }, (_, i) => {
    const id = `Q-${i + 1}`;
    const correctIndex = i % 4;
    return {
      id,
      questionText: `Which action best improves process quality in a professional workflow?`,
      options: [
        `Option A for question ${i + 1}`,
        `Option B for question ${i + 1}`,
        `Option C for question ${i + 1}`,
        `Option D for question ${i + 1}`,
      ],
      correctIndex,
    };
  });
}

/**
 * Fisher-Yates shuffle for fresh random ordering every attempt.
 */
export function shuffleQuestions<T>(items: T[]): T[] {
  const arr = [...items];
  for (let i = arr.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [arr[i], arr[j]] = [arr[j], arr[i]];
  }
  return arr;
}

/**
 * Selects 18 random questions from a 100+ pool.
 */
export function selectAttemptQuestions(pool: AssessmentQuestion[], total = 18) {
  return shuffleQuestions(pool).slice(0, total);
}
