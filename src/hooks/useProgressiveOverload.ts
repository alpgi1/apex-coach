import { useState } from 'react';
import { getWorkoutHistory } from '../services/storage/workoutStorage';
import { AICoachProgressionResponse } from '../types/api.types';
import { RPEScale } from '../types/workout.types';
import { calculateProgressionSuggestion } from '../utils/progressionLogic';

export const useProgressiveOverload = () => {
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [suggestion, setSuggestion] = useState<AICoachProgressionResponse | null>(null);
    const [error, setError] = useState<string | null>(null);

    const fetchSuggestion = async (
        exerciseId: string,
        targetRpe: RPEScale | number,
        idealRepsMin: number,
        idealRepsMax: number
    ): Promise<void> => {
        setIsLoading(true);
        setError(null);
        setSuggestion(null);

        try {
            // Future API Call goes here (Phase 2):
            // const response = await api.post('/v1/ai/progression', { exerciseId, targetRpe, targetReps });
            // setSuggestion(response.data);

            // Phase 1 Local Implementation:
            const history = await getWorkoutHistory();
            const localSuggestion = calculateProgressionSuggestion(
                history,
                exerciseId,
                targetRpe,
                idealRepsMin,
                idealRepsMax
            );

            if (localSuggestion) {
                setSuggestion({
                    exerciseId,
                    suggestedWeightKg: localSuggestion.suggestedWeightKg,
                    suggestedRepsMin: localSuggestion.suggestedRepsMin,
                    suggestedRepsMax: localSuggestion.suggestedRepsMax,
                    confidenceScore: 0.8, // Stubbed local confidence
                    rationale: localSuggestion.rationale,
                });
            } else {
                setSuggestion(null); // No history found
            }
        } catch (err) {
            console.error('Failed to calculate progression:', err);
            setError('Could not calculate a progression suggestion at this time.');
            setSuggestion(null);
        } finally {
            setIsLoading(false);
        }
    };

    return {
        isLoading,
        suggestion,
        error,
        fetchSuggestion,
    };
};
