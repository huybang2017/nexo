import { useState } from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatDate } from '@/lib/utils';
import { Plus, Search, MessageSquare } from 'lucide-react';
import { PageResponse } from '@/types';

interface Ticket {
  id: number;
  ticketCode: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  createdAt: string;
  updatedAt: string;
  messageCount?: number;
}

const fetchMyTickets = async (status?: string) => {
  const params = status && status !== 'all' ? `?status=${status}` : '';
  const response = await api.get(`/tickets/my${params}`);
  return response.data.data;
};

export default function SupportPage() {
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [searchTerm, setSearchTerm] = useState('');

  const { data, isLoading } = useQuery<PageResponse<Ticket>>({
    queryKey: ['myTickets', statusFilter],
    queryFn: () => fetchMyTickets(statusFilter),
  });

  const tickets = data?.content || [];

  const filteredTickets = tickets.filter((ticket: Ticket) =>
    ticket.subject.toLowerCase().includes(searchTerm.toLowerCase()) ||
    ticket.ticketCode.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statusConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    OPEN: { label: 'Open', variant: 'default' },
    IN_PROGRESS: { label: 'In Progress', variant: 'secondary' },
    RESOLVED: { label: 'Resolved', variant: 'outline' },
    CLOSED: { label: 'Closed', variant: 'outline' },
  };

  const priorityConfig: Record<string, { label: string; variant: 'default' | 'secondary' | 'destructive' | 'outline' }> = {
    LOW: { label: 'Low', variant: 'outline' },
    MEDIUM: { label: 'Medium', variant: 'secondary' },
    HIGH: { label: 'High', variant: 'destructive' },
    URGENT: { label: 'Urgent', variant: 'destructive' },
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Support Tickets</h1>
          <p className="text-muted-foreground">Manage your support requests</p>
        </div>
        <Button asChild>
          <Link to="/dashboard/support/new">
            <Plus className="mr-2 h-4 w-4" />
            New Ticket
          </Link>
        </Button>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search tickets..."
            className="pl-10"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-full sm:w-48">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Status</SelectItem>
            <SelectItem value="OPEN">Open</SelectItem>
            <SelectItem value="IN_PROGRESS">In Progress</SelectItem>
            <SelectItem value="RESOLVED">Resolved</SelectItem>
            <SelectItem value="CLOSED">Closed</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tickets List */}
      {isLoading ? (
        <div className="grid gap-4">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="animate-pulse">
              <CardContent className="h-32" />
            </Card>
          ))}
        </div>
      ) : filteredTickets.length === 0 ? (
        <Card>
          <CardContent className="py-12 text-center">
            <MessageSquare className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <h3 className="font-semibold mb-2">No tickets found</h3>
            <p className="text-muted-foreground mb-4">
              {searchTerm || statusFilter !== 'all'
                ? 'Try adjusting your filters'
                : 'Create your first support ticket to get started'}
            </p>
            {!searchTerm && statusFilter === 'all' && (
              <Button asChild>
                <Link to="/dashboard/support/new">Create Ticket</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4">
          {filteredTickets.map((ticket: Ticket) => {
            const status = statusConfig[ticket.status] || statusConfig.OPEN;
            const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

            return (
              <Card key={ticket.id} className="card-hover">
                <CardContent className="pt-6">
                  <div className="flex flex-col lg:flex-row lg:items-center gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-2">
                        <Badge variant={status.variant}>{status.label}</Badge>
                        <Badge variant={priority.variant}>{priority.label}</Badge>
                        <span className="text-sm text-muted-foreground">{ticket.ticketCode}</span>
                      </div>
                      <h3 className="font-semibold truncate mb-1">{ticket.subject}</h3>
                      <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                        <span>Category: {ticket.category}</span>
                        <span>Created: {formatDate(ticket.createdAt)}</span>
                        {ticket.messageCount !== undefined && (
                          <span>{ticket.messageCount} messages</span>
                        )}
                      </div>
                    </div>
                    <Button variant="outline" asChild>
                      <Link to={`/dashboard/support/${ticket.id}`}>View Details</Link>
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

