import { Search } from 'lucide-react';
import Select from '../components/ui/Select';

interface Props {
    // Draft values
    draftStartDate: string;
    draftEndDate: string;
    draftSearchTerm: string;
    draftCategoryFilter: string;
    draftSortBy: string;

    // Setters for drafts
    setDraftStartDate: (v: string) => void;
    setDraftEndDate: (v: string) => void;
    setDraftSearchTerm: (v: string) => void;
    setDraftCategoryFilter: (v: string) => void;
    setDraftSortBy: (v: string) => void;

    // Applied values + setters (for Clear shortcut)
    startDate: string;
    endDate: string;
    setStartDate: (v: string) => void;
    setEndDate: (v: string) => void;
    searchTerm: string;
    setSearchTerm: (v: string) => void;
    selectedCategoryFilter: string;
    setSelectedCategoryFilter: (v: string) => void;
    sortBy: string;
    setSortBy: (v: string) => void;

    // metadata
    categories: { code: string; displayName: string }[];
    firstDayOfMonth: string;
    today: string;

    // Actions
    onApply: () => void;
}

export default function FilterBar(props: Props) {
    const {
        draftStartDate, draftEndDate, draftSearchTerm, draftCategoryFilter, draftSortBy,
        setDraftStartDate, setDraftEndDate, setDraftSearchTerm, setDraftCategoryFilter, setDraftSortBy,
        startDate, endDate, setStartDate, setEndDate, searchTerm, setSearchTerm,
        selectedCategoryFilter, setSelectedCategoryFilter, sortBy, setSortBy,
        categories, firstDayOfMonth, today, onApply,
    } = props;

    return (
        <div className="mt-3">
            <div className="bg-white dark:bg-slate-900 rounded-2xl p-3 border border-slate-200 dark:border-slate-800 shadow-sm">
                <div className="flex items-start sm:items-center gap-3 flex-wrap">
                    <div className="flex items-center gap-2">
                        <input
                            type="date"
                            value={draftStartDate}
                            onChange={(e) => setDraftStartDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                        <span className="text-gray-500 dark:text-gray-400">to</span>
                        <input
                            type="date"
                            value={draftEndDate}
                            onChange={(e) => setDraftEndDate(e.target.value)}
                            className="px-3 py-1.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500"
                        />
                    </div>

                    <div className="flex items-center gap-2">
                        <Select
                            options={[{ value: '', label: 'All categories' }, ...categories.map(c => ({ value: c.code, label: c.displayName }))]}
                            value={draftCategoryFilter}
                            onChange={(e) => setDraftCategoryFilter(e.target.value)}
                            className="!py-2 text-sm w-48"
                        />

                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Search vendor, description, category..."
                                value={draftSearchTerm}
                                onChange={(e) => setDraftSearchTerm(e.target.value)}
                                className="pl-10 pr-8 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500 w-64"
                            />
                        </div>

                        <Select
                            options={[
                                { value: 'date-desc', label: 'Newest' },
                                { value: 'date-asc', label: 'Oldest' },
                                { value: 'amount-desc', label: 'Highest' },
                                { value: 'amount-asc', label: 'Lowest' },
                            ]}
                            value={draftSortBy}
                            onChange={(e) => setDraftSortBy(e.target.value)}
                            className="!py-2 text-sm w-40"
                        />
                    </div>

                    <div className="ml-auto flex items-center gap-2">
                        <button
                            onClick={() => {
                                const defStart = firstDayOfMonth;
                                const defEnd = today;
                                setDraftStartDate(defStart);
                                setDraftEndDate(defEnd);
                                setDraftSearchTerm('');
                                setDraftCategoryFilter('');
                                setDraftSortBy('date-desc');
                                setStartDate(defStart);
                                setEndDate(defEnd);
                                setSearchTerm('');
                                setSelectedCategoryFilter('');
                                setSortBy('date-desc');
                            }}
                            className="btn btn-ghost btn-sm"
                        >
                            Clear
                        </button>

                        <button
                            onClick={() => {
                                setStartDate(draftStartDate);
                                setEndDate(draftEndDate);
                                setSearchTerm(draftSearchTerm);
                                setSelectedCategoryFilter(draftCategoryFilter);
                                setSortBy(draftSortBy);
                                onApply();
                            }}
                            disabled={
                                !draftStartDate || !draftEndDate || draftStartDate > draftEndDate || (
                                    draftStartDate === startDate && draftEndDate === endDate && draftSearchTerm === searchTerm && draftCategoryFilter === selectedCategoryFilter && draftSortBy === sortBy
                                )
                            }
                            className="btn btn-primary btn-sm"
                        >
                            Apply
                        </button>
                        <button className="btn btn-ghost btn-sm hidden sm:inline-flex">Close</button>
                    </div>
                </div>
            </div>
        </div>
    );
}
