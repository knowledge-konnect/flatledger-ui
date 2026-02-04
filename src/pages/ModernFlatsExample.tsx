/**
 * Example: Modern Flats Management Page
 * Showcases all 14 premium enhancements in action
 */

import { useState, useEffect } from 'react';
import { Plus, Edit, Trash, Download } from 'lucide-react';
import DashboardLayout from '../components/layout/DashboardLayout';

// Import all our premium components
import {
  DataTable,
  Column,
  SearchAutocomplete,
  SpeedDialFAB,
  InfiniteScroll,
  PullToRefresh,
  BottomSheet,
  FloatingLabelInput,
  PasswordInput,
  FileUpload,
  useToast,
  useCommandPalette,
  ConfirmModal,
  EmptyState,
  LoadingSkeleton,
} from '../components';

// Import hooks
import {
  useDebounce,
  useLocalStorage,
  useIsMobile,
  useOptimisticCreate,
  useOptimisticDelete,
} from '../hooks';

// Import validation
import { flatSchema } from '../lib/validation';

interface Flat {
  id: string;
  flatNumber: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  maintenanceAmount: number;
  status: 'active' | 'inactive';
}

export default function ModernFlatsPage() {
  const [flats, setFlats] = useState<Flat[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [hasMore, setHasMore] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [flatToDelete, setFlatToDelete] = useState<string | null>(null);
  
  const { showToast } = useToast();
  const { registerShortcut } = useCommandPalette();
  const isMobile = useIsMobile();
  const [viewMode, setViewMode] = useLocalStorage<'table' | 'grid'>('flatsView', 'table');
  const debouncedSearch = useDebounce(searchQuery, 300);

  // Optimistic updates
  const { data: optimisticFlats, create, isLoading: isCreating } = useOptimisticCreate<Flat>(
    flats,
    async (newFlat) => {
      const response = await fetch('/api/flats', {
        method: 'POST',
        body: JSON.stringify(newFlat),
      });
      return response.json();
    }
  );

  const { deleteItem } = useOptimisticDelete<Flat>(
    flats,
    async (id) => {
      await fetch(`/api/flats/${id}`, { method: 'DELETE' });
    }
  );

  // Register keyboard shortcuts
  useEffect(() => {
    registerShortcut({
      key: 'n',
      ctrl: true,
      description: 'Add new flat',
      action: () => setShowAddModal(true),
    });

    registerShortcut({
      key: 'f',
      ctrl: true,
      description: 'Focus search',
      action: () => document.getElementById('search')?.focus(),
    });

    registerShortcut({
      key: 'd',
      ctrl: true,
      shift: true,
      description: 'Delete selected flats',
      action: handleBulkDelete,
    });
  }, [registerShortcut]);

  // Fetch flats
  const fetchFlats = async () => {
    setIsLoading(true);
    try {
      const response = await fetch('/api/flats');
      const data = await response.json();
      setFlats(data);
    } catch (error) {
      showToast({
        type: 'error',
        message: 'Failed to load flats',
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchFlats();
  }, []);

  // Handle pull to refresh
  const handleRefresh = async () => {
    await fetchFlats();
    showToast({
      type: 'success',
      message: 'Flats refreshed',
      duration: 2000,
    });
  };

  // Handle infinite scroll
  const loadMore = async () => {
    const newFlats = await fetch(`/api/flats?offset=${flats.length}`).then(r => r.json());
    setFlats([...flats, ...newFlats]);
    setHasMore(newFlats.length > 0);
  };

  // Handle search
  const searchResults = flats.filter(flat =>
    flat.flatNumber.toLowerCase().includes(debouncedSearch.toLowerCase()) ||
    flat.ownerName.toLowerCase().includes(debouncedSearch.toLowerCase())
  ).map(flat => ({
    id: flat.id,
    title: flat.flatNumber,
    subtitle: flat.ownerName,
  }));

  // Handle add flat
  const handleAddFlat = async (formData: Omit<Flat, 'id'>) => {
    const result = await create(formData);
    if (result.success) {
      showToast({
        type: 'success',
        message: 'Flat added successfully!',
        action: {
          label: 'View',
          onClick: () => console.log('View flat'),
        },
      });
      setShowAddModal(false);
    } else {
      showToast({
        type: 'error',
        message: 'Failed to add flat',
      });
    }
  };

  // Handle delete
  const handleDelete = async (id: string) => {
    const result = await deleteItem(id);
    if (result.success) {
      showToast({
        type: 'success',
        message: 'Flat deleted',
      });
    }
    setShowDeleteConfirm(false);
    setFlatToDelete(null);
  };

  // Handle bulk delete
  const handleBulkDelete = () => {
    if (selectedIds.size === 0) {
      showToast({
        type: 'warning',
        message: 'No flats selected',
      });
      return;
    }
    // Bulk delete logic here
  };

  // Table columns
  const columns: Column<Flat>[] = [
    {
      key: 'flatNumber',
      label: 'Flat Number',
      sortable: true,
    },
    {
      key: 'ownerName',
      label: 'Owner Name',
      sortable: true,
    },
    {
      key: 'ownerEmail',
      label: 'Email',
    },
    {
      key: 'ownerPhone',
      label: 'Phone',
    },
    {
      key: 'maintenanceAmount',
      label: 'Maintenance',
      sortable: true,
      render: (flat) => `₹${flat.maintenanceAmount}`,
    },
    {
      key: 'status',
      label: 'Status',
      render: (flat) => (
        <span
          className={
            flat.status === 'active'
              ? 'px-2 py-1 text-xs font-semibold text-green-700 bg-green-100 dark:bg-green-900/30 dark:text-green-300 rounded-full'
              : 'px-2 py-1 text-xs font-semibold text-red-700 bg-red-100 dark:bg-red-900/30 dark:text-red-300 rounded-full'
          }
        >
          {flat.status}
        </span>
      ),
    },
  ];

  // Speed dial actions for mobile
  const fabActions = [
    {
      icon: Plus,
      label: 'Add Flat',
      onClick: () => setShowAddModal(true),
    },
    {
      icon: Download,
      label: 'Import CSV',
      onClick: () => document.getElementById('csv-upload')?.click(),
      color: 'bg-blue-600 hover:bg-blue-700',
    },
  ];

  if (isLoading) {
    return (
      <DashboardLayout title=\"Flats\">
        <LoadingSkeleton variant=\"card\" lines={5} />
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout title=\"Flats\">
      <div className=\"space-y-6\">
        {/* Header with Search */}
        <div className=\"flex flex-col md:flex-row gap-4 items-start md:items-center justify-between\">
          <div className=\"flex-1 w-full md:w-auto\">
            <SearchAutocomplete
              id=\"search\"
              placeholder=\"Search flats by number or owner name...\"
              results={searchResults}
              isLoading={false}
              onSearch={setSearchQuery}
              onSelect={(result) => {
                const flat = flats.find(f => f.id === result.id);
                console.log('Selected flat:', flat);
              }}
              showRecentSearches
            />
          </div>

          {!isMobile && (
            <button
              onClick={() => setShowAddModal(true)}
              className=\"btn-primary flex items-center gap-2\"
            >
              <Plus className=\"w-5 h-5\" />
              Add Flat
            </button>
          )}
        </div>

        {/* Pull to refresh wrapper for mobile */}
        <PullToRefresh onRefresh={handleRefresh}>
          {flats.length === 0 ? (
            <EmptyState
              icon={Plus}
              title=\"No flats added yet\"
              description=\"Start by adding your first flat to manage maintenance and payments\"
              action={{
                label: 'Add Flat',
                onClick: () => setShowAddModal(true),
              }}
            />
          ) : (
            <InfiniteScroll
              hasMore={hasMore}
              isLoading={isLoading}
              onLoadMore={loadMore}
            >
              <DataTable
                data={flats}
                columns={columns}
                selectable
                selectedIds={selectedIds}
                onSelectionChange={setSelectedIds}
                stickyHeader
                onRowClick={(flat) => console.log('Clicked:', flat)}
                actions={(flat) => (
                  <div className=\"flex items-center gap-2\">
                    <button
                      onClick={() => console.log('Edit:', flat)}
                      className=\"p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors\"
                      title=\"Edit\"
                    >
                      <Edit className=\"w-4 h-4 text-slate-600 dark:text-slate-400\" />
                    </button>
                    <button
                      onClick={() => {
                        setFlatToDelete(flat.id);
                        setShowDeleteConfirm(true);
                      }}
                      className=\"p-1.5 rounded hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors\"
                      title=\"Delete\"
                    >
                      <Trash className=\"w-4 h-4 text-red-600 dark:text-red-400\" />
                    </button>
                  </div>
                )}
              />
            </InfiniteScroll>
          )}
        </PullToRefresh>

        {/* Mobile FAB */}
        <SpeedDialFAB actions={fabActions} />

        {/* Add Flat Bottom Sheet (Mobile) / Modal (Desktop) */}
        {isMobile ? (
          <BottomSheet
            isOpen={showAddModal}
            onClose={() => setShowAddModal(false)}
            title=\"Add New Flat\"
          >
            <AddFlatForm onSubmit={handleAddFlat} onCancel={() => setShowAddModal(false)} />
          </BottomSheet>
        ) : (
          showAddModal && (
            <div className=\"fixed inset-0 z-50 flex items-center justify-center p-4\">
              <div className=\"absolute inset-0 bg-black/60 backdrop-blur-sm\" onClick={() => setShowAddModal(false)} />
              <div className=\"relative bg-white dark:bg-slate-900 rounded-2xl shadow-2xl max-w-2xl w-full p-6\">
                <h2 className=\"text-2xl font-bold mb-6\">Add New Flat</h2>
                <AddFlatForm onSubmit={handleAddFlat} onCancel={() => setShowAddModal(false)} />
              </div>
            </div>
          )
        )}

        {/* Delete Confirmation */}
        <ConfirmModal
          isOpen={showDeleteConfirm}
          onClose={() => setShowDeleteConfirm(false)}
          onConfirm={() => flatToDelete && handleDelete(flatToDelete)}
          title=\"Delete Flat\"
          message=\"Are you sure you want to delete this flat? This action cannot be undone.\"
          confirmText=\"Delete\"
          variant=\"danger\"
        />
      </div>
    </DashboardLayout>
  );
}

// Add Flat Form Component
function AddFlatForm({
  onSubmit,
  onCancel,
}: {
  onSubmit: (data: Omit<Flat, 'id'>) => void;
  onCancel: () => void;
}) {
  const [formData, setFormData] = useState({
    flatNumber: '',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    maintenanceAmount: 0,
    status: 'active' as const,
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmit(formData);
  };

  return (
    <form onSubmit={handleSubmit} className=\"space-y-4\">
      <FloatingLabelInput
        label=\"Flat Number\"
        value={formData.flatNumber}
        onChange={(e) => setFormData({ ...formData, flatNumber: e.target.value })}
        required
      />

      <FloatingLabelInput
        label=\"Owner Name\"
        value={formData.ownerName}
        onChange={(e) => setFormData({ ...formData, ownerName: e.target.value })}
        required
      />

      <FloatingLabelInput
        label=\"Email\"
        type=\"email\"
        value={formData.ownerEmail}
        onChange={(e) => setFormData({ ...formData, ownerEmail: e.target.value })}
        required
      />

      <FloatingLabelInput
        label=\"Phone\"
        type=\"tel\"
        value={formData.ownerPhone}
        onChange={(e) => setFormData({ ...formData, ownerPhone: e.target.value })}
        required
      />

      <FloatingLabelInput
        label=\"Maintenance Amount\"
        type=\"number\"
        value={formData.maintenanceAmount.toString()}
        onChange={(e) =>
          setFormData({ ...formData, maintenanceAmount: parseFloat(e.target.value) })
        }
        required
      />

      <div className=\"flex gap-3 justify-end pt-4\">
        <button type=\"button\" onClick={onCancel} className=\"btn-secondary\">
          Cancel
        </button>
        <button type=\"submit\" className=\"btn-primary\">
          Add Flat
        </button>
      </div>
    </form>
  );
}
