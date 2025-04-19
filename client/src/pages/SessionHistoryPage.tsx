import React, { useContext, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Skeleton } from '@/components/ui/skeleton';
import { CodeBlock } from '@/components/ui/code-block';
import Navbar from '@/components/Navbar';
import { AppContext } from '@/App';
import { Session, Feedback, File } from '@shared/schema';

export default function SessionHistoryPage() {
  const { user } = useContext(AppContext);
  const [, navigate] = useLocation();
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch user's sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/sessions`] : null,
    enabled: !!user,
  });

  // Fetch details for the selected session
  const { data: sessionFiles, isLoading: isLoadingFiles } = useQuery({
    queryKey: selectedSession ? [`/api/sessions/${selectedSession.id}/files`] : null,
    enabled: !!selectedSession,
  });

  // Fetch feedback for the selected session
  const { data: sessionFeedback, isLoading: isLoadingFeedback } = useQuery({
    queryKey: selectedSession ? [`/api/sessions/${selectedSession.id}/feedback`] : null,
    enabled: !!selectedSession,
  });

  // Filter sessions to active and completed
  const activeSessions = sessions ? sessions.filter((session: Session) => session.isActive) : [];
  const completedSessions = sessions ? sessions.filter((session: Session) => !session.isActive) : [];

  // Handle view session details
  const handleViewDetails = (session: Session) => {
    setSelectedSession(session);
    setIsDetailsOpen(true);
  };

  // Handle close details dialog
  const handleCloseDetails = () => {
    setIsDetailsOpen(false);
  };

  // Handle continue session
  const handleContinueSession = (sessionId: number) => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="bg-slate-900 text-slate-50 min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-8">
          <section>
            <h1 className="text-3xl font-bold mb-2">Session History</h1>
            <p className="text-slate-400 mb-6">
              View your past and ongoing pair programming sessions.
            </p>
          </section>
          
          <Tabs defaultValue="active">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="active">Active Sessions</TabsTrigger>
              <TabsTrigger value="completed">Completed Sessions</TabsTrigger>
            </TabsList>
            
            {/* Active Sessions Tab */}
            <TabsContent value="active" className="mt-4">
              {isLoadingSessions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-10 w-full rounded-md" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : activeSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSessions.map((session: Session) => (
                    <Card key={session.id} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                          Session #{session.id}
                        </CardTitle>
                        <CardDescription>
                          Started: {new Date(session.createdAt).toLocaleString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300 mb-2">
                          Language: <span className="font-medium">{session.language}</span>
                        </p>
                        {session.partnerId && (
                          <p className="text-sm text-slate-300">
                            Partner ID: <span className="font-medium">{session.partnerId}</span>
                          </p>
                        )}
                      </CardContent>
                      <CardFooter className="flex gap-2">
                        <Button 
                          className="flex-1"
                          onClick={() => handleContinueSession(session.id)}
                        >
                          Continue
                        </Button>
                        <Button 
                          variant="outline" 
                          className="flex-1"
                          onClick={() => handleViewDetails(session)}
                        >
                          Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 text-center p-8">
                  <CardContent>
                    <p className="text-slate-400 mb-4">You don't have any active sessions.</p>
                    <Button onClick={() => navigate('/find-partners')}>
                      Find Partners
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
            
            {/* Completed Sessions Tab */}
            <TabsContent value="completed" className="mt-4">
              {isLoadingSessions ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3].map((i) => (
                    <Card key={i} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <Skeleton className="h-6 w-32 mb-2" />
                        <Skeleton className="h-4 w-24" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-4 w-full mb-2" />
                        <Skeleton className="h-4 w-3/4" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-10 w-full rounded-md" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : completedSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {completedSessions.map((session: Session) => (
                    <Card key={session.id} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle>Session #{session.id}</CardTitle>
                        <CardDescription>
                          {new Date(session.createdAt).toLocaleDateString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <div className="mb-2">
                          <Badge className="bg-slate-700 text-slate-300">
                            {session.language}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300">
                          Duration: {session.endedAt ? 
                            Math.round((new Date(session.endedAt).getTime() - new Date(session.createdAt).getTime()) / 60000) : 
                            'N/A'} min
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          variant="outline" 
                          className="w-full"
                          onClick={() => handleViewDetails(session)}
                        >
                          View Details
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 text-center p-8">
                  <CardContent>
                    <p className="text-slate-400 mb-4">You don't have any completed sessions yet.</p>
                    <Button onClick={() => navigate('/find-partners')}>
                      Start Your First Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
      
      {/* Session Details Dialog */}
      <Dialog open={isDetailsOpen} onOpenChange={handleCloseDetails}>
        <DialogContent className="bg-slate-800 text-white border-slate-700 max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-xl">Session #{selectedSession?.id} Details</DialogTitle>
            <DialogDescription>
              {selectedSession?.createdAt && (
                <span>
                  {new Date(selectedSession.createdAt).toLocaleString()} 
                  {selectedSession.endedAt && ` to ${new Date(selectedSession.endedAt).toLocaleString()}`}
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-6">
            {/* Session Info */}
            <div>
              <h3 className="text-md font-semibold mb-2">Session Information</h3>
              <div className="bg-slate-900 p-4 rounded-md">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className="text-slate-400 text-sm">Status</p>
                    <p className="text-sm font-medium flex items-center">
                      {selectedSession?.isActive ? (
                        <>
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                          Active
                        </>
                      ) : (
                        <>
                          <span className="h-2 w-2 bg-slate-500 rounded-full mr-2"></span>
                          Completed
                        </>
                      )}
                    </p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Language</p>
                    <p className="text-sm font-medium">{selectedSession?.language}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Creator</p>
                    <p className="text-sm font-medium">User #{selectedSession?.creatorId}</p>
                  </div>
                  <div>
                    <p className="text-slate-400 text-sm">Partner</p>
                    <p className="text-sm font-medium">
                      {selectedSession?.partnerId ? `User #${selectedSession.partnerId}` : 'Solo Session'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Files */}
            <div>
              <h3 className="text-md font-semibold mb-2">Session Files</h3>
              {isLoadingFiles ? (
                <Skeleton className="h-40 w-full" />
              ) : sessionFiles && sessionFiles.length > 0 ? (
                <div className="space-y-4">
                  {sessionFiles.map((file: File) => (
                    <div key={file.id} className="bg-slate-900 p-4 rounded-md">
                      <div className="flex justify-between items-center mb-2">
                        <h4 className="text-sm font-semibold">{file.name}</h4>
                        <Badge className="bg-slate-700 text-slate-300">
                          {file.language}
                        </Badge>
                      </div>
                      <CodeBlock 
                        code={file.content || '// No content'} 
                        language={file.language} 
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No files found for this session.</p>
              )}
            </div>
            
            {/* Feedback */}
            <div>
              <h3 className="text-md font-semibold mb-2">Session Feedback</h3>
              {isLoadingFeedback ? (
                <Skeleton className="h-24 w-full" />
              ) : sessionFeedback && sessionFeedback.length > 0 ? (
                <div className="bg-slate-900 p-4 rounded-md">
                  {sessionFeedback.map((feedback: Feedback) => (
                    <div key={feedback.id} className="mb-4 last:mb-0">
                      <div className="flex justify-between items-center mb-2">
                        <p className="text-sm font-medium">User #{feedback.userId}</p>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((star) => (
                            <span key={star} className={`text-sm ${feedback.rating >= star ? 'text-yellow-400' : 'text-slate-600'}`}>
                              ★
                            </span>
                          ))}
                        </div>
                      </div>
                      {feedback.comment && (
                        <p className="text-sm text-slate-300">{feedback.comment}</p>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-slate-400 text-sm">No feedback available for this session.</p>
              )}
            </div>
          </div>
          
          <DialogFooter className="mt-4">
            {selectedSession?.isActive && (
              <Button 
                className="mr-auto"
                onClick={() => {
                  handleCloseDetails();
                  handleContinueSession(selectedSession.id);
                }}
              >
                Continue Session
              </Button>
            )}
            <Button variant="outline" onClick={handleCloseDetails}>
              Close
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
