import React, { useState, useEffect, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardHeader, CardTitle, CardDescription, CardContent, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { useToast } from '@/hooks/use-toast';
import { Session, User } from '@shared/schema';
import { AppContext } from '@/App';

export default function Dashboard() {
  const { user } = useContext(AppContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();

  // Fetch user's sessions
  const { data: sessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: [user ? `/api/users/${user.id}/sessions` : null],
    enabled: !!user,
  });

  // Fetch online users
  const { data: onlineUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users/online'],
  });

  // Create new session mutation
  const createSession = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error('User not logged in');
      
      const response = await apiRequest('POST', '/api/sessions', {
        creatorId: user.id,
        language: 'javascript',
      });
      return await response.json();
    },
    onSuccess: (data: Session) => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/sessions`] });
      navigate(`/session/${data.id}`);
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to create session: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Handle start new session
  const handleNewSession = () => {
    createSession.mutate();
  };

  // Handle join session
  const handleJoinSession = (sessionId: number) => {
    navigate(`/session/${sessionId}`);
  };

  return (
    <div className="p-6 max-w-7xl mx-auto">
      <div className="flex flex-col gap-8">
        {/* Welcome Section */}
        <section>
          <h1 className="text-3xl font-bold mb-2">Welcome back, {user?.displayName || 'User'}</h1>
          <p className="text-slate-400 mb-4">Ready to collaborate? Start a new session or join an existing one.</p>
          
          <div className="flex gap-4">
            <Button 
              className="bg-primary-600 hover:bg-primary-700" 
              onClick={handleNewSession}
              disabled={createSession.isPending}
            >
              {createSession.isPending ? 'Creating...' : 'Start New Session'}
            </Button>
            <Button 
              variant="outline" 
              onClick={() => navigate('/find-partners')}
            >
              Find Partners
            </Button>
          </div>
        </section>

        {/* Active Sessions */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Your Sessions</h2>
          
          {isLoadingSessions ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <div className="h-6 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                    <div className="h-4 bg-slate-700 rounded w-1/2 animate-pulse"></div>
                  </CardHeader>
                  <CardContent>
                    <div className="h-4 bg-slate-700 rounded w-full mb-2 animate-pulse"></div>
                    <div className="h-4 bg-slate-700 rounded w-3/4 animate-pulse"></div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : sessions && sessions.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {sessions.map((session: Session) => (
                <Card key={session.id} className="bg-slate-800 border-slate-700">
                  <CardHeader>
                    <CardTitle className="flex items-center">
                      {session.isActive && <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>}
                      Session #{session.id}
                    </CardTitle>
                    <CardDescription>
                      {session.isActive ? 'Active' : 'Ended'} • {new Date(session.createdAt).toLocaleDateString()}
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
                  <CardFooter>
                    {session.isActive ? (
                      <Button 
                        variant="default" 
                        className="w-full"
                        onClick={() => handleJoinSession(session.id)}
                      >
                        Continue Session
                      </Button>
                    ) : (
                      <Button 
                        variant="outline" 
                        className="w-full"
                        onClick={() => navigate(`/history`)}
                      >
                        View Details
                      </Button>
                    )}
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="flex flex-col items-center justify-center p-6">
                <p className="text-slate-400 mb-4">You don't have any sessions yet.</p>
                <Button 
                  variant="default" 
                  onClick={handleNewSession}
                  disabled={createSession.isPending}
                >
                  Start Your First Session
                </Button>
              </CardContent>
            </Card>
          )}
        </section>

        {/* Available Partners */}
        <section>
          <h2 className="text-xl font-semibold mb-4">Available Partners</h2>
          
          {isLoadingUsers ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {[1, 2, 3].map(i => (
                <Card key={i} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 rounded-full bg-slate-700 animate-pulse"></div>
                      <div className="ml-4">
                        <div className="h-5 bg-slate-700 rounded w-24 mb-2 animate-pulse"></div>
                        <div className="h-4 bg-slate-700 rounded w-20 animate-pulse"></div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : onlineUsers && onlineUsers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {onlineUsers
                .filter((onlineUser: User) => onlineUser.id !== user?.id)
                .map((onlineUser: User) => (
                <Card key={onlineUser.id} className="bg-slate-800 border-slate-700">
                  <CardContent className="p-4">
                    <div className="flex items-center">
                      <div className="h-12 w-12 bg-slate-700 rounded-full overflow-hidden">
                        {onlineUser.avatar ? (
                          <img 
                            src={onlineUser.avatar} 
                            alt={onlineUser.displayName} 
                            className="h-full w-full object-cover"
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white font-medium">
                            {onlineUser.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                          {onlineUser.displayName}
                        </p>
                        <p className="text-xs text-slate-400">{onlineUser.username}</p>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="pt-0">
                    <Button 
                      variant="outline" 
                      className="w-full text-xs"
                      onClick={() => {
                        // Add implementation to invite user
                        toast({
                          title: 'Invitation Sent',
                          description: `Invitation sent to ${onlineUser.displayName}`,
                        });
                      }}
                    >
                      Invite to Collaborate
                    </Button>
                  </CardFooter>
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-slate-800 border-slate-700">
              <CardContent className="flex items-center justify-center p-6">
                <p className="text-slate-400">No partners available right now.</p>
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </div>
  );
}
