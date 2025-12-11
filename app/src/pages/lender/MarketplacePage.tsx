import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Search,
  Filter,
  CreditCard,
  TrendingUp,
  Clock,
  Users,
  ChevronRight,
} from "lucide-react";
import { useMarketplaceLoans, MarketplaceFilters } from "@/hooks/useLoan";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";

import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { cn, formatCurrency } from "@/lib/utils";
import type { Loan, LoanPurpose } from "@/types";

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 20 },
  show: { opacity: 1, y: 0 },
};

const purposeLabels: Record<LoanPurpose, string> = {
  PERSONAL: "💼 Personal",
  BUSINESS: "🏢 Business",
  EDUCATION: "📚 Education",
  MEDICAL: "🏥 Medical",
  HOME_IMPROVEMENT: "🏠 Home",
  DEBT_CONSOLIDATION: "💳 Debt",
  STARTUP: "🚀 Startup",
  OTHER: "📝 Other",
};

const riskGradeColors: Record<string, string> = {
  A: "text-emerald-400 bg-emerald-400/10 border-emerald-500/30",
  B: "text-cyan-400 bg-cyan-400/10 border-cyan-500/30",
  C: "text-blue-400 bg-blue-400/10 border-blue-500/30",
  D: "text-amber-400 bg-amber-400/10 border-amber-500/30",
  E: "text-orange-400 bg-orange-400/10 border-orange-500/30",
  F: "text-red-400 bg-red-400/10 border-red-500/30",
};

export const MarketplacePage = () => {
  const [filters, setFilters] = useState<MarketplaceFilters>({
    page: 0,
    size: 12,
  });
  const [searchInput, setSearchInput] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  // Debounce search: chỉ gửi lên backend sau 500ms khi user ngừng gõ
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearchQuery(searchInput);
      setFilters((prev) => ({ ...prev, page: 0 }));
    }, 500);

    return () => clearTimeout(timer);
  }, [searchInput]);

  const { data: loans, isLoading } = useMarketplaceLoans({
    ...filters,
    search: searchQuery || undefined,
  });

  const updateFilter = (key: keyof MarketplaceFilters, value: any) => {
    setFilters((prev) => ({ ...prev, [key]: value, page: 0 }));
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      {/* Header */}
      <motion.div
        variants={item}
        className="flex flex-col md:flex-row md:items-center md:justify-between gap-4"
      >
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-white">
            Loan Marketplace
          </h1>
          <p className="text-slate-400 mt-1">
            Discover investment opportunities
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
            <Input
              placeholder="Search loans..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-9 bg-slate-800 border-slate-700 text-white placeholder:text-slate-500"
            />
          </div>
          <FilterSheet filters={filters} onFilterChange={updateFilter} />
        </div>
      </motion.div>

      {/* Quick Filters */}
      <motion.div
        variants={item}
        className="flex items-center gap-2 overflow-x-auto pb-2"
      >
        <Badge
          className={cn(
            "cursor-pointer transition-colors",
            !filters.purpose
              ? "bg-emerald-500 text-white"
              : "bg-slate-800 text-slate-400 hover:text-white"
          )}
          onClick={() => updateFilter("purpose", undefined)}
        >
          All
        </Badge>
        {(Object.entries(purposeLabels) as [LoanPurpose, string][]).map(
          ([purpose, label]) => (
            <Badge
              key={purpose}
              className={cn(
                "cursor-pointer transition-colors whitespace-nowrap",
                filters.purpose === purpose
                  ? "bg-emerald-500 text-white"
                  : "bg-slate-800 text-slate-400 hover:text-white"
              )}
              onClick={() => updateFilter("purpose", purpose)}
            >
              {label}
            </Badge>
          )
        )}
      </motion.div>

      {/* Stats Summary */}
      <motion.div
        variants={item}
        className="grid grid-cols-2 md:grid-cols-4 gap-4"
      >
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
              <CreditCard className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Available Loans</p>
              <p className="text-xl font-bold text-white">
                {loans?.totalElements || 0}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-cyan-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Avg. Rate</p>
              <p className="text-xl font-bold text-white">12.5%</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 flex items-center justify-center">
              <Clock className="w-5 h-5 text-amber-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Avg. Term</p>
              <p className="text-xl font-bold text-white">12 mo</p>
            </div>
          </CardContent>
        </Card>
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="p-4 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-purple-500/20 flex items-center justify-center">
              <Users className="w-5 h-5 text-purple-400" />
            </div>
            <div>
              <p className="text-slate-400 text-xs">Total Funded</p>
              <p className="text-xl font-bold text-white">₫2.5B</p>
            </div>
          </CardContent>
        </Card>
      </motion.div>

      {/* Loans Grid */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <Skeleton key={i} className="h-64 w-full" />
          ))}
        </div>
      ) : loans?.content.length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="py-16 text-center">
            <CreditCard className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400 mb-2">No loans found</p>
            <p className="text-slate-500 text-sm">Try adjusting your filters</p>
          </CardContent>
        </Card>
      ) : (
        <motion.div
          variants={container}
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
        >
          {loans?.content.map((loan) => (
            <LoanCard key={loan.id} loan={loan} />
          ))}
        </motion.div>
      )}

      {/* Pagination */}
      {loans && loans.totalPages > 1 && (
        <motion.div variants={item} className="flex justify-center gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={loans.first}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page || 0) - 1 }))
            }
            className="border-slate-700"
          >
            Previous
          </Button>
          <span className="flex items-center px-4 text-slate-400">
            Page {(filters.page || 0) + 1} of {loans.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={loans.last}
            onClick={() =>
              setFilters((prev) => ({ ...prev, page: (prev.page || 0) + 1 }))
            }
            className="border-slate-700"
          >
            Next
          </Button>
        </motion.div>
      )}
    </motion.div>
  );
};

const LoanCard: React.FC<{ loan: Loan }> = ({ loan }) => {
  const riskClass = riskGradeColors[loan.riskGrade] || riskGradeColors.C;

  return (
    <motion.div variants={item}>
      <Link to={`/dashboard/marketplace/${loan.id}`}>
        <Card className="bg-slate-900/50 border-slate-800 hover:border-emerald-500/50 transition-all group">
          <CardContent className="p-6">
            {/* Header */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1">
                <p className="text-white font-semibold group-hover:text-emerald-400 transition-colors line-clamp-1">
                  {loan.title}
                </p>
                <p className="text-slate-500 text-sm">{loan.loanCode}</p>
              </div>
              <Badge className={cn("border", riskClass)}>
                Grade {loan.riskGrade}
              </Badge>
            </div>

            {/* Amount & Rate */}
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <p className="text-slate-400 text-xs">Amount</p>
                <p className="text-xl font-bold text-white">
                  {formatCurrency(loan.requestedAmount, true)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-slate-400 text-xs">Interest Rate</p>
                <p className="text-xl font-bold text-emerald-400">
                  {loan.interestRate}%
                </p>
              </div>
            </div>

            {/* Progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-sm mb-1">
                <span className="text-slate-400">Funded</span>
                <span className="text-emerald-400 font-medium">
                  {loan.fundingProgress}%
                </span>
              </div>
              <Progress value={loan.fundingProgress} className="h-2" />
              <div className="flex items-center justify-between text-xs text-slate-500 mt-1">
                <span>{formatCurrency(loan.fundedAmount)}</span>
                <span>{formatCurrency(loan.remainingAmount)} left</span>
              </div>
            </div>

            {/* Details */}
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-4">
                <span className="text-slate-400">
                  <Clock className="w-4 h-4 inline mr-1" />
                  {loan.termMonths}m
                </span>
                <span className="text-slate-400">
                  <Users className="w-4 h-4 inline mr-1" />
                  {loan.investorCount}
                </span>
              </div>
              <Badge className="bg-slate-800 text-slate-300">
                {purposeLabels[loan.purpose]?.split(" ")[1] || loan.purpose}
              </Badge>
            </div>

            {/* CTA */}
            <div className="mt-4 pt-4 border-t border-slate-800 flex items-center justify-between">
              <span className="text-slate-500 text-sm">
                Min. investment: {formatCurrency(100000)}
              </span>
              <ChevronRight className="w-5 h-5 text-slate-400 group-hover:text-emerald-400 transition-colors" />
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
};

interface FilterSheetProps {
  filters: MarketplaceFilters;
  onFilterChange: (key: keyof MarketplaceFilters, value: any) => void;
}

const FilterSheet: React.FC<FilterSheetProps> = ({
  filters,
  onFilterChange,
}) => {
  const [localFilters, setLocalFilters] = useState(filters);

  const applyFilters = () => {
    Object.entries(localFilters).forEach(([key, value]) => {
      onFilterChange(key as keyof MarketplaceFilters, value);
    });
  };

  return (
    <Sheet>
      <SheetTrigger asChild>
        <Button
          variant="outline"
          size="icon"
          className="border-slate-700 hover:bg-slate-800"
        >
          <Filter className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="bg-slate-900 border-slate-800">
        <SheetHeader>
          <SheetTitle className="text-white">Filter Loans</SheetTitle>
          <SheetDescription className="text-slate-400">
            Narrow down your search
          </SheetDescription>
        </SheetHeader>

        <div className="space-y-6 mt-6">
          {/* Risk Grade */}
          <div className="space-y-3">
            <Label className="text-slate-300">Risk Grade</Label>
            <div className="flex flex-wrap gap-2">
              {["A", "B", "C", "D", "E"].map((grade) => (
                <Badge
                  key={grade}
                  className={cn(
                    "cursor-pointer transition-colors border",
                    localFilters.riskGrades?.includes(grade)
                      ? riskGradeColors[grade]
                      : "bg-slate-800 text-slate-400 border-slate-700"
                  )}
                  onClick={() => {
                    const current = localFilters.riskGrades || [];
                    const updated = current.includes(grade)
                      ? current.filter((g) => g !== grade)
                      : [...current, grade];
                    setLocalFilters((prev) => ({
                      ...prev,
                      riskGrades: updated,
                    }));
                  }}
                >
                  Grade {grade}
                </Badge>
              ))}
            </div>
          </div>

          {/* Interest Rate Range */}
          <div className="space-y-3">
            <Label className="text-slate-300">
              Interest Rate: {localFilters.minRate || 5}% -{" "}
              {localFilters.maxRate || 25}%
            </Label>
            <Slider
              min={5}
              max={25}
              step={1}
              value={[localFilters.minRate || 5, localFilters.maxRate || 25]}
              onValueChange={([min, max]) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  minRate: min,
                  maxRate: max,
                }))
              }
              className="py-4"
            />
          </div>

          {/* Amount Range */}
          <div className="space-y-3">
            <Label className="text-slate-300">
              Amount: {formatCurrency(localFilters.minAmount || 0)} -{" "}
              {formatCurrency(localFilters.maxAmount || 100000000)}
            </Label>
            <Slider
              min={0}
              max={100000000}
              step={1000000}
              value={[
                localFilters.minAmount || 0,
                localFilters.maxAmount || 100000000,
              ]}
              onValueChange={([min, max]) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  minAmount: min,
                  maxAmount: max,
                }))
              }
              className="py-4"
            />
          </div>

          {/* Term Range */}
          <div className="space-y-3">
            <Label className="text-slate-300">
              Term: {localFilters.minTerm || 1} - {localFilters.maxTerm || 36}{" "}
              months
            </Label>
            <Slider
              min={1}
              max={36}
              step={1}
              value={[localFilters.minTerm || 1, localFilters.maxTerm || 36]}
              onValueChange={([min, max]) =>
                setLocalFilters((prev) => ({
                  ...prev,
                  minTerm: min,
                  maxTerm: max,
                }))
              }
              className="py-4"
            />
          </div>

          <div className="flex gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1 border-slate-700"
              onClick={() => {
                setLocalFilters({ page: 0, size: 12 });
                onFilterChange("purpose", undefined);
              }}
            >
              Reset
            </Button>
            <Button
              className="flex-1 bg-emerald-500 hover:bg-emerald-600"
              onClick={applyFilters}
            >
              Apply Filters
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};

export default MarketplacePage;
