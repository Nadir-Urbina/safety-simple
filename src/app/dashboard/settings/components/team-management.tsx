"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";

// Sample team data
const teamMembers = [
  {
    id: "1",
    name: "John Smith",
    email: "john.smith@example.com",
    role: "admin",
    department: "Safety",
    status: "active",
    photoURL: "",
  },
  {
    id: "2",
    name: "Sarah Johnson",
    email: "sarah.j@example.com",
    role: "manager",
    department: "Operations",
    status: "active",
    photoURL: "",
  },
  {
    id: "3",
    name: "Miguel Rodriguez",
    email: "miguel.r@example.com",
    role: "user",
    department: "Construction",
    status: "active",
    photoURL: "",
  },
  {
    id: "4",
    name: "Emily Chen",
    email: "emily.c@example.com",
    role: "user",
    department: "Safety",
    status: "invited",
    photoURL: "",
  },
];

export function TeamManagement() {
  const { toast } = useToast();
  const [isLoading, setIsLoading] = useState(false);
  const [members, setMembers] = useState(teamMembers);
  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("user");
  const [inviteDepartment, setInviteDepartment] = useState("");

  const handleInvite = async () => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // Add the user to the members list with invited status
      const newMember = {
        id: (members.length + 1).toString(),
        name: inviteEmail.split("@")[0],
        email: inviteEmail,
        role: inviteRole,
        department: inviteDepartment,
        status: "invited",
        photoURL: "",
      };
      
      setMembers([...members, newMember]);
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("user");
      setInviteDepartment("");
      
      toast({
        title: "Invitation sent",
        description: `An invitation has been sent to ${inviteEmail}.`,
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "The invitation couldn't be sent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRoleChange = async (userId: string, newRole: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMembers(members.map(member => 
        member.id === userId ? {...member, role: newRole} : member
      ));
      
      toast({
        title: "Role updated",
        description: "The team member's role has been updated successfully.",
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "The role couldn't be updated. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleRemoveMember = async (userId: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      setMembers(members.filter(member => member.id !== userId));
      
      toast({
        title: "Team member removed",
        description: "The team member has been removed successfully.",
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "The team member couldn't be removed. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const resendInvitation = async (email: string) => {
    setIsLoading(true);
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Invitation resent",
        description: `A new invitation has been sent to ${email}.`,
      });
    } catch (error) {
      toast({
        title: "Something went wrong",
        description: "The invitation couldn't be resent. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold tracking-tight">Team Members</h2>
          <p className="text-muted-foreground">
            Manage your team members and their access roles
          </p>
        </div>
        <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
          <DialogTrigger asChild>
            <Button>Invite Team Member</Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Invite Team Member</DialogTitle>
              <DialogDescription>
                Invite a new member to join your organization. They will receive an email with instructions.
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <label htmlFor="email" className="text-sm font-medium">Email address</label>
                <Input 
                  id="email" 
                  placeholder="Email address" 
                  type="email" 
                  value={inviteEmail}
                  onChange={(e) => setInviteEmail(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <label htmlFor="role" className="text-sm font-medium">Role</label>
                <Select 
                  value={inviteRole} 
                  onValueChange={setInviteRole}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select a role" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="admin">Admin</SelectItem>
                    <SelectItem value="manager">Manager</SelectItem>
                    <SelectItem value="user">User</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <label htmlFor="department" className="text-sm font-medium">Department</label>
                <Input 
                  id="department" 
                  placeholder="Department" 
                  value={inviteDepartment}
                  onChange={(e) => setInviteDepartment(e.target.value)}
                />
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                Cancel
              </Button>
              <Button onClick={handleInvite} disabled={!inviteEmail}>
                {isLoading ? "Sending..." : "Send Invitation"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Role Permissions</CardTitle>
          <CardDescription>
            Learn about the different roles and their permissions
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-6">
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                  <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  <path d="M17.5 17.5 16 16"></path>
                  <path d="m14 14 2.5 2.5"></path>
                  <path d="M7 15h3"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">Admin</h3>
                <p className="text-sm text-muted-foreground">
                  Full access to all settings, can invite and manage users, approve submissions, 
                  and configure all aspects of the system.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                  <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  <path d="M7 15h7"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">Manager</h3>
                <p className="text-sm text-muted-foreground">
                  Can create and edit forms, view and approve submissions, and access reports. 
                  Cannot modify system settings or manage admin users.
                </p>
              </div>
            </div>
            
            <div className="flex items-start space-x-4">
              <div className="w-16 h-16 flex items-center justify-center rounded-lg bg-primary/10 text-primary">
                <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-8 h-8">
                  <path d="M19 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V7a2 2 0 0 0-2-2Z"></path>
                  <path d="M12 12a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z"></path>
                  <path d="M7 15h3"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-medium">User</h3>
                <p className="text-sm text-muted-foreground">
                  Can view and submit forms, view their own submissions, and access basic reports. 
                  No management capabilities.
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Team Members</CardTitle>
          <CardDescription>
            {members.length} members in your organization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Department</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar>
                        <AvatarImage src={member.photoURL} />
                        <AvatarFallback>{member.name.charAt(0)}</AvatarFallback>
                      </Avatar>
                      <div className="font-medium">{member.name}</div>
                    </div>
                  </TableCell>
                  <TableCell>{member.email}</TableCell>
                  <TableCell>{member.department}</TableCell>
                  <TableCell>
                    <Select 
                      value={member.role} 
                      onValueChange={(value) => handleRoleChange(member.id, value)}
                      disabled={isLoading}
                    >
                      <SelectTrigger className="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="user">User</SelectItem>
                      </SelectContent>
                    </Select>
                  </TableCell>
                  <TableCell>
                    {member.status === "active" ? (
                      <Badge>Active</Badge>
                    ) : (
                      <Badge variant="outline">Invited</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      {member.status === "invited" && (
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => resendInvitation(member.email)}
                          disabled={isLoading}
                        >
                          Resend
                        </Button>
                      )}
                      <Button
                        variant="destructive"
                        size="sm"
                        onClick={() => handleRemoveMember(member.id)}
                        disabled={isLoading}
                      >
                        Remove
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
} 