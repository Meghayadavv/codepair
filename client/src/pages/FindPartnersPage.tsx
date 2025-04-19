import React, { useState, useContext } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { useLocation } from 'wouter';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import Navbar from '@/components/Navbar';
import { AppContext } from '@/App';
import { User, Skill } from '@shared/schema';

export default function FindPartnersPage() {
  const { user } = useContext(AppContext);
  const [, navigate] = useLocation();
  const { toast } = useToast();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedSkill, setSelectedSkill] = useState<string | null>(null);

  // Fetch online users
  const { data: onlineUsers, isLoading: isLoadingUsers } = useQuery({
    queryKey: ['/api/users/online'],
  });

  // Fetch active sessions
  const { data: activeSessions, isLoading: isLoadingSessions } = useQuery({
    queryKey: ['/api/sessions/active'],
  });

  // Fetch user skills
  const { data: userSkills } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/skills`] : null,
    enabled: !!user,
  });

  // Create new session mutation
  const createSession = useMutation({
    mutationFn: async (partnerId: number | null) => {
      if (!user) throw new Error('User not logged in');
      
      const response = await apiRequest('POST', '/api/sessions', {
        creatorId: user.id,
        partnerId,
        language: 'javascript',
      });
      return await response.json();
    },
    onSuccess: (data) => {
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

  // Filter users based on search term and selected skill
  const filteredUsers = onlineUsers 
    ? onlineUsers.filter((onlineUser: User) => {
        // Don't show current user
        if (onlineUser.id === user?.id) return false;
        
        // Filter by search term
        if (searchTerm && !onlineUser.displayName.toLowerCase().includes(searchTerm.toLowerCase()) &&
            !onlineUser.username.toLowerCase().includes(searchTerm.toLowerCase())) {
          return false;
        }
        
        // Filter by selected skill (would need to fetch skills for each user in a real app)
        if (selectedSkill) {
          // For demo, we'll just assume some users have the selected skill
          // In a real app, you would check onlineUser's skills
          return onlineUser.id % 2 === 0; 
        }
        
        return true;
      })
    : [];

  // Handle starting a session with a partner
  const handleStartSession = (partnerId: number) => {
    createSession.mutate(partnerId);
  };

  // Handle starting a solo session
  const handleStartSoloSession = () => {
    createSession.mutate(null);
  };

  return (
    <div className="bg-slate-900 text-slate-50 min-h-screen flex flex-col">
      <Navbar />
      
      <div className="container mx-auto px-4 py-6 max-w-6xl">
        <div className="flex flex-col gap-8">
          <section>
            <h1 className="text-3xl font-bold mb-2">Find Partners</h1>
            <p className="text-slate-400 mb-6">
              Connect with other programmers for pair programming sessions based on skills and availability.
            </p>
            
            <div className="flex flex-col md:flex-row gap-4 mb-6">
              <div className="flex-1">
                <Input
                  type="search"
                  placeholder="Search partners by name..."
                  className="bg-slate-800 border-slate-700"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              
              <div className="flex flex-wrap gap-2">
                <Button 
                  variant={selectedSkill === null ? "default" : "outline"}
                  onClick={() => setSelectedSkill(null)}
                >
                  All
                </Button>
                
                {userSkills && userSkills.map((skill: Skill) => (
                  <Button
                    key={skill.id}
                    variant={selectedSkill === skill.name ? "default" : "outline"}
                    onClick={() => setSelectedSkill(skill.name)}
                  >
                    {skill.name}
                  </Button>
                ))}
              </div>
            </div>
          </section>
          
          <Tabs defaultValue="available">
            <TabsList className="bg-slate-800">
              <TabsTrigger value="available">Available Partners</TabsTrigger>
              <TabsTrigger value="active">Active Sessions</TabsTrigger>
            </TabsList>
            
            {/* Available Partners Tab */}
            <TabsContent value="available" className="mt-4">
              {isLoadingUsers ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {[1, 2, 3, 4, 5, 6].map((i) => (
                    <Card key={i} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <div className="flex items-center">
                          <Skeleton className="h-12 w-12 rounded-full" />
                          <div className="ml-4">
                            <Skeleton className="h-5 w-32 mb-2" />
                            <Skeleton className="h-4 w-24" />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex gap-2 mb-4">
                          <Skeleton className="h-6 w-16 rounded-full" />
                          <Skeleton className="h-6 w-20 rounded-full" />
                        </div>
                        <Skeleton className="h-4 w-full" />
                      </CardContent>
                      <CardFooter>
                        <Skeleton className="h-10 w-full rounded-md" />
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : filteredUsers.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredUsers.map((partner: User) => (
                    <Card key={partner.id} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <div className="flex items-center">
                          <div className="h-12 w-12 bg-slate-700 rounded-full overflow-hidden flex items-center justify-center">
                            {partner.avatar ? (
                              <img 
                                src={partner.avatar} 
                                alt={partner.displayName} 
                                className="h-full w-full object-cover" 
                              />
                            ) : (
                              <span className="text-lg font-semibold">
                                {partner.displayName.charAt(0)}
                              </span>
                            )}
                          </div>
                          <div className="ml-4">
                            <CardTitle className="text-lg flex items-center">
                              <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                              {partner.displayName}
                            </CardTitle>
                            <CardDescription>@{partner.username}</CardDescription>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="flex flex-wrap gap-2 mb-4">
                          {/* Mock skills - in a real app, you'd fetch these */}
                          <Badge className="bg-primary-900 text-primary-100">
                            {partner.id % 3 === 0 ? 'JavaScript' : partner.id % 3 === 1 ? 'Python' : 'Java'}
                          </Badge>
                          <Badge className="bg-primary-900 text-primary-100">
                            {partner.id % 2 === 0 ? 'React' : 'Node.js'}
                          </Badge>
                        </div>
                        <p className="text-sm text-slate-300">
                          Available for pair programming
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => handleStartSession(partner.id)}
                          disabled={createSession.isPending}
                        >
                          Start Session
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 text-center p-8">
                  <CardContent>
                    <p className="text-slate-400 mb-4">No partners found matching your criteria.</p>
                    <Button onClick={handleStartSoloSession}>
                      Start Solo Session Instead
                    </Button>
                  </CardContent>
                </Card>
              )}
              
              {filteredUsers.length > 0 && (
                <div className="mt-6 text-center">
                  <p className="text-slate-400 mb-4">Can't find the right partner?</p>
                  <Button onClick={handleStartSoloSession}>
                    Start Solo Session
                  </Button>
                </div>
              )}
            </TabsContent>
            
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
              ) : activeSessions && activeSessions.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {activeSessions
                    .filter((session: any) => session.creatorId !== user?.id)
                    .map((session: any) => (
                    <Card key={session.id} className="bg-slate-800 border-slate-700">
                      <CardHeader>
                        <CardTitle className="flex items-center">
                          <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                          Session #{session.id}
                        </CardTitle>
                        <CardDescription>
                          {new Date(session.createdAt).toLocaleTimeString()}
                        </CardDescription>
                      </CardHeader>
                      <CardContent>
                        <p className="text-sm text-slate-300 mb-2">
                          Language: <span className="font-medium">{session.language}</span>
                        </p>
                        <p className="text-sm text-slate-300">
                          Creator ID: <span className="font-medium">{session.creatorId}</span>
                        </p>
                      </CardContent>
                      <CardFooter>
                        <Button 
                          className="w-full"
                          onClick={() => navigate(`/session/${session.id}`)}
                        >
                          Join Session
                        </Button>
                      </CardFooter>
                    </Card>
                  ))}
                </div>
              ) : (
                <Card className="bg-slate-800 border-slate-700 text-center p-8">
                  <CardContent>
                    <p className="text-slate-400 mb-4">No active sessions are available right now.</p>
                    <Button onClick={handleStartSoloSession}>
                      Start New Session
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
