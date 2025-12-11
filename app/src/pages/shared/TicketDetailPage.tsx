import { useParams, Link, useLocation } from "react-router-dom";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import api from "@/lib/api";
import { formatDate } from "@/lib/utils";
import { toast } from "sonner";
import { ArrowLeft, Send } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";

interface Ticket {
  id: number;
  ticketCode: string;
  subject: string;
  category: string;
  status: string;
  priority: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  messages?: Array<{
    id: number;
    message: string;
    isStaffReply: boolean;
    createdAt: string;
    createdBy: {
      id: number;
      fullName: string;
    };
  }>;
}

const fetchTicket = async (id: string) => {
  const response = await api.get(`/tickets/${id}`);
  return response.data.data;
};

export default function TicketDetailPage() {
  const { id } = useParams<{ id: string }>();
  const location = useLocation();
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [message, setMessage] = useState("");

  // Detect if we're in admin context
  const isAdminContext = location.pathname.startsWith("/admin");
  const backUrl = isAdminContext ? "/admin/tickets" : "/dashboard/support";

  const { data: ticket, isLoading } = useQuery<Ticket>({
    queryKey: ["ticket", id],
    queryFn: () => fetchTicket(id!),
    enabled: !!id,
  });

  const addMessage = useMutation({
    mutationFn: async (msg: string) => {
      const response = await api.post(`/tickets/${id}/messages`, {
        message: msg,
      });
      return response.data.data;
    },
    onSuccess: () => {
      setMessage("");
      queryClient.invalidateQueries({ queryKey: ["ticket", id] });
      toast.success("Message sent");
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || "Failed to send message");
    },
  });

  const handleSendMessage = () => {
    if (!message.trim()) return;
    addMessage.mutate(message);
  };

  if (isLoading) {
    return <div className="text-center py-12">Loading...</div>;
  }

  if (!ticket) {
    return <div className="text-center py-12">Ticket not found</div>;
  }

  const statusConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    OPEN: { label: "Open", variant: "default" },
    IN_PROGRESS: { label: "In Progress", variant: "secondary" },
    WAITING_SUPPORT: { label: "Waiting Support", variant: "secondary" },
    WAITING_CUSTOMER: { label: "Waiting Customer", variant: "default" },
    RESOLVED: { label: "Resolved", variant: "outline" },
    CLOSED: { label: "Closed", variant: "outline" },
  };

  const priorityConfig: Record<
    string,
    {
      label: string;
      variant: "default" | "secondary" | "destructive" | "outline";
    }
  > = {
    LOW: { label: "Low", variant: "outline" },
    MEDIUM: { label: "Medium", variant: "secondary" },
    HIGH: { label: "High", variant: "destructive" },
    URGENT: { label: "Urgent", variant: "destructive" },
  };

  const status = statusConfig[ticket.status] || statusConfig.OPEN;
  const priority = priorityConfig[ticket.priority] || priorityConfig.MEDIUM;

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to={backUrl}>
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-bold">{ticket.subject}</h1>
            <Badge variant={status.variant}>{status.label}</Badge>
            <Badge variant={priority.variant}>{priority.label}</Badge>
          </div>
          <p className="text-muted-foreground">{ticket.ticketCode}</p>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="whitespace-pre-wrap">{ticket.description}</p>
            </CardContent>
          </Card>

          {ticket.messages && ticket.messages.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Messages</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {ticket.messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`p-4 rounded-lg ${
                      msg.isStaffReply ? "bg-muted" : "bg-background border"
                    }`}
                  >
                    <div className="flex justify-between items-start mb-2">
                      <div>
                        <p className="font-medium">{msg.createdBy.fullName}</p>
                        {msg.isStaffReply && (
                          <Badge variant="secondary" className="mt-1">
                            Staff
                          </Badge>
                        )}
                      </div>
                      <span className="text-sm text-muted-foreground">
                        {formatDate(msg.createdAt)}
                      </span>
                    </div>
                    <p className="whitespace-pre-wrap">{msg.message}</p>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {ticket.status !== "CLOSED" && (
            <Card>
              <CardHeader>
                <CardTitle>Add Message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  placeholder="Type your message..."
                  rows={4}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                />
                <Button
                  onClick={handleSendMessage}
                  disabled={addMessage.isPending || !message.trim()}
                >
                  <Send className="mr-2 h-4 w-4" />
                  {addMessage.isPending ? "Sending..." : "Send Message"}
                </Button>
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Ticket Details</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <p className="text-sm text-muted-foreground">Category</p>
                <p className="font-medium">{ticket.category}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Created</p>
                <p className="font-medium">{formatDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Last Updated</p>
                <p className="font-medium">{formatDate(ticket.updatedAt)}</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
