import { useNavigate } from 'react-router-dom';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useMutation } from '@tanstack/react-query';
import api from '@/lib/api';
import { toast } from 'sonner';
import { ArrowLeft } from 'lucide-react';
import { Link } from 'react-router-dom';

const ticketSchema = z.object({
  subject: z.string().min(5, 'Subject must be at least 5 characters'),
  category: z.string().min(1, 'Category is required'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  relatedLoanId: z.string().optional(),
});

type TicketFormData = z.infer<typeof ticketSchema>;

const categories = [
  'ACCOUNT',
  'LOAN',
  'PAYMENT',
  'TECHNICAL',
  'OTHER',
];

export default function CreateTicketPage() {
  const navigate = useNavigate();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<TicketFormData>({
    resolver: zodResolver(ticketSchema),
  });

  const createTicket = useMutation({
    mutationFn: async (data: TicketFormData) => {
      const response = await api.post('/tickets', {
        ...data,
        relatedLoanId: data.relatedLoanId ? Number(data.relatedLoanId) : null,
      });
      return response.data.data;
    },
    onSuccess: (ticket) => {
      toast.success('Ticket created successfully!');
      navigate(`/dashboard/support/${ticket.id}`);
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to create ticket');
    },
  });

  const onSubmit = (data: TicketFormData) => {
    createTicket.mutate(data);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link to="/dashboard/support">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-bold">Create Support Ticket</h1>
          <p className="text-muted-foreground">Submit a new support request</p>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Ticket Information</CardTitle>
          <CardDescription>Provide details about your issue</CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-2">
              <Label>Subject *</Label>
              <Input
                placeholder="Brief description of your issue"
                {...register('subject')}
              />
              {errors.subject && (
                <p className="text-sm text-destructive">{errors.subject.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Category *</Label>
              <Select onValueChange={(value) => setValue('category', value)}>
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((cat) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              {errors.category && (
                <p className="text-sm text-destructive">{errors.category.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Description *</Label>
              <Textarea
                placeholder="Provide detailed information about your issue"
                rows={6}
                {...register('description')}
              />
              {errors.description && (
                <p className="text-sm text-destructive">{errors.description.message}</p>
              )}
            </div>

            <div className="space-y-2">
              <Label>Related Loan ID (Optional)</Label>
              <Input
                type="number"
                placeholder="Enter loan ID if this ticket is related to a loan"
                {...register('relatedLoanId')}
              />
            </div>

            <div className="flex gap-4">
              <Button type="submit" disabled={createTicket.isPending}>
                {createTicket.isPending ? 'Creating...' : 'Create Ticket'}
              </Button>
              <Button type="button" variant="outline" asChild>
                <Link to="/dashboard/support">Cancel</Link>
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

