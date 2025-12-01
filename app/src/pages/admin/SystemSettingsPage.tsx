import { useState } from 'react';
import { motion } from 'framer-motion';
import {
  Settings,
  Save,
  Plus,
  Trash2,
  Edit,
  X,
  Check,
  DollarSign,
  Shield,
  CreditCard,
  Clock,
  AlertCircle,
} from 'lucide-react';
import {
  useSystemSettings,
  useCreateSystemSetting,
  useUpdateSystemSetting,
  useDeleteSystemSetting,
} from '@/hooks/useAdmin';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import type { SystemSetting, SystemSettingRequest } from '@/types';

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

const categoryIcons: Record<string, React.ElementType> = {
  FEE: DollarSign,
  LIMIT: Shield,
  PAYMENT: CreditCard,
  GENERAL: Settings,
  TIME: Clock,
};

export default function SystemSettingsPage() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [editingSetting, setEditingSetting] = useState<SystemSetting | null>(null);
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [settingToDelete, setSettingToDelete] = useState<SystemSetting | null>(null);

  const { data: settings, isLoading } = useSystemSettings(
    selectedCategory !== 'ALL' ? selectedCategory : undefined
  );
  const createSetting = useCreateSystemSetting();
  const updateSetting = useUpdateSystemSetting();
  const deleteSetting = useDeleteSystemSetting();

  const categories = ['ALL', 'FEE', 'LIMIT', 'PAYMENT', 'GENERAL', 'TIME'];
  const filteredSettings = settings || [];

  const groupedSettings = filteredSettings.reduce((acc, setting) => {
    const category = setting.category || 'OTHER';
    if (!acc[category]) {
      acc[category] = [];
    }
    acc[category].push(setting);
    return acc;
  }, {} as Record<string, SystemSetting[]>);

  const handleEdit = (setting: SystemSetting) => {
    setEditingSetting(setting);
  };

  const handleSave = (setting: SystemSetting, newValue: string, description?: string) => {
    updateSetting.mutate(
      {
        id: setting.id,
        data: {
          settingValue: newValue,
          description: description || setting.description,
        },
      },
      {
        onSuccess: () => {
          setEditingSetting(null);
        },
      }
    );
  };

  const handleDelete = (setting: SystemSetting) => {
    setSettingToDelete(setting);
    setDeleteDialogOpen(true);
  };

  const confirmDelete = () => {
    if (settingToDelete) {
      deleteSetting.mutate(settingToDelete.id, {
        onSuccess: () => {
          setDeleteDialogOpen(false);
          setSettingToDelete(null);
        },
      });
    }
  };

  const handleCreate = (data: SystemSettingRequest) => {
    createSetting.mutate(data, {
      onSuccess: () => {
        setCreateDialogOpen(false);
      },
    });
  };

  return (
    <motion.div
      variants={container}
      initial="hidden"
      animate="show"
      className="space-y-6"
    >
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-white">System Settings</h1>
          <p className="text-slate-400 mt-1">Configure system parameters and limits</p>
        </div>
        <Button
          onClick={() => setCreateDialogOpen(true)}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Plus className="mr-2 h-4 w-4" />
          New Setting
        </Button>
      </div>

      {/* Category Filter */}
      <Card className="bg-slate-900/50 border-slate-800">
        <CardContent className="pt-6">
          <Tabs value={selectedCategory} onValueChange={setSelectedCategory}>
            <TabsList className="grid w-full grid-cols-6">
              {categories.map((cat) => (
                <TabsTrigger key={cat} value={cat}>
                  {cat}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>
        </CardContent>
      </Card>

      {/* Settings by Category */}
      {isLoading ? (
        <div className="space-y-4">
          {[...Array(3)].map((_, i) => (
            <Skeleton key={i} className="h-32 w-full bg-slate-800" />
          ))}
        </div>
      ) : Object.keys(groupedSettings).length === 0 ? (
        <Card className="bg-slate-900/50 border-slate-800">
          <CardContent className="pt-6 text-center py-12">
            <Settings className="h-12 w-12 text-slate-600 mx-auto mb-4" />
            <p className="text-slate-400">No settings found</p>
          </CardContent>
        </Card>
      ) : (
        Object.entries(groupedSettings).map(([category, categorySettings]) => {
          const Icon = categoryIcons[category] || Settings;
          return (
            <Card key={category} className="bg-slate-900/50 border-slate-800">
              <CardHeader>
                <div className="flex items-center gap-3">
                  <div className="h-10 w-10 rounded-lg bg-violet-500/20 flex items-center justify-center">
                    <Icon className="h-5 w-5 text-violet-400" />
                  </div>
                  <div>
                    <CardTitle className="text-white">{category}</CardTitle>
                    <CardDescription>{categorySettings.length} settings</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {categorySettings.map((setting) => {
                    const isEditing = editingSetting?.id === setting.id;
                    return (
                      <div
                        key={setting.id}
                        className="p-4 bg-slate-800/50 rounded-lg border border-slate-700"
                      >
                        <div className="flex items-start justify-between mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <Label className="text-white font-semibold">
                                {setting.settingKey}
                              </Label>
                              <Badge
                                variant="outline"
                                className="bg-slate-700 border-slate-600 text-slate-300"
                              >
                                {setting.settingType}
                              </Badge>
                              {!setting.isEditable && (
                                <Badge
                                  variant="outline"
                                  className="bg-yellow-500/20 border-yellow-500/30 text-yellow-400"
                                >
                                  Read-only
                                </Badge>
                              )}
                            </div>
                            {setting.description && (
                              <p className="text-sm text-slate-400 mb-2">
                                {setting.description}
                              </p>
                            )}
                          </div>
                          {setting.isEditable && (
                            <div className="flex gap-2">
                              {isEditing ? (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => setEditingSetting(null)}
                                    className="h-8 w-8 p-0 text-slate-400"
                                  >
                                    <X className="h-4 w-4" />
                                  </Button>
                                </>
                              ) : (
                                <>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleEdit(setting)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDelete(setting)}
                                    className="h-8 w-8 p-0 text-slate-400 hover:text-red-400"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </>
                              )}
                            </div>
                          )}
                        </div>
                        {isEditing ? (
                          <EditSettingForm
                            setting={setting}
                            onSave={handleSave}
                            onCancel={() => setEditingSetting(null)}
                            isLoading={updateSetting.isPending}
                          />
                        ) : (
                          <div className="p-3 bg-slate-900 rounded border border-slate-700">
                            <p className="text-white font-mono text-sm break-all">
                              {setting.settingValue}
                            </p>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>
          );
        })
      )}

      {/* Create Dialog */}
      <CreateSettingDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onCreate={handleCreate}
        isLoading={createSetting.isPending}
      />

      {/* Delete Dialog */}
      <Dialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <DialogContent className="bg-slate-900 border-slate-800">
          <DialogHeader>
            <DialogTitle className="text-white">Delete Setting</DialogTitle>
            <DialogDescription className="text-slate-400">
              Are you sure you want to delete this setting? This action cannot be undone.
            </DialogDescription>
          </DialogHeader>
          {settingToDelete && (
            <div className="p-4 bg-slate-800/50 rounded-lg">
              <p className="text-sm text-slate-400">Setting Key</p>
              <p className="text-white font-semibold">{settingToDelete.settingKey}</p>
            </div>
          )}
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setDeleteDialogOpen(false);
                setSettingToDelete(null);
              }}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              onClick={confirmDelete}
              disabled={deleteSetting.isPending}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              {deleteSetting.isPending ? 'Deleting...' : 'Delete'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </motion.div>
  );
}

interface EditSettingFormProps {
  setting: SystemSetting;
  onSave: (setting: SystemSetting, value: string, description?: string) => void;
  onCancel: () => void;
  isLoading: boolean;
}

function EditSettingForm({ setting, onSave, onCancel, isLoading }: EditSettingFormProps) {
  const [value, setValue] = useState(setting.settingValue);
  const [description, setDescription] = useState(setting.description || '');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(setting, value, description);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-3">
      <div>
        <Label htmlFor="value" className="text-slate-300">
          Value
        </Label>
        <Input
          id="value"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          className="mt-1 bg-slate-800 border-slate-700 text-white"
          required
        />
      </div>
      <div>
        <Label htmlFor="description" className="text-slate-300">
          Description (optional)
        </Label>
        <Textarea
          id="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          className="mt-1 bg-slate-800 border-slate-700 text-white"
          rows={2}
        />
      </div>
      <div className="flex gap-2">
        <Button
          type="submit"
          size="sm"
          disabled={isLoading}
          className="bg-violet-600 hover:bg-violet-700"
        >
          <Check className="mr-2 h-4 w-4" />
          {isLoading ? 'Saving...' : 'Save'}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={onCancel}
          className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}

interface CreateSettingDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreate: (data: SystemSettingRequest) => void;
  isLoading: boolean;
}

function CreateSettingDialog({
  open,
  onOpenChange,
  onCreate,
  isLoading,
}: CreateSettingDialogProps) {
  const [formData, setFormData] = useState<SystemSettingRequest>({
    settingKey: '',
    settingValue: '',
    settingType: 'STRING',
    description: '',
    category: 'GENERAL',
    isEditable: true,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onCreate(formData);
    setFormData({
      settingKey: '',
      settingValue: '',
      settingType: 'STRING',
      description: '',
      category: 'GENERAL',
      isEditable: true,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="bg-slate-900 border-slate-800 max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-white">Create System Setting</DialogTitle>
          <DialogDescription className="text-slate-400">
            Add a new system configuration setting
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="settingKey" className="text-slate-300">
                Setting Key *
              </Label>
              <Input
                id="settingKey"
                value={formData.settingKey}
                onChange={(e) =>
                  setFormData((prev) => ({ ...prev, settingKey: e.target.value }))
                }
                className="mt-1 bg-slate-800 border-slate-700 text-white"
                placeholder="e.g., WITHDRAWAL_FEE"
                required
              />
            </div>
            <div>
              <Label htmlFor="settingType" className="text-slate-300">
                Type *
              </Label>
              <Select
                value={formData.settingType}
                onValueChange={(value) =>
                  setFormData((prev) => ({ ...prev, settingType: value }))
                }
              >
                <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="STRING">STRING</SelectItem>
                  <SelectItem value="NUMBER">NUMBER</SelectItem>
                  <SelectItem value="BOOLEAN">BOOLEAN</SelectItem>
                  <SelectItem value="JSON">JSON</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          <div>
            <Label htmlFor="settingValue" className="text-slate-300">
              Value *
            </Label>
            <Input
              id="settingValue"
              value={formData.settingValue}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, settingValue: e.target.value }))
              }
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              required
            />
          </div>
          <div>
            <Label htmlFor="category" className="text-slate-300">
              Category
            </Label>
            <Select
              value={formData.category}
              onValueChange={(value) =>
                setFormData((prev) => ({ ...prev, category: value }))
              }
            >
              <SelectTrigger className="mt-1 bg-slate-800 border-slate-700">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="GENERAL">GENERAL</SelectItem>
                <SelectItem value="FEE">FEE</SelectItem>
                <SelectItem value="LIMIT">LIMIT</SelectItem>
                <SelectItem value="PAYMENT">PAYMENT</SelectItem>
                <SelectItem value="TIME">TIME</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label htmlFor="description" className="text-slate-300">
              Description
            </Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData((prev) => ({ ...prev, description: e.target.value }))
              }
              className="mt-1 bg-slate-800 border-slate-700 text-white"
              rows={3}
            />
          </div>
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="bg-slate-800 border-slate-700 text-slate-300 hover:bg-slate-700"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
              className="bg-violet-600 hover:bg-violet-700"
            >
              {isLoading ? 'Creating...' : 'Create Setting'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}


