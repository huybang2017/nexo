import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useQuery } from '@tanstack/react-query';
import api from '@/lib/api';
import { formatCurrency, formatDate } from '@/lib/utils';
import { Calendar, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { toast } from 'sonner';

interface RepaymentSchedule {
  id: number;
  loanId?: number;
  loanCode?: string;
  loanTitle?: string;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  remainingPrincipal: number;
  isPaid: boolean;
  paidAmount?: number;
  lateFee?: number;
  paidAt?: string;
}

const fetchUpcomingRepayments = async () => {
  const response = await api.get('/repayments/upcoming');
  return response.data.data;
};

const fetchOverdueRepayments = async () => {
  const response = await api.get('/repayments/overdue');
  return response.data.data;
};

const fetchPaidRepayments = async () => {
  const response = await api.get('/repayments/paid');
  return response.data.data;
};

export default function RepaymentsPage() {
  const { data: upcomingData, isLoading: isLoadingUpcoming } = useQuery<RepaymentSchedule[]>({
    queryKey: ['upcomingRepayments'],
    queryFn: fetchUpcomingRepayments,
  });

  const { data: overdueData, isLoading: isLoadingOverdue } = useQuery<RepaymentSchedule[]>({
    queryKey: ['overdueRepayments'],
    queryFn: fetchOverdueRepayments,
  });

  const { data: paidData, isLoading: isLoadingPaid } = useQuery<RepaymentSchedule[]>({
    queryKey: ['paidRepayments'],
    queryFn: fetchPaidRepayments,
  });

  const handlePay = async (scheduleId: number) => {
    try {
      await api.post(`/repayments/schedule/${scheduleId}/pay`);
      toast.success('Repayment processed successfully!');
      // Refetch all data
      window.location.reload();
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Failed to process repayment');
    }
  };

  const upcoming = upcomingData || [];
  const overdue = overdueData || [];
  const paid = paidData || [];
  const isLoading = isLoadingUpcoming || isLoadingOverdue || isLoadingPaid;

  const totalUpcoming = upcoming.reduce((sum, s) => sum + s.totalAmount + (s.lateFee || 0), 0);
  const totalOverdue = overdue.reduce((sum, s) => sum + s.totalAmount + (s.lateFee || 0), 0);
  const totalPaid = paid.reduce((sum, s) => sum + (s.paidAmount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Repayments</h1>
        <p className="text-muted-foreground">Manage your loan repayments</p>
      </div>

      {/* Stats */}
      <div className="grid sm:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <Clock className="h-4 w-4" />
              <span className="text-sm">Upcoming</span>
            </div>
            <div className="text-2xl font-bold">{formatCurrency(totalUpcoming)}</div>
            <div className="text-xs text-muted-foreground mt-1">{upcoming.length} installments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <AlertCircle className="h-4 w-4 text-destructive" />
              <span className="text-sm">Overdue</span>
            </div>
            <div className="text-2xl font-bold text-destructive">{formatCurrency(totalOverdue)}</div>
            <div className="text-xs text-muted-foreground mt-1">{overdue.length} installments</div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-2 text-muted-foreground mb-1">
              <CheckCircle className="h-4 w-4 text-green-500" />
              <span className="text-sm">Paid</span>
            </div>
            <div className="text-2xl font-bold text-green-500">{formatCurrency(totalPaid)}</div>
            <div className="text-xs text-muted-foreground mt-1">{paid.length} installments</div>
          </CardContent>
        </Card>
      </div>

      {/* Repayments List */}
      <Tabs defaultValue="upcoming" className="w-full">
        <TabsList>
          <TabsTrigger value="upcoming">
            Upcoming ({upcoming.length})
          </TabsTrigger>
          <TabsTrigger value="overdue">
            Overdue ({overdue.length})
          </TabsTrigger>
          <TabsTrigger value="paid">
            Paid ({paid.length})
          </TabsTrigger>
        </TabsList>

        <TabsContent value="upcoming">
          <Card>
            <CardHeader>
              <CardTitle>Upcoming Repayments</CardTitle>
              <CardDescription>Repayments due in the next 30 days</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : upcoming.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No upcoming repayments
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {upcoming.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            {schedule.loanId ? (
                              <>
                                <Link
                                  to={`/dashboard/loans/${schedule.loanId}`}
                                  className="font-medium hover:underline"
                                >
                                  {schedule.loanCode || 'N/A'}
                                </Link>
                                <div className="text-xs text-muted-foreground">{schedule.loanTitle || ''}</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>#{schedule.installmentNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-muted-foreground" />
                            {formatDate(schedule.dueDate)}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(schedule.principalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(schedule.interestAmount)}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{formatCurrency(schedule.totalAmount)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {schedule.lateFee && schedule.lateFee > 0 ? (
                            <span className="text-destructive font-medium">{formatCurrency(schedule.lateFee)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" onClick={() => handlePay(schedule.id)}>
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="overdue">
          <Card>
            <CardHeader>
              <CardTitle>Overdue Repayments</CardTitle>
              <CardDescription>Repayments that are past due</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : overdue.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No overdue repayments
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Due Date</TableHead>
                      <TableHead className="text-right">Principal</TableHead>
                      <TableHead className="text-right">Interest</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-center">Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {overdue.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            {schedule.loanId ? (
                              <>
                                <Link
                                  to={`/dashboard/loans/${schedule.loanId}`}
                                  className="font-medium hover:underline"
                                >
                                  {schedule.loanCode || 'N/A'}
                                </Link>
                                <div className="text-xs text-muted-foreground">{schedule.loanTitle || ''}</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>#{schedule.installmentNumber}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{formatDate(schedule.dueDate)}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-right">{formatCurrency(schedule.principalAmount)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(schedule.interestAmount)}</TableCell>
                        <TableCell className="text-right font-medium text-destructive">
                          {formatCurrency(schedule.totalAmount)}
                        </TableCell>
                        <TableCell className="text-right text-destructive">
                          {schedule.lateFee && schedule.lateFee > 0 ? formatCurrency(schedule.lateFee) : '-'}
                        </TableCell>
                        <TableCell className="text-center">
                          <Button size="sm" variant="destructive" onClick={() => handlePay(schedule.id)}>
                            Pay Now
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="paid">
          <Card>
            <CardHeader>
              <CardTitle>Paid Repayments</CardTitle>
              <CardDescription>History of completed repayments</CardDescription>
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <div className="text-center py-8 text-muted-foreground">Loading...</div>
              ) : paid.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No repayment history
                </div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Loan</TableHead>
                      <TableHead>Installment</TableHead>
                      <TableHead>Paid Date</TableHead>
                      <TableHead className="text-right">Amount</TableHead>
                      <TableHead className="text-right">Late Fee</TableHead>
                      <TableHead className="text-center">Status</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {paid.map((schedule) => (
                      <TableRow key={schedule.id}>
                        <TableCell>
                          <div>
                            {schedule.loanId ? (
                              <>
                                <Link
                                  to={`/dashboard/loans/${schedule.loanId}`}
                                  className="font-medium hover:underline"
                                >
                                  {schedule.loanCode || 'N/A'}
                                </Link>
                                <div className="text-xs text-muted-foreground">{schedule.loanTitle || ''}</div>
                              </>
                            ) : (
                              <span className="text-muted-foreground">N/A</span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>#{schedule.installmentNumber}</TableCell>
                        <TableCell>{schedule.paidAt ? formatDate(schedule.paidAt) : '-'}</TableCell>
                        <TableCell className="text-right">
                          <div className="font-medium">{formatCurrency(schedule.paidAmount || 0)}</div>
                        </TableCell>
                        <TableCell className="text-right">
                          {schedule.lateFee && schedule.lateFee > 0 ? (
                            <span className="text-muted-foreground">{formatCurrency(schedule.lateFee)}</span>
                          ) : (
                            <span className="text-muted-foreground">-</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline" className="gap-1">
                            <CheckCircle className="h-3 w-3" />
                            Paid
                          </Badge>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}

