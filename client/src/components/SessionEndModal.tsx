import React, { useState } from 'react';
import { useLocation } from 'wouter';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

type SessionEndModalProps = {
  isOpen: boolean;
  onClose: () => void;
  sessionId: number;
  userId: number;
  partnerName?: string;
};

export default function SessionEndModal({ isOpen, onClose, sessionId, userId, partnerName = 'your partner' }: SessionEndModalProps) {
  const [, navigate] = useLocation();
  const [rating, setRating] = useState<number>(0);
  const [feedback, setFeedback] = useState<string>('');

  // Submit feedback mutation
  const submitFeedback = useMutation({
    mutationFn: async () => {
      const response = await apiRequest('POST', `/api/sessions/${sessionId}/feedback`, {
        sessionId,
        userId,
        rating,
        comment: feedback,
      });
      
      // End the session
      await apiRequest('POST', `/api/sessions/${sessionId}/end`, {});
      
      return response;
    },
    onSuccess: () => {
      // Redirect to dashboard after successful submission
      navigate('/');
      onClose();
    },
  });

  // Handle submitting the feedback
  const handleSubmit = () => {
    submitFeedback.mutate();
  };

  // Handle skipping feedback
  const handleSkip = () => {
    // Just end the session without feedback
    apiRequest('POST', `/api/sessions/${sessionId}/end`, {})
      .then(() => {
        navigate('/');
        onClose();
      });
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="bg-slate-800 text-white border-slate-700 sm:max-w-md">
        <DialogHeader>
          <div className="flex items-start">
            <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-primary-100 sm:mx-0 sm:h-10 sm:w-10">
              <i className="bi bi-check-circle text-primary-600 text-xl"></i>
            </div>
            <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
              <DialogTitle className="text-lg font-medium leading-6">Session Complete</DialogTitle>
              <DialogDescription className="text-slate-300">
                Your coding session with {partnerName} has ended. Would you like to provide feedback?
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>
        
        <div className="mt-2">
          <div className="text-sm font-medium text-slate-300 mb-1">Rate your experience:</div>
          <div className="flex space-x-2">
            {[1, 2, 3, 4, 5].map((star) => (
              <button 
                key={star}
                type="button"
                onClick={() => setRating(star)}
                className={`text-2xl ${rating >= star ? 'text-yellow-400' : 'text-slate-400'}`}
              >
                <i className={`bi bi-star${rating >= star ? '-fill' : ''}`}></i>
              </button>
            ))}
          </div>
        </div>
        
        <div className="mt-4">
          <Textarea
            rows={3}
            className="w-full bg-slate-700 border-0 rounded-md py-2 px-3 text-sm focus:ring-2 focus:ring-primary-500 focus:outline-none"
            placeholder="Share your feedback (optional)"
            value={feedback}
            onChange={(e) => setFeedback(e.target.value)}
          />
        </div>
        
        <DialogFooter className="sm:justify-between">
          <Button
            variant="outline"
            className="border-slate-600 text-slate-300 hover:bg-slate-700 mt-2 sm:mt-0"
            onClick={handleSkip}
            disabled={submitFeedback.isPending}
          >
            Skip
          </Button>
          
          <Button
            type="button"
            className="bg-primary-600 hover:bg-primary-700 focus:ring-primary-500 mt-2 sm:mt-0"
            onClick={handleSubmit}
            disabled={rating === 0 || submitFeedback.isPending}
          >
            {submitFeedback.isPending ? 'Submitting...' : 'Submit & Return to Dashboard'}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
