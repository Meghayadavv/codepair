import React, { useContext, useState } from 'react';
import { useQuery, useMutation } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';
import { queryClient } from '@/lib/queryClient';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { AppContext } from '@/App';
import { User, Skill } from '@shared/schema';

type SidebarProps = {
  sessionId?: number;
  partnerId?: number;
};

export default function Sidebar({ sessionId, partnerId }: SidebarProps) {
  const { user } = useContext(AppContext);
  const { toast } = useToast();
  const [addSkillOpen, setAddSkillOpen] = useState(false);
  const [newSkill, setNewSkill] = useState('');

  // Fetch online users
  const { data: onlineUsers } = useQuery({
    queryKey: ['/api/users/online'],
  });

  // Fetch current session
  const { data: session } = useQuery({
    queryKey: sessionId ? [`/api/sessions/${sessionId}`] : null,
    enabled: !!sessionId,
  });

  // Fetch user skills
  const { data: skills } = useQuery({
    queryKey: user ? [`/api/users/${user.id}/skills`] : null,
    enabled: !!user,
  });

  // Get partner info from onlineUsers if partnerId is provided
  const partner = partnerId && onlineUsers 
    ? onlineUsers.find((u: User) => u.id === partnerId) 
    : null;

  // Add skill mutation
  const addSkill = useMutation({
    mutationFn: async (name: string) => {
      if (!user) throw new Error('User not logged in');
      
      const response = await apiRequest('POST', `/api/users/${user.id}/skills`, {
        userId: user.id,
        name,
      });
      return await response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      setAddSkillOpen(false);
      setNewSkill('');
      toast({
        title: 'Skill Added',
        description: 'Your skill has been added successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to add skill: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  // Remove skill mutation
  const removeSkill = useMutation({
    mutationFn: async (skillId: number) => {
      const response = await apiRequest('DELETE', `/api/skills/${skillId}`);
      return response.status === 204;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: [`/api/users/${user?.id}/skills`] });
      toast({
        title: 'Skill Removed',
        description: 'Your skill has been removed successfully.',
      });
    },
    onError: (error) => {
      toast({
        title: 'Error',
        description: `Failed to remove skill: ${error.message}`,
        variant: 'destructive',
      });
    },
  });

  const handleAddSkill = () => {
    if (newSkill.trim()) {
      addSkill.mutate(newSkill.trim());
    }
  };

  return (
    <div className="hidden md:flex md:flex-shrink-0">
      <div className="flex flex-col w-64 border-r border-slate-700">
        <div className="h-0 flex-1 flex flex-col pt-5 pb-4 overflow-y-auto bg-slate-800">
          <div className="px-4 space-y-5">
            {/* Current Session */}
            {sessionId && session && (
              <div>
                <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Current Session</h2>
                <div className="mt-2 bg-slate-700 p-3 rounded-md">
                  <div className="flex items-center">
                    <span className="h-2 w-2 bg-green-500 rounded-full mr-2"></span>
                    <span className="text-sm font-medium">
                      Active • Session #{sessionId}
                    </span>
                  </div>
                  
                  {partner && (
                    <div className="mt-3 flex items-center">
                      <div className="h-8 w-8 bg-slate-600 rounded-full overflow-hidden">
                        {partner.avatar ? (
                          <img 
                            src={partner.avatar} 
                            alt={partner.displayName} 
                            className="h-full w-full object-cover" 
                          />
                        ) : (
                          <div className="h-full w-full flex items-center justify-center text-white font-medium">
                            {partner.displayName.charAt(0)}
                          </div>
                        )}
                      </div>
                      <div className="ml-3">
                        <p className="text-sm font-medium">{partner.displayName}</p>
                        <p className="text-xs text-slate-400">{partner.username}</p>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Available Partners */}
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Available Partners</h2>
              
              {onlineUsers && onlineUsers.length > 0 ? (
                <ul className="mt-2 space-y-2">
                  {onlineUsers
                    .filter((onlineUser: User) => onlineUser.id !== user?.id && onlineUser.id !== partnerId)
                    .slice(0, 5)
                    .map((onlineUser: User) => (
                    <li key={onlineUser.id} className="flex items-center px-2 py-2 text-sm font-medium rounded-md hover:bg-slate-700 cursor-pointer">
                      <div className="h-8 w-8 bg-slate-600 rounded-full overflow-hidden">
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
                        <p className="text-sm font-medium">{onlineUser.displayName}</p>
                        <p className="text-xs text-slate-400">{onlineUser.username}</p>
                      </div>
                    </li>
                  ))}
                </ul>
              ) : (
                <div className="mt-2 text-sm text-slate-400 py-2 px-2">
                  No partners available right now.
                </div>
              )}
            </div>

            {/* Skills */}
            <div>
              <h2 className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Your Skills</h2>
              <div className="mt-2 flex flex-wrap gap-2">
                {skills ? (
                  <>
                    {skills.map((skill: Skill) => (
                      <Badge 
                        key={skill.id} 
                        className="bg-primary-900 text-primary-100 hover:bg-primary-800"
                        onClick={() => removeSkill.mutate(skill.id)}
                      >
                        {skill.name}
                        <span className="ml-1 text-primary-300 hover:text-white">×</span>
                      </Badge>
                    ))}
                    <Badge 
                      className="bg-slate-700 text-slate-300 hover:bg-primary-900 hover:text-primary-100 cursor-pointer"
                      onClick={() => setAddSkillOpen(true)}
                    >
                      + Add
                    </Badge>
                  </>
                ) : (
                  <div className="text-sm text-slate-400">Loading skills...</div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Add Skill Dialog */}
      <Dialog open={addSkillOpen} onOpenChange={setAddSkillOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Skill</DialogTitle>
            <DialogDescription>
              Add a new programming skill or technology to your profile.
            </DialogDescription>
          </DialogHeader>
          
          <div className="py-4">
            <Input 
              placeholder="e.g. JavaScript, Python, React" 
              value={newSkill}
              onChange={(e) => setNewSkill(e.target.value)}
            />
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddSkillOpen(false)}>Cancel</Button>
            <Button 
              onClick={handleAddSkill} 
              disabled={!newSkill.trim() || addSkill.isPending}
            >
              {addSkill.isPending ? 'Adding...' : 'Add Skill'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
